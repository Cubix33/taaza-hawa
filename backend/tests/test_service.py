"""End-to-end on the in-memory store: stale station -> hold -> station returns -> graded."""
from taaza import service
from taaza.aqi import answer_for
from taaza.sources.waqi import StationReading
from taaza.store import MemoryStore

NOW = 1_790_000_000  # arbitrary fixed epoch
H = 3600


def rd(uid, name, lat, lon, ts, pm10, pm25=None):
    vals = {"pm10": pm10}
    if pm25 is not None:
        vals["pm25"] = pm25
    return StationReading(uid, name, lat, lon, ts, vals)


def seed(store, now=NOW):
    """Dwarka last seen 31 h ago; three live neighbours around 230."""
    cams = {(now - now % H) - i * H: {"pm10": 190.0, "pm25": 120.0} for i in range(-1, 49)}
    service.ingest(store, [rd(1, "Dwarka Sector 8", 28.5710, 77.0720, now - 31 * H, 180)], cams, now - 31 * H)
    live = [rd(2, "Najafgarh", 28.5700, 76.9800, now - 600, 230),
            rd(3, "Pusa", 28.6400, 77.1600, now - 900, 240),
            rd(4, "Punjabi Bagh", 28.6700, 77.1300, now - 300, 220)]
    service.ingest(store, live, cams, now)
    return cams


def test_stale_card_shows_age_interval_and_never_the_old_value_as_truth():
    s = MemoryStore()
    seed(s)
    c = service.build_card(s, 1, NOW)
    assert c["state"] == "stale" and c["age_min"] == 31 * 60
    assert c["interval"]["n_neighbours"] == 3 and c["interval"]["calibrated"] is False
    assert c["interval"]["lo"] < c["interval"]["point"] < c["interval"]["hi"]
    # answer comes from the interval's upper bound (uncalibrated band is wide -> conservative),
    # never from the stale 180
    assert c["answer"] == answer_for(c["interval"]["hi"]) == "STAY"
    assert "31 घंटे" in c["sentence_hi"] and "31 hours" in c["sentence_en"]
    for banned in ("dark", "offline", "tampered", "true AQI"):
        assert banned.lower() not in c["sentence_en"].lower()


def test_fresh_card_uses_reading_directly():
    s = MemoryStore()
    seed(s)
    c = service.build_card(s, 2, NOW)
    assert c["state"] == "fresh" and c["value"] == 230 and c["answer"] == "WAIT"
    assert c["interval"] is None


def test_hold_is_graded_by_the_stations_next_reading_only():
    s = MemoryStore()
    cams = seed(s)
    hold = service.create_hold(s, 1, NOW, email="a@b.c")
    assert hold["status"] == "PENDING"
    graded = []

    # a backfilled old hour does not grade the promise
    service.ingest(s, [rd(1, "Dwarka Sector 8", 28.5710, 77.0720, NOW - 30 * H, 175)], cams, NOW + 60, graded.append)
    assert service.get_hold(s, hold["id"])["status"] == "PENDING"

    # a reading measured after the promise does
    lo, hi = hold["lo"], hold["hi"]
    inside = round((lo + hi) / 2)
    service.ingest(s, [rd(1, "Dwarka Sector 8", 28.5710, 77.0720, NOW + 900, inside)], cams, NOW + 1000, graded.append)
    done = service.get_hold(s, hold["id"])
    assert done["status"] == "HIT" and done["actual"] == inside and len(graded) == 1

    # residual recorded for calibration
    assert service.list_stations(s)[1]["cal"]["pm10"]["residuals"]


def test_missed_reports_distance_outside_interval():
    s = MemoryStore()
    cams = seed(s)
    hold = service.create_hold(s, 1, NOW)
    service.ingest(s, [rd(1, "Dwarka Sector 8", 28.5710, 77.0720, NOW + 900, 400)], cams, NOW + 1000)
    done = service.get_hold(s, hold["id"])
    assert done["status"] == "MISSED" and done["miss_by"] == round(400 - hold["hi"])


def test_morning_predictions_scoreboard_and_expiry():
    s = MemoryStore()
    cams = seed(s)
    assert service.morning_predictions(s, NOW) == 4
    assert service.morning_predictions(s, NOW) == 0  # idempotent per day
    day = service.ist_date(NOW)
    sb = service.scoreboard(s, [day])
    assert sb["tally"]["PENDING"] == 4
    # nobody reports for 73 h -> "Missed, still waiting"
    service.ingest(s, [], cams, NOW + 73 * H)
    assert service.scoreboard(s, [day])["tally"]["MISSED_WAITING"] == 4


def test_calibration_warms_up_from_live_leave_one_out():
    s = MemoryStore()
    cams = {}
    for i in range(30):  # 30 hourly cycles of 4 stations around a wobbling level
        t = NOW + i * H
        base = 200 + 15 * ((i * 7) % 5 - 2)
        service.ingest(s, [rd(1, "A", 28.60, 77.00, t, base + 5), rd(2, "B", 28.61, 77.01, t, base),
                           rd(3, "C", 28.62, 77.02, t, base - 5), rd(4, "D", 28.63, 77.03, t, base + 2)],
                       cams, t)
    cal = service.list_stations(s)[1]["cal"]["pm10"]
    assert len(cal["residuals"]) >= 20
