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
    return s
