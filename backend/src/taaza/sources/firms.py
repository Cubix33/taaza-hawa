"""NASA FIRMS active-fire detections (VIIRS, near real time) and the wind over Delhi (Open-Meteo).

FIRMS needs a free MAP_KEY (firms.modaps.eosdis.nasa.gov/api/map_key). One satellite source only,
so one fire is not counted twice by two satellites passing over it.
"""
from __future__ import annotations

import csv
import io
from datetime import datetime, timezone

from .http import get_bytes, get_json

AREA = "72,26,80,33"  # west,south,east,north: Delhi plus Punjab, Haryana, west UP and north Rajasthan
URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv/{key}/{source}/{area}/{days}"
WIND = ("https://api.open-meteo.com/v1/forecast?latitude=28.61&longitude=77.21"
        "&hourly=wind_speed_10m,wind_direction_10m&past_days=1&forecast_days=1&timeformat=unixtime")


def parse_csv(text: str) -> list[tuple[float, float, int]]:
    """-> [(lat, lon, detected_ts)]; acq_date/acq_time are UTC (time as HHMM)."""
    out = []
    for row in csv.DictReader(io.StringIO(text)):
        try:
            hhmm = row["acq_time"].zfill(4)
            t = datetime.strptime(f"{row['acq_date']} {hhmm}", "%Y-%m-%d %H%M").replace(tzinfo=timezone.utc)
            out.append((float(row["latitude"]), float(row["longitude"]), int(t.timestamp())))
        except (KeyError, ValueError, TypeError, AttributeError):  # short or malformed row
            continue
    return out


def fetch_fires(key: str, source: str = "VIIRS_SNPP_NRT", days: int = 3) -> list[tuple[float, float, int]]:
    text = get_bytes(URL.format(key=key, source=source, area=AREA, days=days), timeout=30).decode("utf-8", "replace")
    if not text.startswith("latitude"):  # FIRMS answers errors (bad key, limit) as plain text
        raise RuntimeError(f"FIRMS: {text[:120]}")
    return parse_csv(text)


def parse_wind(j: dict) -> list[tuple[int, float, float]]:
    """-> [(hour_ts, speed_kmh, from_deg)] for hours with data."""
    h = j["hourly"]
    return [(int(t), s, d) for t, s, d in zip(h["time"], h["wind_speed_10m"], h["wind_direction_10m"])
            if s is not None and d is not None]


def fetch_wind() -> list[tuple[int, float, float]]:
    return parse_wind(get_json(WIND, timeout=15))
