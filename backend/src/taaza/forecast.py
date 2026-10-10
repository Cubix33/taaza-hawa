"""Short-horizon forecasts, kept separate from the stale-reading estimate ledger.

The model supplies quantiles; this module owns the product safety rules, storage and
public grading.  A forecast never determines the current card verdict.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Callable

from . import grader

IST = timezone(timedelta(hours=5, minutes=30))
HOUR = 3600
FRESH_MINUTES = 180
HORIZONS = 3

Predict = Callable[[list[float], int], list[tuple[float, float, float]]]


def _hour(ts: int) -> int:
    return ts - ts % HOUR


def _series(store, uid: int, pollutant: str, now_ts: int) -> list[float] | None:
    """Latest value in each of 72 whole hours, with no hidden imputation."""
    start = _hour(now_ts) - 72 * HOUR
    values: dict[int, float] = {}
    for row in store.query(f"READ#{uid}"):
        if start <= row["ts"] <= now_ts and pollutant in row["values"]:
            values[_hour(row["ts"])] = row["values"][pollutant]
    hours = [values.get(start + i * HOUR) for i in range(73)]
    if sum(v is None for v in hours[-48:]) > 12:
        return None
    # Chronos accepts missing values, but the current injected interface is numeric.
    # Only short gaps are filled; longer gaps reject this station.
    out: list[float] = []
    last = None
    gap = 0
    for value in hours:
        if value is None:
            gap += 1
            if last is None or gap > 2:
                return None
            out.append(last)
        else:
            gap = 0
            last = float(value)
            out.append(last)
    return out


def run(store, now_ts: int, predict: Predict, mode: str = "shadow") -> int:
    """Forecast every eligible fresh station.  `off` performs no write."""
    if mode == "off":
        return 0
    created = 0
    for meta in store.query("STATION"):
        uid = int(meta["uid"])
        rows = store.query(f"READ#{uid}", limit=1, reverse=True)
        if not rows or (now_ts - rows[0]["ts"]) // 60 > FRESH_MINUTES:
            continue
        latest = rows[0]
        pollutant = max(latest["values"], key=latest["values"].get)
        series = _series(store, uid, pollutant, now_ts)
        if series is None:
            continue
        triples = predict(series, HORIZONS)
        if len(triples) != HORIZONS:
            raise ValueError("predict must return three hourly quantile triples")
        hours = []
        for horizon, triple in enumerate(triples, 1):
            lo, mid, hi = (round(float(x), 1) for x in triple)
            if not lo <= mid <= hi:
                raise ValueError("forecast quantiles must be ordered")
            hours.append({"h": horizon, "target_ts": _hour(now_ts) + horizon * HOUR,
                          "lo": lo, "mid": mid, "hi": hi, "status": grader.PENDING})
        item = {"uid": uid, "created_ts": now_ts, "pollutant": pollutant,
                "mode": mode, "hours": hours, "model": "chronos", "v": 1}
        store.put(f"FCST#{uid}", f"{now_ts:012d}", item)
        created += 1
    return created


def resolve(store, uid: int, reading: dict, now_ts: int) -> int:
    """Grade each target only with the first valid reading after that target."""
    count = 0
    for item in store.query(f"FCST#{uid}"):
        if item.get("pollutant") not in reading["values"]:
            continue
        changed = False
        for hour in item["hours"]:
            if hour["status"] != grader.PENDING or reading["ts"] < hour["target_ts"]:
                continue
            if reading["ts"] > hour["target_ts"] + 90 * 60:
                continue
            g = grader.grade(hour["lo"], hour["hi"], reading["values"][item["pollutant"]])
            hour.update(status=g.status, actual=g.actual, miss_by=g.miss_by, actual_ts=reading["ts"], graded_at=now_ts)
            count += 1; changed = True
        if changed:
            store.put(item["pk"], item["sk"], item)
    return count


def expire(store, now_ts: int) -> int:
    count = 0
    for meta in store.query("STATION"):
        for item in store.query(f"FCST#{meta['uid']}"):
            changed = False
            for hour in item["hours"]:
                if hour["status"] == grader.PENDING and now_ts > hour["target_ts"] + 3 * HOUR:
                    hour["status"] = grader.MISSED_WAITING; changed = True; count += 1
            if changed:
                store.put(item["pk"], item["sk"], item)
    return count


def for_card(store, uid: int, now_ts: int, answer: str, state: str, mode: str) -> dict | None:
    if mode != "on" or state != "fresh" or answer not in {"WAIT", "STAY"}:
        return None
    runs = store.query(f"FCST#{uid}", limit=1, reverse=True)
    if not runs or now_ts - runs[0]["created_ts"] > 90 * 60:
        return None
    item = runs[0]
    threshold = 200 if answer == "WAIT" else 300
    better = next(({"target_ts": h["target_ts"], "threshold": threshold} for h in item["hours"] if h["hi"] <= threshold), None)
    age = max(0, (now_ts - item["created_ts"]) // 60)
    time = datetime.fromtimestamp(better["target_ts"], IST).strftime("%H:%M") if better else None
    en = (f"Likely {threshold} or below by about {time} (forecast made {age} min ago)."
          if better else f"We can't confidently predict a drop to {threshold} or below in the next 3 hours (forecast made {age} min ago).")
    hi = (f"लगभग {time} तक {threshold} या उससे कम होने की संभावना (अनुमान {age} मिनट पहले बना)।"
          if better else f"अगले 3 घंटे में {threshold} या उससे कम होने का भरोसेमंद अनुमान नहीं है (अनुमान {age} मिनट पहले बना)।")
    return {"made_ts": item["created_ts"], "age_min": age, "pollutant": item["pollutant"], "hours": item["hours"],
            "better": better, "sentence_en": en, "sentence_hi": hi, "record": accuracy(store)}


def accuracy(store) -> dict:
    hits = misses = unverified = 0
    by_horizon = {str(h): {"hits": 0, "misses": 0, "unverified": 0} for h in range(1, HORIZONS + 1)}
    for meta in store.query("STATION"):
        for item in store.query(f"FCST#{meta['uid']}"):
            for hour in item["hours"]:
                bucket = by_horizon[str(hour["h"])]
                if hour["status"] == grader.HIT: hits += 1; bucket["hits"] += 1
                elif hour["status"] == grader.MISSED: misses += 1; bucket["misses"] += 1
                elif hour["status"] == grader.MISSED_WAITING: unverified += 1; bucket["unverified"] += 1
    return {"hits": hits, "misses": misses, "graded": hits + misses, "unverified": unverified, "by_horizon": by_horizon}
