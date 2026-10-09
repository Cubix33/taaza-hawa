"""Fire context: how many fires satellites saw near Delhi, and how many were upwind.

A count, not a smoke measurement and not a cause: it never says how much smoke reached Delhi,
or whose fire it was. "Upwind" = within 45 degrees of the direction the wind came from over the
last 24 hours (speed-weighted mean). Calm air -> no upwind count at all.
"""
from __future__ import annotations

import math
import os

from .places import km
from .store import Store

DELHI = (28.61, 77.21)
RADIUS_KM = 500
WINDOW_H = 48
SECTOR_DEG = 45
CALM_KMH = 4.0
REFRESH_S = 3 * 3600  # FIRMS near-real-time data lands with ~3 h latency anyway


def bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Compass bearing (degrees from north) from point 1 to point 2."""
    p1, p2, dl = math.radians(lat1), math.radians(lat2), math.radians(lon2 - lon1)
    y = math.sin(dl) * math.cos(p2)
    x = math.cos(p1) * math.sin(p2) - math.sin(p1) * math.cos(p2) * math.cos(dl)
    return (math.degrees(math.atan2(y, x)) + 360) % 360


def mean_wind_from(wind: list[tuple[int, float, float]], now_ts: int, hours: int = 24) -> tuple[float | None, float]:
    """Speed-weighted mean 'from' direction over the last `hours`, and the mean speed."""
    rows = [(s, d) for t, s, d in wind if now_ts - hours * 3600 <= t <= now_ts]
    if not rows:
        return None, 0.0
    x = sum(s * math.sin(math.radians(d)) for s, d in rows)
    y = sum(s * math.cos(math.radians(d)) for s, d in rows)
    speed = sum(s for s, _ in rows) / len(rows)
    if speed < CALM_KMH or math.hypot(x, y) / len(rows) < CALM_KMH / 2:
        return None, speed
    return (math.degrees(math.atan2(x, y)) + 360) % 360, speed


def summarize(fires: list[tuple[float, float, int]], wind_from: float | None, speed: float, now_ts: int) -> dict:
    near = [(la, lo) for la, lo, t in fires
            if now_ts - WINDOW_H * 3600 <= t <= now_ts and km(DELHI[0], DELHI[1], la, lo) <= RADIUS_KM]
    upwind = None
    if wind_from is not None:
        def off(la, lo):
            return abs((bearing(DELHI[0], DELHI[1], la, lo) - wind_from + 180) % 360 - 180)
        upwind = sum(1 for la, lo in near if off(la, lo) <= SECTOR_DEG)
    return {"at": now_ts, "total": len(near), "upwind": upwind,
            "wind_from": None if wind_from is None else round(wind_from),
            "wind_kmh": round(speed, 1), "window_h": WINDOW_H, "radius_km": RADIUS_KM,
            "source": "NASA FIRMS (VIIRS) · wind: Open-Meteo"}


def refresh(store: Store, now_ts: int, fetch_fires=None, fetch_wind=None) -> dict | None:
    """Poller hook: refetch at most every 3 h; keeps the last good value if a fetch fails."""
    key = os.environ.get("FIRMS_MAP_KEY")
    cur = store.get("KV", "fires")
    if not key or (cur and now_ts - cur["at"] < REFRESH_S):
        return None
    from .sources import firms
    fires = (fetch_fires or (lambda: firms.fetch_fires(key, os.environ.get("FIRMS_SOURCE", "VIIRS_SNPP_NRT"))))()
    try:
        wind_from, speed = mean_wind_from((fetch_wind or firms.fetch_wind)(), now_ts)
    except Exception as e:  # no wind: still report the count, without an upwind share
        print("wind fetch failed:", repr(e))
        wind_from, speed = None, 0.0
    out = summarize(fires, wind_from, speed, now_ts)
    store.put("KV", "fires", out)
    return out


def current(store: Store, now_ts: int) -> dict | None:
    """What the pages show: nothing once the count is older than a day (no stale context)."""
    cur = store.get("KV", "fires")
    if not cur or now_ts - cur["at"] > 24 * 3600:
        return None
    return {k: cur.get(k) for k in ("at", "total", "upwind", "wind_from", "wind_kmh", "window_h", "radius_km", "source", "demo")}
