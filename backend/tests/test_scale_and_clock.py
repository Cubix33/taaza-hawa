"""WAQI publishes the US-EPA AQI (1-hour) with a local-time epoch; we store CPCB-scale values at real UTC."""
import pytest

from taaza import aqi, grader, service
from taaza.sources import waqi
from taaza.store import MemoryStore

IST = 19800


@pytest.mark.parametrize("pollutant,us,cpcb", [
    # hand-worked from the aqicn calculator table and the CPCB NAQI table
    ("pm10", 176, 257.0),    # 255 + 26/50*100 = 307 ug/m3 -> 200 + 57/100*100
    ("pm10", 100, 136.67),   # 155 ug/m3 -> 100 + 55/150*100
    ("pm25", 160, 148.33),   # 55.5 + 10/50*95 = 74.5 ug/m3 -> 100 + 14.5/30*100
    ("pm25", 50, 20.0),      # 12 ug/m3 -> 12/30*50
    ("pm25", 0, 0.0),
    ("pm10", 600, 500.0),    # beyond the CPCB top: saturates by design
])
def test_us_epa_aqi_converts_to_the_cpcb_sub_index(pollutant, us, cpcb):
    assert aqi.cpcb_from_us(pollutant, us) == pytest.approx(cpcb, abs=0.01)


def test_conversion_never_reverses_order_so_a_past_hit_stays_a_hit():
    for p in aqi.POLLUTANTS:
        vals = [aqi.cpcb_from_us(p, v) for v in range(0, 700, 3)]
        assert vals == sorted(vals)


def feed(v, tz, iso=None, pm10=176, pm25=160):
    t = {"s": "2026-10-09 12:00:00", "tz": tz, "v": v}
    if iso:
        t["iso"] = iso
    return {"status": "ok", "data": {"idx": 10119, "time": t, "city": {"name": "Dwarka", "geo": [28.57, 77.07]},
                                     "iaqi": {"pm10": {"v": pm10}, "pm25": {"v": pm25}}}}


def test_parse_feed_reads_real_utc_time_not_the_local_wall_clock():
    # WAQI's own demo feed: {"s":"2026-10-09 14:00:00","tz":"+08:00","v":1791554400} is 06:00 UTC
    r = waqi.parse_feed(feed(1791554400, "+08:00", "2026-10-09T14:00:00+08:00"))
    assert r.ts == 1791525600
    assert waqi.parse_feed(feed(1791554400, "+08:00")).ts == 1791525600  # no iso: v minus tz
    assert waqi.parse_feed(feed(1791547200, "+05:30")).ts == 1791547200 - IST


def test_parse_feed_stores_cpcb_scale_values():
    r = waqi.parse_feed(feed(1791547200, "+05:30"))
    assert r.values["pm10"] == pytest.approx(257.0, abs=0.1) and r.values["pm25"] == pytest.approx(148.3, abs=0.1)


# ---------- one-time migration of what was stored before the fix ----------

NOW = 1_791_540_000
H = 3600


def legacy(store):
    """What production holds today: shifted ts (+5:30), US-scale values, no version marker."""
    for uid, name, lat, lon in ((1, "Dwarka", 28.571, 77.072), (2, "Pusa", 28.64, 77.16)):
        store.put("STATION", str(uid), {"uid": uid, "name": name, "lat": lat, "lon": lon,
                                        "cal": {"pm10": {"residuals": [5.0] * 30}}})
        for k in range(6):
            real = NOW - (6 - k) * H
            store.put(f"READ#{uid}", f"{real + IST:012d}", {"ts": real + IST, "values": {"pm10": 176.0}, "cams": {}})
    created = NOW - 4 * H + 60  # a morning promise made just after the 4-hours-ago reading
    store.put("PRED#1", "MORNING#2026-10-09", {
        "id": "1-2026-10-09", "kind": "morning", "uid": 1, "name": "Dwarka", "pollutant": "pm10",
        "created_ts": created, "date": "2026-10-09", "lo": 131.0, "hi": 221.0, "point": 176.0,
        "calibrated": False, "degraded": False, "status": "HIT", "actual": 176.0, "miss_by": 0,
        "actual_ts": NOW - 5 * H + IST})  # graded by a reading taken BEFORE the promise (the old bug)
    return created


def test_migration_moves_readings_to_real_time_and_cpcb_scale_and_regrades_honestly():
    s = MemoryStore()
    created = legacy(s)
    out = service.migrate_v2(s, NOW)
    assert out["readings"] == 12 and out["predictions"] == 1

    rows = s.query("READ#1")
    assert [r["ts"] for r in rows] == [NOW - (6 - k) * H for k in range(6)]
    assert all(r["v"] == 2 and r["values"]["pm10"] == pytest.approx(257.0, abs=0.1) for r in rows)
    assert service.latest_reading(s, 1)["ts"] == NOW - H

    p = s.get("PRED#1", "MORNING#2026-10-09")
    assert p["v"] == 2
    assert p["lo"] == pytest.approx(aqi.cpcb_from_us("pm10", 131)) and p["hi"] == pytest.approx(aqi.cpcb_from_us("pm10", 221))
    assert p["actual_ts"] > created and p["actual_ts"] == NOW - 3 * H  # the first reading AFTER the promise
    assert p["status"] == grader.grade(p["lo"], p["hi"], p["actual"]).status

    assert s.get("STATION", "1")["cal"] == {} and s.get("STATION", "1")["v"] == 2
    assert service.migrate_v2(s, NOW + 900) == {"readings": 0, "predictions": 0, "stations": 0}


def test_after_migration_a_new_reading_is_ingested_not_skipped():
    s = MemoryStore()
    legacy(s)
    service.migrate_v2(s, NOW)
    r = waqi.StationReading(1, "Dwarka", 28.571, 77.072, NOW - 600, {"pm10": 240.0})
    assert service.ingest(s, [r], {}, NOW)["new"] == 1
    c = service.build_card(s, 1, NOW)
    assert c["age_min"] == 10 and c["value"] == 240 and c["answer"] == "WAIT"


def test_a_promise_with_no_reading_after_it_goes_back_to_pending():
    s = MemoryStore()
    legacy(s)
    item = s.get("PRED#1", "MORNING#2026-10-09")
    item["created_ts"] = NOW  # after every stored reading
    s.put("PRED#1", "MORNING#2026-10-09", item)
    service.migrate_v2(s, NOW)
    p = s.get("PRED#1", "MORNING#2026-10-09")
    assert p["status"] == grader.PENDING and p.get("actual") is None
