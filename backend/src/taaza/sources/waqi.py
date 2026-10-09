"""WAQI (aqicn.org) mirror of CPCB stations. Timestamps are treated as data: the age is the product.

K3, settled 9 Oct 2026: aqicn publishes only US-EPA AQI from 1-hour readings ("only values
converted to the US EPA scale are provided"), so `parse_feed` converts them back to CPCB
sub-indices, here and nowhere else. `time.v` is the station's local wall clock written as an
epoch, so the real time comes from `time.iso` (or `v` minus `time.tz`).
"""
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import datetime

from ..aqi import cpcb_from_us
from .http import get_json

DELHI_BOUNDS = "28.40,76.84,28.88,77.35"
API = "https://api.waqi.info"


@dataclass
class StationReading:
    uid: int
    name: str
    lat: float
    lon: float
    ts: int  # real epoch seconds (UTC) of the measurement
    values: dict[str, float]  # pollutant -> CPCB sub-index


def list_station_uids(token: str, bounds: str = DELHI_BOUNDS) -> list[int]:
    j = get_json(f"{API}/map/bounds/?latlng={bounds}&networks=all&token={token}")
    if j.get("status") != "ok":
        raise RuntimeError(f"WAQI bounds error: {j.get('data')}")
    return [int(s["uid"]) for s in j["data"]]


def utc_epoch(t: dict) -> int:
    if t.get("iso"):
        return int(datetime.fromisoformat(t["iso"]).timestamp())
    tz = t.get("tz") or "+00:00"
    hh, mm = tz.lstrip("+-").split(":")
    return int(t["v"]) - (-1 if tz.startswith("-") else 1) * (int(hh) * 3600 + int(mm) * 60)


def parse_feed(j: dict) -> StationReading | None:
    if j.get("status") != "ok":
        return None
    d = j["data"]
    try:
        ts = utc_epoch(d["time"])
        geo = d["city"]["geo"]
        values = {p: round(cpcb_from_us(p, float(d["iaqi"][k]["v"])), 1) for p, k in (("pm10", "pm10"), ("pm25", "pm25"))
                  if k in d.get("iaqi", {})}
        return StationReading(int(d["idx"]), d["city"]["name"], float(geo[0]), float(geo[1]), ts, values)
    except (KeyError, TypeError, ValueError):
        return None


def fetch_feed(token: str, uid: int) -> StationReading | None:
    try:
        return parse_feed(get_json(f"{API}/feed/@{uid}/?token={token}"))
    except Exception:
        return None


def fetch_delhi(token: str, workers: int = 8) -> list[StationReading]:
    uids = list_station_uids(token)
    with ThreadPoolExecutor(max_workers=workers) as ex:
        out = list(ex.map(lambda u: fetch_feed(token, u), uids))
    return [r for r in out if r and r.values]
