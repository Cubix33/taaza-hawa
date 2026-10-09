"""The only model: neighbour IDW + bias-corrected CAMS, wrapped in a conformal interval.

The station's own (stale) value is deliberately NOT an input: that is what lets us
calibrate on live data by masking it. It is shown as context and used only as a last
resort when nothing else exists (flagged degraded).
"""
from __future__ import annotations

import math
import statistics
from dataclasses import dataclass, field

from .conformal import conformal_offsets, widen_for_age
from .freshness import STALE_AFTER_MIN

W_NEIGHBOURS = 0.6
W_CAMS = 0.4
N_NEIGHBOURS = 3
MIN_RATIOS = 5


@dataclass
class Neighbour:
    uid: int
    name: str
    lat: float
    lon: float
    value: float  # sub-index, same pollutant
    age_min: int
    reading_ts: int | None = None


@dataclass
class Estimate:
    point: float
    lo: float
    hi: float
    calibrated: bool
    n_neighbours: int
    used_cams: bool
    degraded: bool = False  # True when only the stale own value was available
    neighbours: list[str] = field(default_factory=list)
    evidence: list[dict] = field(default_factory=list)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    p = math.pi / 180
    a = (math.sin((lat2 - lat1) * p / 2) ** 2
         + math.cos(lat1 * p) * math.cos(lat2 * p) * math.sin((lon2 - lon1) * p / 2) ** 2)
    return 12742 * math.asin(math.sqrt(a))


def pick_neighbours(lat: float, lon: float, candidates: list[Neighbour],
                    n: int = N_NEIGHBOURS) -> list[Neighbour]:
    live = [c for c in candidates if c.age_min <= STALE_AFTER_MIN]
    live.sort(key=lambda c: haversine_km(lat, lon, c.lat, c.lon))
    return live[:n]


def idw(lat: float, lon: float, ns: list[Neighbour]) -> float:
    ws = [1.0 / max(haversine_km(lat, lon, c.lat, c.lon), 0.5) for c in ns]
    return sum(w * c.value for w, c in zip(ws, ns)) / sum(ws)


def neighbour_mean(lat: float, lon: float, candidates: list[Neighbour]) -> float | None:
    ns = pick_neighbours(lat, lon, candidates)
    return idw(lat, lon, ns) if ns else None


def estimate(lat: float, lon: float, candidates: list[Neighbour], cams_si: float | None,
             cal: dict, age_hours: float, last_value: float | None = None) -> Estimate | None:
    """cal = {"residuals": [...], "ratios": [...], "offsets": [...]} for one pollutant."""
    ns = pick_neighbours(lat, lon, candidates)
    parts: list[tuple[float, float]] = []
    if ns:
        offsets = cal.get("offsets", [])
        offset = statistics.median(offsets) if offsets else 0.0
        parts.append((W_NEIGHBOURS, idw(lat, lon, ns) + offset))
    ratios = cal.get("ratios", [])
    used_cams = False
    if cams_si is not None and len(ratios) >= MIN_RATIOS:  # no ratio history -> CAMS not trusted
        parts.append((W_CAMS, cams_si * statistics.median(ratios)))
        used_cams = True
    if not parts:
        if last_value is None:
            return None
        lo, hi, calibrated = conformal_offsets([])
        lo, hi = widen_for_age(lo, hi, age_hours, calibrated)
        return Estimate(last_value, max(0.0, last_value + lo), min(500.0, last_value + hi),
                        False, 0, False, degraded=True)
    point = sum(w * v for w, v in parts) / sum(w for w, _ in parts)
    lo_o, hi_o, calibrated = conformal_offsets(cal.get("residuals", []))
    lo_o, hi_o = widen_for_age(lo_o, hi_o, age_hours, calibrated)
    distances = [haversine_km(lat, lon, c.lat, c.lon) for c in ns]
    weights = [1.0 / max(d, 0.5) for d in distances]
    evidence = [{"uid": c.uid, "name": c.name, "lat": c.lat, "lon": c.lon,
                 "value": c.value, "age_min": c.age_min, "reading_ts": c.reading_ts,
                 "distance_km": round(d, 3), "idw_share": w / sum(weights)}
                for c, d, w in zip(ns, distances, weights)]
    return Estimate(point, max(0.0, point + lo_o), min(500.0, point + hi_o), calibrated,
                    len(ns), used_cams, neighbours=[c.name for c in ns], evidence=evidence)
