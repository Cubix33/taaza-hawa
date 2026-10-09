"""Orchestration over the Store: ingest -> calibrate -> grade -> card / hold / scoreboard."""
from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from typing import Callable

from . import grader, texts
from .aqi import LABEL, POLLUTANTS, answer_for, band_names
from .estimate import Estimate, Neighbour, estimate, neighbour_mean
from .freshness import age_minutes, is_stale
from .sources.waqi import StationReading
from .store import Store

IST = timezone(timedelta(hours=5, minutes=30))
CAL_MAX = 200

HoldGraded = Callable[[dict], None]


def ist_date(ts: int) -> str:
    return datetime.fromtimestamp(ts, IST).date().isoformat()


# ---------- reads ----------

def list_stations(store: Store) -> dict[int, dict]:
    return {int(i["sk"]): i for i in store.query("STATION")}


def latest_reading(store: Store, uid: int) -> dict | None:
    r = store.query(f"READ#{uid}", limit=1, reverse=True)
    return r[0] if r else None


def get_cams(store: Store) -> dict[int, dict[str, float]]:
    kv = store.get("KV", "cams")
    return {int(k): v for k, v in kv["hours"].items()} if kv else {}


def cams_at(cams: dict[int, dict[str, float]], ts: int, pollutant: str) -> float | None:
    row = cams.get(ts - ts % 3600)
    return row.get(pollutant) if row else None


def candidates(store: Store, pollutant: str, exclude_uid: int, now_ts: int,
               stations: dict[int, dict] | None = None) -> list[Neighbour]:
    out: list[Neighbour] = []
    for uid, meta in (stations or list_stations(store)).items():
        if uid == exclude_uid:
            continue
        r = latest_reading(store, uid)
        if r and pollutant in r["values"]:
            out.append(Neighbour(uid, meta["name"], meta["lat"], meta["lon"],
                                 r["values"][pollutant], age_minutes(now_ts, r["ts"]), r["ts"]))
    return out


def cal_for(meta: dict, pollutant: str) -> dict:
    return (meta.get("cal") or {}).get(pollutant, {})


def governing(values: dict[str, float]) -> str:
    return max(values, key=lambda p: values[p])


# ---------- ingest, calibration, grading ----------

def _push(cal: dict, key: str, v: float) -> None:
    arr = cal.setdefault(key, [])
    arr.append(round(v, 2))
    del arr[:-CAL_MAX]


def ingest(store: Store, readings: list[StationReading], cams: dict[int, dict[str, float]],
           now_ts: int, on_hold_graded: HoldGraded | None = None) -> dict:
    if cams:
        store.put("KV", "cams", {"hours": {str(k): v for k, v in cams.items()}, "fetched_at": now_ts})
    new: list[StationReading] = []
    for r in readings:
        meta = store.get("STATION", str(r.uid)) or {"cal": {}}
        meta.update(uid=r.uid, name=r.name, lat=r.lat, lon=r.lon)
        store.put("STATION", str(r.uid), meta)
        prev = latest_reading(store, r.uid)
        if prev and prev["ts"] >= r.ts:
            continue
        store.put(f"READ#{r.uid}", f"{r.ts:012d}", {
            "ts": r.ts, "values": r.values,
            "cams": {p: c for p in r.values if (c := cams_at(cams, r.ts, p)) is not None}})
        new.append(r)

    stations = list_stations(store)
    graded = 0
    for r in new:
        meta = stations[r.uid]
        if age_minutes(now_ts, r.ts) <= 180:
            _calibrate(store, meta, r, cams, now_ts, stations)
        graded += _resolve(store, meta, r, now_ts, on_hold_graded)
    expired = _expire_morning(store, stations, now_ts)
    store.put("KV", "poll", {"at": now_ts, "stations": len(readings), "new": len(new),
                             "graded": graded, "expired": expired})
    return {"stations": len(readings), "new": len(new), "graded": graded, "expired": expired}


