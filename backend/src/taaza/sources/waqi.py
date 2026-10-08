"""WAQI (aqicn.org) mirror of CPCB stations. Timestamps are treated as data: the age is the product.

ASSUMPTION to verify under kill-test K3: iaqi.pm10.v / iaqi.pm25.v for CPCB stations are
already CPCB-scale sub-indices. If they turn out to be US-EPA-scale, convert in `parse_feed`
and nowhere else.
"""
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass

from .http import get_json

DELHI_BOUNDS = "28.40,76.84,28.88,77.35"
API = "https://api.waqi.info"


@dataclass
class StationReading:
    uid: int
    name: str
    lat: float
    lon: float
    ts: int  # epoch seconds, as reported upstream (time.v)
    values: dict[str, float]  # pollutant -> sub-index


def list_station_uids(token: str, bounds: str = DELHI_BOUNDS) -> list[int]:
    j = get_json(f"{API}/map/bounds/?latlng={bounds}&networks=all&token={token}")
    if j.get("status") != "ok":
        raise RuntimeError(f"WAQI bounds error: {j.get('data')}")
    return [int(s["uid"]) for s in j["data"]]


def parse_feed(j: dict) -> StationReading | None:
    if j.get("status") != "ok":
        return None
    d = j["data"]
    try:
        ts = int(d["time"]["v"])
        geo = d["city"]["geo"]
        values = {p: float(d["iaqi"][k]["v"]) for p, k in (("pm10", "pm10"), ("pm25", "pm25"))
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
