"""SYNTHETIC demo data for local UI development and rehearsal. Never deployed, always labelled.

Station names and coordinates are real; every value is generated. Two stations (Dwarka Sector 8,
Anand Vihar) stop reporting ~31 h / ~12 h ago so the stale branch can be seen without a live event.
"""
from __future__ import annotations

import math
import random

from . import service
from .sources.waqi import StationReading
from .store import MemoryStore

# uid, name, lat, lon, hotspot bias (sub-index points)
STATIONS = [
    (1, "Dwarka Sector 8", 28.5710, 77.0720, 25), (2, "Anand Vihar", 28.6469, 77.3158, 30),
    (3, "Mundka", 28.6823, 77.0306, 20), (4, "Rohini", 28.7324, 77.1198, 10),
    (5, "R K Puram", 28.5633, 77.1869, 0), (6, "Okhla Phase-2", 28.5308, 77.2710, 5),
    (7, "Punjabi Bagh", 28.6740, 77.1310, 12), (8, "Wazirpur", 28.6997, 77.1651, 15),
    (9, "ITO", 28.6286, 77.2410, 5), (10, "Jahangirpuri", 28.7330, 77.1700, 18),
    (11, "Bawana", 28.7762, 77.0511, 14), (12, "Pusa", 28.6396, 77.1573, -5),
    (13, "Najafgarh", 28.6100, 76.9800, 0), (14, "Vivek Vihar", 28.6723, 77.3152, 12),
]
STALE_HOURS = {1: 31, 2: 12}


def seed(now_ts: int, hours: int = 72, seed_: int = 11) -> MemoryStore:
    rng = random.Random(seed_)
    s = MemoryStore()
    start = now_ts - hours * 3600
    for h in range(hours + 1):
        t = start + h * 3600
        city = 190 + 40 * math.sin(h / 5.0) + rng.gauss(0, 8)
        cams = {t - t % 3600: {"pm10": city * 0.75, "pm25": city * 0.55}}
        rows = []
        for uid, name, lat, lon, bias in STATIONS:
            if uid in STALE_HOURS and t > now_ts - STALE_HOURS[uid] * 3600:
                continue
            v = max(20.0, city + bias + rng.gauss(0, 12))
            rows.append(StationReading(uid, name, lat, lon, t - 600, {"pm10": round(v), "pm25": round(v * 0.7)}))
        service.ingest(s, rows, cams, t)
        if service.datetime.fromtimestamp(t, service.IST).hour == 6:
            service.morning_predictions(s, t)
    # a plausible October fire count, labelled demo like everything else here
    s.put("KV", "fires", {"at": now_ts, "total": 312, "upwind": 268, "wind_from": 315, "wind_kmh": 9.5,
                          "window_h": 48, "radius_km": 500, "source": "NASA FIRMS (VIIRS) · wind: Open-Meteo",
                          "demo": True})
    return s


# ---------- a labelled demo network for the Bad-air plan (local demo server only) ----------
# Fictional organisations, every name marked "(demo)". A week of synthetic history so the
# checklist, the 30-day record and the public action ledger have something to show.
NETWORK = [
    ("Nilgiri Public School (demo)", "school", 1, None),
    ("Yamuna Girls School (demo)", "school", 2, None),
    ("Metro site crew (demo)", "work", None, [("ISBT gate", 2), ("ITO crossing", 9), ("Najafgarh depot", 13)]),
    ("Okhla delivery hub (demo)", "work", None, [("Okhla hub", 6)]),
    ("Sector 8 RWA (demo)", "community", 1, None),
]


def seed_network(store, now_ts: int, days: int = 6) -> list[dict]:
    from datetime import datetime, timedelta

    from . import school
    rng = random.Random(7)
    names = {uid: name for uid, name, *_ in STATIONS}
    out = []
    for name, kind, uid, zones in NETWORK:
        zs = [{"name": zn, "uid": zu} for zn, zu in zones] if zones else None
        org, _ = school.register(store, name, uid or zs[0]["uid"], now_ts - days * 86400, lang="hi",
                                 kind=kind, zones=zs, shift=(8, 18) if kind == "work" else None)
        for i in range(days, 0, -1):
            t = datetime.fromtimestamp(now_ts, service.IST).replace(hour=6, minute=30, second=0) - timedelta(days=i)
            ts, date = int(t.timestamp()), t.date().isoformat()

            def reading(u):
                v = int(rng.choice([170, 215, 240, 265, 290, 320, 345]))
                return {"uid": u, "station": names[u], "level": school.level_for(v),
                        "basis": {"state": "fresh", "age_min": rng.randint(10, 55), "value": v}}
            if kind == "work":
                zd = [{"name": z["name"], **reading(z["uid"])} for z in zs]
                worst = max(zd, key=lambda z: z["level"])
                day = {"uid": worst["uid"], "station": worst["station"], "level": worst["level"],
                       "basis": worst["basis"], "zones": zd}
            else:
                day = reading(uid)
            day.update(date=date, decided_ts=ts, kind=kind)
            roll = rng.random()
            todo = school.checklist(kind, day["level"])
            if roll < 0.62 and todo:      # opened and acted on
                day["seen_ts"] = ts + 1200
                day["acts"] = {a: ts + 1500 + 300 * k for k, a in enumerate(todo) if rng.random() < 0.8} or {todo[0]: ts + 1500}
            elif roll < 0.82:             # opened, nothing marked
                day["seen_ts"] = ts + 2400
            store.put(f"SDAY#{org['id']}", date, day)
        out.append(org)
    return out