def _calibrate(store: Store, meta: dict, r: StationReading, cams: dict, now_ts: int,
               stations: dict[int, dict]) -> None:
    """Leave-one-out: estimate this station without its own reading, compare with what it said."""
    changed = False
    for p, actual in r.values.items():
        cal = meta.setdefault("cal", {}).setdefault(p, {})
        cands = candidates(store, p, r.uid, now_ts, stations)
        c = cams_at(cams, r.ts, p)
        if c:
            _push(cal, "ratios", actual / c)
        nm = neighbour_mean(r.lat, r.lon, cands)
        if nm is not None:
            _push(cal, "offsets", actual - nm)
        est = estimate(r.lat, r.lon, cands, c, cal, 0.0)
        if est and not est.degraded:
            _push(cal, "residuals", actual - est.point)
        changed = True
    if changed:
        store.put("STATION", str(r.uid), meta)


def _resolve(store: Store, meta: dict, r: StationReading, now_ts: int,
             on_hold_graded: HoldGraded | None) -> int:
    n = 0
    for item in store.query(f"PRED#{r.uid}"):
        if item.get("status") != grader.PENDING or item["pollutant"] not in r.values:
            continue
        if not grader.is_judge_reading(item["created_ts"], r.ts):
            continue
        g = grader.grade(item["lo"], item["hi"], r.values[item["pollutant"]])
        item.update(status=g.status, actual=g.actual, miss_by=g.miss_by, actual_ts=r.ts,
                    graded_at=now_ts)
        store.put(item["pk"], item["sk"], item)
        n += 1
        if item["kind"] == "hold" and on_hold_graded:
            on_hold_graded(item)
        if item.get("calibrated_basis", True):
            cal = meta.setdefault("cal", {}).setdefault(item["pollutant"], {})
            _push(cal, "residuals", g.actual - item["point"])
            store.put("STATION", str(r.uid), meta)
    return n


def _expire_morning(store: Store, stations: dict[int, dict], now_ts: int) -> int:
    n = 0
    for uid in stations:
        for item in store.query(f"PRED#{uid}", prefix="MORNING#"):
            if item["status"] == grader.PENDING and grader.expired(item["created_ts"], now_ts):
                item["status"] = grader.MISSED_WAITING
                store.put(item["pk"], item["sk"], item)
                n += 1
    return n


# ---------- cards ----------

def _estimate_for(store: Store, meta: dict, pollutant: str, last: dict | None,
                  now_ts: int, cams: dict) -> Estimate | None:
    cands = candidates(store, pollutant, meta["uid"], now_ts)
    age_h = (age_minutes(now_ts, last["ts"]) / 60) if last else 24.0
    c = cams_at(cams, now_ts, pollutant)
    return estimate(meta["lat"], meta["lon"], cands, c, cal_for(meta, pollutant), age_h,
                    last["values"].get(pollutant) if last else None)


def build_card(store: Store, uid: int, now_ts: int) -> dict | None:
    meta = store.get("STATION", str(uid))
    if not meta:
        return None
    last = latest_reading(store, uid)
    card: dict = {"uid": uid, "name": meta["name"], "now": now_ts,
                  "lat": meta["lat"], "lon": meta["lon"],
                  "evidence": {"neighbours": [], "cams": {"used": False}},
                  "question_hi": texts.QUESTION_HI, "question_en": texts.QUESTION_EN,
                  "participation": store.get("KV", "bulletin"),
                  "yesterday": _yesterday(store, uid, now_ts)}
    if not last:
        card.update(state="no_data", answer="UNKNOWN", **_answer_texts("UNKNOWN"),
                    sentence_hi="इस स्टेशन की कोई रीडिंग अभी उपलब्ध नहीं।",
                    sentence_en="No reading is available for this station yet.", can_hold=False)
        return card
    age = age_minutes(now_ts, last["ts"])
    p = governing(last["values"])
    card.update(pollutant=p, pollutant_label=LABEL[p], reading_ts=last["ts"], age_min=age,
                stale=is_stale(age), source="WAQI (CPCB mirror)")
    if not is_stale(age):
        v = int(round(last["values"][p]))
        ans = answer_for(v)
        hi_s, en_s = texts.fresh_sentence(meta["name"], p, v, age)
        en_band, hi_band = band_names(v)
        # spec: a fresh reading needs no promise; "Check it and tell me" is for estimates only
        card.update(state="fresh", value=v, answer=ans, band_en=en_band, band_hi=hi_band,
                    sentence_hi=hi_s, sentence_en=en_s, interval=None, can_hold=False,
                    **_answer_texts(ans))
        return card
    est = _estimate_for(store, meta, p, last, now_ts, get_cams(store))
    if est is None:
        hi_s, en_s = texts.no_estimate_sentence(meta["name"], age)
        card.update(state="stale_no_estimate", answer="UNKNOWN", sentence_hi=hi_s,
                    sentence_en=en_s, interval=None, can_hold=False, **_answer_texts("UNKNOWN"))
        return card
    lo, hi = int(round(est.lo)), int(round(est.hi))
    ans = answer_for(est.hi)
    hi_s, en_s = texts.stale_sentence(meta["name"], age, lo, hi, est.n_neighbours,
                                      est.used_cams, est.calibrated)
    en_band, hi_band = band_names(est.hi)
    card.update(state="stale", answer=ans, band_en=en_band, band_hi=hi_band,
                evidence={"neighbours": est.evidence, "pollutant": p,
                          "cams": {"used": est.used_cams}, "policy_version": "idw-cams-v1"},
                sentence_hi=hi_s, sentence_en=en_s, can_hold=True,
                last_value=int(round(last["values"][p])),
                interval={"lo": lo, "hi": hi, "point": int(round(est.point)),
                          "calibrated": est.calibrated, "n_neighbours": est.n_neighbours,
                          "used_cams": est.used_cams, "neighbours": est.neighbours,
                          "degraded": est.degraded},
                **_answer_texts(ans))
    return card


