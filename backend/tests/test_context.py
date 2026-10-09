"""Fire context (NASA FIRMS + wind) and station reliability."""
from datetime import datetime, timezone

from handlers import api
from taaza import reliability, school, smoke
from taaza.sources import firms
from taaza.store import MemoryStore

from test_service import NOW, H, rd, seed
from taaza import service

AMRITSAR = (31.63, 74.87)   # north-west of Delhi, ~400 km
AGRA = (27.18, 78.01)       # south-south-east, ~180 km
LAHORE_FAR = (33.6, 73.0)   # outside 500 km


def test_firms_csv_is_parsed_in_utc():
    text = ("latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence\n"
            "30.71,76.21,330.1,0.4,0.4,2026-10-08,0812,N,VIIRS,n\n"
            "bad,row\n")
    (lat, lon, ts), = firms.parse_csv(text)
    assert (lat, lon) == (30.71, 76.21)
    assert datetime.fromtimestamp(ts, timezone.utc).strftime("%Y-%m-%d %H:%M") == "2026-10-08 08:12"


def test_bearing_and_mean_wind():
    assert 300 < smoke.bearing(*smoke.DELHI, *AMRITSAR) < 330
    assert 140 < smoke.bearing(*smoke.DELHI, *AGRA) < 165
    nw = [(NOW - i * H, 10.0, 315.0) for i in range(24)]
    d, sp = smoke.mean_wind_from(nw, NOW)
    assert round(d) == 315 and sp == 10.0
    # wrapping around north: 350 and 10 average to 0, not 180
    d, _ = smoke.mean_wind_from([(NOW, 10.0, 350.0), (NOW - H, 10.0, 10.0)], NOW)
    assert d < 1 or d > 359
    assert smoke.mean_wind_from([(NOW, 1.0, 90.0)], NOW)[0] is None  # calm


def test_summary_counts_only_recent_nearby_fires_and_upwind_ones():
    fires = [(*AMRITSAR, NOW - H)] * 3 + [(*AGRA, NOW - 2 * H)] + [(*LAHORE_FAR, NOW - H)] + [(*AMRITSAR, NOW - 60 * H)]
    out = smoke.summarize(fires, 315.0, 10.0, NOW)
    assert out["total"] == 4 and out["upwind"] == 3
    assert smoke.summarize(fires, None, 1.0, NOW)["upwind"] is None


def test_refresh_needs_a_key_and_waits_three_hours(monkeypatch):
    s = MemoryStore()
    monkeypatch.delenv("FIRMS_MAP_KEY", raising=False)
    assert smoke.refresh(s, NOW) is None
    monkeypatch.setenv("FIRMS_MAP_KEY", "k")
    fires = lambda: [(*AMRITSAR, NOW - H)]  # noqa: E731
    wind = lambda: [(NOW - H, 12.0, 300.0)]  # noqa: E731
    assert smoke.refresh(s, NOW, fires, wind)["total"] == 1
    assert smoke.refresh(s, NOW + H, fires, wind) is None
    assert smoke.current(s, NOW + H)["upwind"] == 1
    assert smoke.current(s, NOW + 25 * H) is None  # never show a day-old count


def test_reliability_shows_the_quiet_station():
    s = MemoryStore()
    # Najafgarh reported every hour of the last 31; Dwarka has been quiet all that time
    for h in range(31, 0, -1):
        service.ingest(s, [rd(2, "Najafgarh", 28.57, 76.98, NOW - h * H, 200)], {}, NOW - h * H)
    seed(s)
    rel = reliability.compute(s, NOW)
    dwarka, najafgarh = rel["stations"]["1"], rel["stations"]["2"]
    assert dwarka["longest_gap_h"] >= 31 and dwarka["silences"] >= 1
    assert dwarka["pct"] < najafgarh["pct"]
    code, board = api.route("GET", "/scoreboard", {}, {}, s, NOW)
    pcts = [r["pct"] for r in board["reliability"]["stations"]]
    assert pcts == sorted(pcts)
    card = api.route("GET", "/card", {"uid": "1"}, {}, s, NOW)[1]
    assert card["reliability"]["uid"] == 1 and card["fires"] is None


def test_school_plan_keeps_the_fire_context_of_its_morning(monkeypatch):
    monkeypatch.setenv("FIRMS_MAP_KEY", "k")
    morning = NOW + 11 * H + 1000  # 07:00 IST, as in test_school
    s = MemoryStore()
    seed(s, morning)
    smoke.refresh(s, morning, lambda: [(*AMRITSAR, morning - H)] * 5, lambda: [(morning - H, 10.0, 315.0)])
    sc, _ = school.register(s, "Fire School", 1, morning, lang="en")
    day = school.ensure_day(s, sc, morning)
    assert day["fires"]["total"] == 5 and day["fires"]["upwind"] == 5
    _, body = school.plan_text(sc, day)
    assert "5 fires" in body and "north-west" in body and "not a smoke measurement" in body
    for banned in ("caused", "because of", "stubble burning by", "farmers"):
        assert banned not in body.lower()
