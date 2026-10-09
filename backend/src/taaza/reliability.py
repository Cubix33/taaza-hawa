"""How often each station actually reports: from the readings we already store, nothing new fetched.

Window: the last 7 days, or since we started watching if that is shorter (so a new deployment
does not make every station look quiet). One reported hour = at least one reading stamped in it.
Cached in KV for an hour; the numbers move slowly and computing them reads every station's week.
"""
from __future__ import annotations

from .freshness import STALE_AFTER_MIN
from .store import Store

WINDOW_H = 7 * 24
CACHE_S = 3600
QUIET_H = STALE_AFTER_MIN / 60  # a silence longer than this is when we have to estimate


def _station_ts(store: Store, uid: int, since: int) -> list[int]:
    rows = store.query(f"READ#{uid}", limit=WINDOW_H * 6, reverse=True)
    return sorted(r["ts"] for r in rows if r["ts"] >= since)


def compute(store: Store, now_ts: int) -> dict:
    from .service import list_stations
    stations = list_stations(store)
    firsts = [r[0]["ts"] for uid in stations if (r := store.query(f"READ#{uid}", limit=1))]
    since = max(now_ts - WINDOW_H * 3600, min(firsts) if firsts else now_ts)
    hours = max(1, -(-(now_ts - since) // 3600))
    out = {}
    for uid, meta in stations.items():
        ts = _station_ts(store, uid, since)
        reported = len({t // 3600 for t in ts})
        edges = [since, *ts, now_ts]
        gaps = [b - a for a, b in zip(edges, edges[1:])]
        out[str(uid)] = {"uid": uid, "name": meta["name"], "reported_h": min(reported, hours),
                         "pct": round(100 * min(reported, hours) / hours),
                         "longest_gap_h": round(max(gaps) / 3600),
                         "silences": sum(1 for g in gaps if g > QUIET_H * 3600)}
    return {"at": now_ts, "window_h": hours, "stations": out}


def get(store: Store, now_ts: int) -> dict:
    cur = store.get("KV", "reliability")
    if cur and now_ts - cur["at"] < CACHE_S:
        return cur
    cur = compute(store, now_ts)
    store.put("KV", "reliability", cur)
    return store.get("KV", "reliability")


def for_station(store: Store, uid: int, now_ts: int) -> dict | None:
    r = get(store, now_ts)
    s = r["stations"].get(str(uid))
    return {**s, "window_h": r["window_h"]} if s else None