def _answer_texts(ans: str) -> dict:
    return {"answer_hi": texts.ANSWER_HI[ans], "answer_en": texts.ANSWER_EN[ans]}


def _yesterday(store: Store, uid: int, now_ts: int) -> dict | None:
    y = (datetime.fromtimestamp(now_ts, IST).date() - timedelta(days=1)).isoformat()
    item = store.get(f"PRED#{uid}", f"MORNING#{y}")
    if not item:
        return None
    hi_t, en_t = texts.yesterday_line(round(item["lo"]), round(item["hi"]), item["status"],
                                      None if item.get("actual") is None else round(item["actual"]),
                                      item.get("miss_by", 0))
    return {"status": item["status"], "hi": hi_t, "en": en_t}


# ---------- promises ----------

def _new_prediction(store: Store, meta: dict, kind: str, sk: str, pid: str, now_ts: int,
                    extra: dict | None = None) -> dict | None:
    last = latest_reading(store, meta["uid"])
    if not last:
        return None
    p = governing(last["values"])
    est = _estimate_for(store, meta, p, last, now_ts, get_cams(store))
    if est is None:
        return None
    item = {"id": pid, "kind": kind, "uid": meta["uid"], "name": meta["name"], "pollutant": p,
            "created_ts": now_ts, "date": ist_date(now_ts), "lo": est.lo, "hi": est.hi,
            "point": est.point, "calibrated": est.calibrated, "degraded": est.degraded,
            "status": grader.PENDING, **(extra or {})}
    # a degraded (own-stale-value-only) estimate must not pollute the calibration residuals
    item["calibrated_basis"] = not est.degraded
    store.put(f"PRED#{meta['uid']}", sk, item)
    return item


def create_hold(store: Store, uid: int, now_ts: int, email: str | None = None) -> dict | None:
    meta = store.get("STATION", str(uid))
    if not meta:
        return None
    hid = f"{uid}-{now_ts}-{secrets.token_hex(2)}"
    return _new_prediction(store, meta, "hold", f"HOLD#{hid}", hid, now_ts,
                           {"email": email} if email else None)


def get_hold(store: Store, hold_id: str) -> dict | None:
    try:
        uid = int(hold_id.split("-", 1)[0])
    except ValueError:
        return None
    return store.get(f"PRED#{uid}", f"HOLD#{hold_id}")


def morning_predictions(store: Store, now_ts: int) -> int:
    day = ist_date(now_ts)
    n = 0
    for uid, meta in list_stations(store).items():
        sk = f"MORNING#{day}"
        if store.get(f"PRED#{uid}", sk):
            continue
        if _new_prediction(store, meta, "morning", sk, f"{uid}-{day}", now_ts):
            n += 1
    return n


