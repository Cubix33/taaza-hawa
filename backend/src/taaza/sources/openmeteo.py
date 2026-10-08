"""Open-Meteo CAMS: the always-fresh but coarse (one ~45 km cell over Delhi) model signal."""
from __future__ import annotations

from ..aqi import sub_index
from .http import get_json

URL = ("https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}"
       "&hourly=pm10,pm2_5&past_days=2&forecast_days=1&timeformat=unixtime")
DELHI = (28.61, 77.21)


def parse_cams(j: dict) -> dict[int, dict[str, float]]:
    """-> {hour_ts: {"pm10": sub_index, "pm25": sub_index}} (hours with data only)."""
    h = j["hourly"]
    out: dict[int, dict[str, float]] = {}
    for t, p10, p25 in zip(h["time"], h["pm10"], h["pm2_5"]):
        row: dict[str, float] = {}
        if p10 is not None:
            row["pm10"] = sub_index("pm10", p10)
        if p25 is not None:
            row["pm25"] = sub_index("pm25", p25)
        if row:
            out[int(t)] = row
    return out


def fetch_cams(lat: float = DELHI[0], lon: float = DELHI[1]) -> dict[int, dict[str, float]]:
    return parse_cams(get_json(URL.format(lat=lat, lon=lon)))