def scoreboard(store: Store, dates: list[str]) -> dict:
    rows, tally = [], {"HIT": 0, "MISSED": 0, "MISSED_WAITING": 0, "PENDING": 0}
    for uid, meta in sorted(list_stations(store).items(), key=lambda kv: kv[1]["name"]):
        days = {}
        for d in dates:
            item = store.get(f"PRED#{uid}", f"MORNING#{d}")
            if item:
                days[d] = {"status": item["status"], "lo": round(item["lo"]), "hi": round(item["hi"]),
                           "actual": None if item.get("actual") is None else round(item["actual"]),
                           "miss_by": item.get("miss_by", 0), "pollutant": LABEL[item["pollutant"]]}
                tally[item["status"]] = tally.get(item["status"], 0) + 1
        rows.append({"uid": uid, "name": meta["name"], "days": days})
    return {"dates": dates, "rows": rows, "tally": tally,
            "participation": store.get("KV", "bulletin"), "poll": store.get("KV", "poll")}


def station_list(store: Store, now_ts: int) -> list[dict]:
    out = []
    for uid, m in list_stations(store).items():
        r = latest_reading(store, uid)
        aqi = round(max(r["values"].values())) if r and r["values"] else None
        out.append({"uid": uid, "name": m["name"], "lat": m["lat"], "lon": m["lon"],
                    "age_min": age_minutes(now_ts, r["ts"]) if r else None, "aqi": aqi,
                    "reading_ts": r["ts"] if r else None,
                    "values": r["values"] if r else {}, "source": "WAQI (CPCB mirror)"})
    return sorted(out, key=lambda s: s["name"])


MORNING_AT = (6, 30)  # IST


def ensure_morning(store: Store, now_ts: int) -> int:
    """Catch-up for the 06:30 job: a stack deployed (or a run missed) after 06:30 still gets
    today's promises on the next poll. Idempotent: existing promises are left alone."""
    t = datetime.fromtimestamp(now_ts, IST)
    if (t.hour, t.minute) < MORNING_AT:
        return 0
    return morning_predictions(store, now_ts)


def recent_holds(store: Store, limit: int = 20) -> list[dict]:
    """Latest "Check it and tell me" promises across all stations, for the public record (no emails)."""
    items = []
    for uid in list_stations(store):
        items.extend(store.query(f"PRED#{uid}", prefix="HOLD#"))
    items.sort(key=lambda i: i["created_ts"], reverse=True)
    keep = ("name", "uid", "pollutant", "created_ts", "lo", "hi", "status", "actual", "miss_by")
    return [{k: i.get(k) for k in keep} for i in items[:limit]]


def history(store: Store, uid: int, now_ts: int, hours: int = 24) -> list[dict]:
    """Last `hours` of readings for one station as [{ts, aqi}], oldest first. AQI = worst sub-index."""
    since = now_ts - hours * 3600
    rows = store.query(f"READ#{uid}", limit=hours * 6, reverse=True)
    out = [{"ts": r["ts"], "aqi": round(max(r["values"].values()))} for r in rows if r["ts"] >= since and r["values"]]
    return sorted(out, key=lambda r: r["ts"])


def accuracy(store: Store) -> dict:
    """How often observed readings landed inside the range.
    Only promises with an observed reading (HIT or MISSED) are graded for range accuracy;
    unverified timeouts ('couldn't verify', MISSED_WAITING) are tracked separately."""
    per, hits, graded, unverified = [], 0, 0, 0
    for uid, meta in list_stations(store).items():
        h = m = u = 0
        for item in store.query(f"PRED#{uid}"):
            st = item.get("status")
            if st == grader.HIT:
                h += 1
            elif st == grader.MISSED:
                m += 1
            elif st == grader.MISSED_WAITING:
                u += 1
        g = h + m
        if g or u:
            per.append({"uid": uid, "name": meta["name"], "hits": h, "misses": m, "unverified": u, "graded": g})
        hits += h
        graded += g
        unverified += u
    per.sort(key=lambda r: (-r["graded"], r["name"]))
    return {"hits": hits, "graded": graded, "misses": graded - hits, "unverified": unverified, "target": 0.8, "stations": per}
