"""Bad-air plan: one plan per day for a participating organisation, decided at 06:30 IST, and what
the organisation did with it. Three kinds share everything below:

  school     children           assembly, PE, recess, children with asthma
  work       outdoor workers    1-3 work zones (each read at its own nearest station), shift hours
  community  RWA / centre       outdoor events, walking groups, older residents and people with asthma

The level is a fixed table on the same CPCB bands as the public answer, never model-chosen:
  level 0  AQI 0-100    normal day
  level 1  101-200      people with asthma take care (CPCB's note for Moderate: breathing
                        discomfort to people with asthma)
  level 2  201-300      poor: move or cut outdoor activity
  level 3  301+         very poor or worse: everything indoors / essential outdoor work only
An old station number is planned on the high end of its estimate, as everywhere else. A work team
is planned on its worst zone.

Each day carries a checklist of suggested actions; an action is only "done" once someone marks it,
with the time. Opening the day's plan records that it was seen. Nothing here measures anybody's
inhaled dose: a station number is station air, and the plan is exposure-aware guidance.

No login: an organisation is opened with its id plus a random key (kept on the device and in its
emails). A separate public token opens the read-only "my zone today" page for a work crew.
Morning emails go only to an address that has been confirmed from that address's inbox.
"""
from __future__ import annotations

import collections
import secrets
from datetime import datetime, timedelta

from . import grader, mail, places, service, smoke
from .aqi import band_index
from .freshness import human_age_en, human_age_hi
from .store import Store

KINDS = ("school", "work", "community")
OUT, LIMIT, IN = "out", "limit", "in"
ROWS = {"school": ("assembly", "pe", "recess", "sensitive"),
        "community": ("events", "walks", "sensitive")}
PLANS = {"school": {0: (OUT, OUT, OUT, OUT), 1: (OUT, OUT, OUT, LIMIT), 2: (IN, IN, LIMIT, IN), 3: (IN, IN, IN, IN)},
         "community": {0: (OUT, OUT, OUT), 1: (OUT, OUT, LIMIT), 2: (IN, LIMIT, IN), 3: (IN, IN, IN)}}
# (action, lowest level at which it is suggested)
CHECKLIST = {"school": (("inhalers", 1), ("notify", 2), ("assembly_in", 2), ("pe_in", 2)),
             "work": (("brief", 1), ("less_strenuous", 2), ("breaks_in", 2), ("masks", 2)),
             "community": (("share", 2), ("pause_events", 2), ("check_neighbours", 2))}
ACTIVITIES = ROWS["school"]
PLAN = PLANS["school"]
ACTIONS = ("followed", "outdoor", "closed")  # day status; "closed" = no school / no work today
MAX_ZONES = 3
DEFAULT_SHIFT = (8, 18)
DECIDE_AT = service.MORNING_AT  # 06:30 IST, the same run as the public morning estimates
SEND_UNTIL_HOUR = 10  # a late catch-up run must not email a "morning" plan at lunchtime
HISTORY_DAYS = 30
KEEP_DAYS = 60       # daily records older than this are deleted
IDLE_DAYS = 45       # a plan nobody has opened for this long is deleted, with its record


def level_for(aqi: float) -> int:
    return {0: 0, 1: 0, 2: 1, 3: 2}.get(band_index(aqi), 3)


def plan(level: int | None, kind: str = "school") -> dict | None:
    if level is None or kind not in PLANS:
        return None
    return dict(zip(ROWS[kind], PLANS[kind][level]))


def checklist(kind: str, level: int | None) -> list[str]:
    return [] if level is None else [a for a, lo in CHECKLIST[kind] if level >= lo]


# ---------- the organisation record ----------

def register(store: Store, name: str, uid: int, now_ts: int, lang: str = "hi",
             email: str | None = None, place: dict | None = None, kind: str = "school",
             zones: list[dict] | None = None, shift: tuple[int, int] | None = None) -> tuple[dict | None, str | None]:
    """Returns (org, confirm_token). confirm_token is set when an email still needs confirming.
    place: {lat, lon, address} when found on the map. zones (work teams): [{name, uid, place?}]."""
    if kind == "work":
        if not zones or not all(store.get("STATION", str(z["uid"])) for z in zones):
            return None, None
        uid = zones[0]["uid"]
    elif not store.get("STATION", str(uid)):
        return None, None
    sid = secrets.token_hex(5)
    org = {"id": sid, "key": secrets.token_urlsafe(18), "pub": secrets.token_urlsafe(9), "kind": kind,
           "name": name, "uid": uid, "lang": lang, "created_ts": now_ts}
    if kind == "work":
        org["zones"] = zones[:MAX_ZONES]
        org["shift"] = list(shift or DEFAULT_SHIFT)
    if place and kind != "work":
        org["place"] = place
    token = _set_email(org, email)
    store.put("SCHOOL", sid, org)
    store.put("PUB", org["pub"], {"id": sid})
    return org, token


def authorize(store: Store, sid: str, key: str) -> dict | None:
    org = store.get("SCHOOL", str(sid or ""))
    if not org or not secrets.compare_digest(org["key"], str(key or "")):
        return None
    return org


def update(store: Store, school: dict, name: str | None = None, uid: int | None = None,
           email: str | None = None, clear_email: bool = False, lang: str | None = None,
           place: dict | None = None, set_place: bool = False, now_ts: int | None = None,
           zones: list[dict] | None = None, shift: tuple[int, int] | None = None) -> tuple[dict | None, str | None]:
    """Change name, station / zones, map position, shift, email language or contact.
    A new address must be confirmed again. A new station or new zones discard today's plan, so it is
    made again; set_place=True with place=None forgets the map position."""
    replan = False
    if zones is not None and school.get("kind") == "work":
        if not zones or not all(store.get("STATION", str(z["uid"])) for z in zones):
            return None, None
        replan = [z["uid"] for z in zones] != [z["uid"] for z in school.get("zones", [])]
        school["zones"] = zones[:MAX_ZONES]
        school["uid"] = zones[0]["uid"]
    elif uid is not None:
        if not store.get("STATION", str(uid)):
            return None, None
        replan = uid != school["uid"]
        school["uid"] = uid
    if replan and now_ts is not None:
        store.delete(f"SDAY#{school['id']}", service.ist_date(now_ts))
    if shift and school.get("kind") == "work":
        school["shift"] = list(shift)
    if set_place:
        if place:
            school["place"] = place
        else:
            school.pop("place", None)
    if name:
        school["name"] = name
    if lang:
        school["lang"] = lang
    token = None
    if clear_email:
        _set_email(school, None)
    elif email and email != school.get("email"):
        token = _set_email(school, email)
    store.put("SCHOOL", school["id"], school)
    return school, token


def _set_email(school: dict, email: str | None) -> str | None:
    for k in ("email", "email_confirmed", "confirm"):
        school.pop(k, None)
    if not email:
        return None
    token = secrets.token_urlsafe(12)
    school.update(email=email, email_confirmed=False, confirm=token)
    return token


def confirm_email(store: Store, school: dict, token: str) -> bool:
    if not school.get("confirm") or not secrets.compare_digest(school["confirm"], str(token or "")):
        return False
    school["email_confirmed"] = True
    school.pop("confirm", None)
    store.put("SCHOOL", school["id"], school)
    return True


def remove(store: Store, school: dict) -> None:
    for d in store.query(f"SDAY#{school['id']}"):
        store.delete(d["pk"], d["sk"])
    if school.get("pub"):
        store.delete("PUB", school["pub"])
    store.delete("SCHOOL", school["id"])


# ---------- the day's plan ----------

def _decided_yet(now_ts: int) -> bool:
    t = datetime.fromtimestamp(now_ts, service.IST)
    return (t.hour, t.minute) >= DECIDE_AT


def _reading(store: Store, uid: int, now_ts: int) -> dict | None:
    """Level and basis at one station, from the same card the public sees."""
    card = service.build_card(store, uid, now_ts)
    if not card:
        return None
    iv = card.get("interval")
    v = iv["hi"] if iv else card.get("value")
    return {"uid": card["uid"], "station": card["name"], "level": None if v is None else level_for(v),
            "basis": {"state": card["state"], "age_min": card.get("age_min"), "value": card.get("value"),
                      "lo": iv["lo"] if iv else None, "hi": iv["hi"] if iv else None,
                      "n_neighbours": iv["n_neighbours"] if iv else None}}


def ensure_day(store: Store, school: dict, now_ts: int) -> dict | None:
    """Today's plan. Made when first needed, at any hour, from the latest reading. A plan made before
    06:30 is "early": the first look after 06:30 makes it again from the morning's reading, unless
    someone has already ticked something on it. After that it is kept for the day."""
    date = service.ist_date(now_ts)
    day = store.get(f"SDAY#{school['id']}", date)
    if day and not (day.get("early") and _decided_yet(now_ts) and not day.get("acts") and not day.get("action")):
        return day
    kind = school.get("kind", "school")
    if kind == "work":
        zones = []
        for z in school.get("zones", []):
            r = _reading(store, z["uid"], now_ts)
            if r:
                zones.append({"name": z["name"], **r})
        if not zones:
            return None
        worst = max(zones, key=lambda z: -1 if z["level"] is None else z["level"])
        day = {"date": date, "uid": worst["uid"], "station": worst["station"], "decided_ts": now_ts,
               "level": worst["level"], "basis": worst["basis"], "zones": zones}
    else:
        r = _reading(store, school["uid"], now_ts)
        if not r:
            return None
        day = {"date": date, "uid": r["uid"], "station": r["station"], "decided_ts": now_ts,
               "level": r["level"], "basis": r["basis"]}
    day["kind"] = kind
    if not _decided_yet(now_ts):
        day["early"] = True
    fires = smoke.current(store, now_ts)  # the context as it stood when the plan was made
    if fires:
        day["fires"] = {k: fires.get(k) for k in ("total", "upwind", "wind_from", "window_h", "radius_km")}
    store.put(f"SDAY#{school['id']}", date, day)
    return store.get(f"SDAY#{school['id']}", date)


def log_action(store: Store, school: dict, date: str, action: str | None, now_ts: int) -> dict | None:
    """The day's status: "closed" (no school / no work today), or the older one-tap answers."""
    day = store.get(f"SDAY#{school['id']}", str(date))
    if not day:
        return None
    day.pop("action", None)
    day.pop("action_ts", None)
    if action:
        day.update(action=action, action_ts=now_ts)
    store.put(day["pk"], day["sk"], day)
    return day


def set_act(store: Store, school: dict, date: str, act: str, done: bool, now_ts: int) -> dict | None:
    """Mark one checklist action done (with the time) or not done."""
    day = store.get(f"SDAY#{school['id']}", str(date))
    if not day or act not in {a for a, _ in CHECKLIST[school.get("kind", "school")]}:
        return None
    acts = dict(day.get("acts") or {})
    if done:
        acts.setdefault(act, now_ts)
    else:
        acts.pop(act, None)
    day["acts"] = acts
    day.setdefault("seen_ts", now_ts)
    store.put(day["pk"], day["sk"], day)
    return day


def morning(store: Store, now_ts: int, send=None) -> dict:
    """06:30 job (and the poller's catch-up): decide every organisation's day, email confirmed contacts."""
    if not _decided_yet(now_ts):
        return {"days": 0, "emailed": 0}
    late = datetime.fromtimestamp(now_ts, service.IST).hour >= SEND_UNTIL_HOUR
    days = emailed = 0
    tidy(store, now_ts)
    for school in store.query("SCHOOL"):
        day = ensure_day(store, school, now_ts)
        if not day:
            continue
        days += 1
        if send and not late and school.get("email_confirmed") and not day.get("emailed"):
            try:
                send(school, day)
            except Exception as e:  # one bad address must not stop the others
                print("plan email skipped:", school["id"], repr(e))
                continue
            day["emailed"] = True
            store.put(day["pk"], day["sk"], day)
            emailed += 1
    return {"days": days, "emailed": emailed}


def tidy(store: Store, now_ts: int) -> dict:
    """Once a day: delete daily records older than KEEP_DAYS, and plans nobody has opened for
    IDLE_DAYS (with everything they hold). Nothing else is ever deleted automatically."""
    today = service.ist_date(now_ts)
    if (store.get("KV", "plan_tidy") or {}).get("date") == today:
        return {"plans": 0, "days": 0}
    cut = (datetime.fromtimestamp(now_ts, service.IST).date() - timedelta(days=KEEP_DAYS)).isoformat()
    plans = days = 0
    for org in store.query("SCHOOL"):
        if now_ts - org.get("last_seen_ts", org["created_ts"]) > IDLE_DAYS * 86400:
            remove(store, org)
            plans += 1
            continue
        for d in store.query(f"SDAY#{org['id']}"):
            if d["date"] < cut:
                store.delete(d["pk"], d["sk"])
                days += 1
    store.put("KV", "plan_tidy", {"date": today, "plans": plans, "days": days})
    return {"plans": plans, "days": days}


# ---------- what the pages see ----------

def _grade(store: Store, day: dict) -> dict | None:
    """An estimate-based plan is graded by the same morning promise on the public record,
    but only when it is literally that promise (made in the same run)."""
    if day["basis"]["state"] != "stale":
        return None
    pred = store.get(f"PRED#{day['uid']}", f"MORNING#{day['date']}")
    if not pred or abs(pred["created_ts"] - day["decided_ts"]) > 300:
        return None
    return {"status": pred["status"], "actual": None if pred.get("actual") is None else round(pred["actual"]),
            "miss_by": pred.get("miss_by", 0)}


def _basis(b: dict) -> dict:
    return {k: b.get(k) for k in ("state", "age_min", "value", "lo", "hi", "n_neighbours")}


def _public_day(store: Store, d: dict, kind: str) -> dict:
    keep = ("date", "uid", "station", "decided_ts", "level", "action", "emailed", "seen_ts", "early")
    out = {k: d.get(k) for k in keep}
    out["basis"] = _basis(d["basis"])
    out["plan"] = plan(d.get("level"), kind)
    out["todo"] = checklist(kind, d.get("level"))
    out["acts"] = d.get("acts") or {}
    out["zones"] = [{"name": z["name"], "uid": z["uid"], "station": z["station"], "level": z.get("level"),
                     "basis": _basis(z["basis"])} for z in d.get("zones", [])] or None
    out["fires"] = d.get("fires")
    out["grade"] = _grade(store, d)
    return out


def _acted(d: dict) -> bool:
    return bool(d.get("acts")) or d.get("action") == "followed"


def summary(days: list[dict]) -> dict:
    bad = [d for d in days if (d.get("level") or 0) >= 2 and d.get("action") != "closed"]
    graded = [d["grade"] for d in days if d.get("grade") and d["grade"]["status"] in (grader.HIT, grader.MISSED)]
    return {"days": len(days), "bad_days": len(bad),
            "acted": sum(_acted(d) for d in bad),
            "followed": sum(d.get("action") == "followed" for d in bad),
            "outdoor": sum(d.get("action") == "outdoor" for d in bad),
            "est_graded": len(graded), "est_hits": sum(g["status"] == grader.HIT for g in graded)}


def _mask(email: str) -> str:
    name, _, domain = email.partition("@")
    return f"{name[:2]}…@{domain}"


def _zones_view(store: Store, school: dict) -> list[dict] | None:
    if school.get("kind") != "work":
        return None
    out = []
    for z in school.get("zones", []):
        meta = store.get("STATION", str(z["uid"])) or {}
        pl = z.get("place")
        out.append({"name": z["name"], "uid": z["uid"], "station": meta.get("name"), "place": pl,
                    "station_km": round(places.km(pl["lat"], pl["lon"], meta["lat"], meta["lon"]), 1) if pl and meta else None})
    return out


def view(store: Store, school: dict, now_ts: int) -> dict:
    if now_ts - school.get("last_seen_ts", 0) > 3600:  # opened: keeps the plan from being tidied away
        school["last_seen_ts"] = now_ts
        store.put("SCHOOL", school["id"], school)
    today_day = ensure_day(store, school, now_ts)
    if today_day and not today_day.get("seen_ts"):  # the plan was opened: acknowledged
        today_day["seen_ts"] = now_ts
        store.put(today_day["pk"], today_day["sk"], today_day)
    kind = school.get("kind", "school")
    meta = store.get("STATION", str(school["uid"])) or {}
    pl = school.get("place")
    dist = round(places.km(pl["lat"], pl["lon"], meta["lat"], meta["lon"]), 1) if pl and meta else None
    days = [_public_day(store, d, kind) for d in store.query(f"SDAY#{school['id']}", limit=HISTORY_DAYS, reverse=True)]
    today = service.ist_date(now_ts)
    shift = school.get("shift")
    return {"school": {"id": school["id"], "kind": kind, "name": school["name"], "uid": school["uid"],
                       "station": meta.get("name"), "station_km": dist, "place": pl,
                       "address": pl.get("address") if pl else None, "lang": school.get("lang", "hi"),
                       "created_ts": school["created_ts"], "pub": school.get("pub"),
                       "zones": _zones_view(store, school),
                       "shift": shift, "shift_h": (shift[1] - shift[0]) if shift else None,
                       "email_hint": _mask(school["email"]) if school.get("email") else None,
                       "email_confirmed": bool(school.get("email_confirmed"))},
            "today": next((d for d in days if d["date"] == today), None),
            "days": days, "summary": summary(days), "now": now_ts,
            "decides_at": "%02d:%02d" % DECIDE_AT}


def public_view(store: Store, pub: str, now_ts: int) -> dict | None:
    """The crew's read-only page: today's zones, levels and shift. No key, no contact details."""
    ptr = store.get("PUB", str(pub or ""))
    org = store.get("SCHOOL", ptr["id"]) if ptr else None
    if not org:
        return None
    kind = org.get("kind", "school")
    day = ensure_day(store, org, now_ts)
    shift = org.get("shift")
    return {"name": org["name"], "kind": kind, "shift": shift, "shift_h": (shift[1] - shift[0]) if shift else None,
            "today": _public_day(store, day, kind) if day else None, "decides_at": "%02d:%02d" % DECIDE_AT,
            "now": now_ts}


def ledger(store: Store, now_ts: int, days: int = HISTORY_DAYS) -> dict:
    """The second public record: on poor-or-worse mornings, did the warning lead to action?
    Counts organisation-mornings across participating organisations only; never names them."""
    since = (datetime.fromtimestamp(now_ts, service.IST).date() - timedelta(days=days - 1)).isoformat()
    blank = {"warned": 0, "seen": 0, "acted": 0, "no_response": 0}
    by_kind = {k: dict(blank) for k in KINDS}
    acts = collections.Counter()
    orgs = collections.Counter()
    for org in store.query("SCHOOL"):
        kind = org.get("kind", "school")
        orgs[kind] += 1
        for d in store.query(f"SDAY#{org['id']}"):
            if d["date"] < since or (d.get("level") or 0) < 2 or d.get("action") == "closed":
                continue
            acted = _acted(d)
            seen = acted or bool(d.get("seen_ts")) or bool(d.get("action"))
            b = by_kind[kind]
            b["warned"] += 1
            b["seen"] += seen
            b["acted"] += acted
            b["no_response"] += not seen
            acts.update((d.get("acts") or {}).keys())
    total = {k: sum(b[k] for b in by_kind.values()) for k in blank}
    return {"days": days, "orgs": dict(orgs), "total": total, "by_kind": by_kind,
            "top_actions": [{"act": a, "n": n} for a, n in acts.most_common(5)]}


# ---------- emails (plain text, the organisation's language) ----------

COPY = {
    "en": {
        "rows": {"assembly": "Morning assembly", "pe": "PE and sports", "recess": "Recess",
                 "sensitive": "Children with asthma or breathing trouble",
                 "events": "Outdoor events", "walks": "Walking and yoga groups"},
        "rows_community": {"sensitive": "Older residents and people with asthma"},
        "status": {OUT: "Outside", LIMIT: "Short and light", IN: "Indoors"},
        "head": {"school": {0: "A normal day: activities can be outside.",
                            1: "Outside is fine. Keep PE short and light for children with asthma.",
                            2: "Move assembly and PE indoors today.",
                            3: "Keep every activity indoors today."},
                 "work": {0: "A normal day for outdoor work.",
                          1: "Work can go on. Workers with asthma or heart conditions: lighter tasks.",
                          2: "Poor air in your zones: cut strenuous outdoor work and give indoor breaks.",
                          3: "Very poor air: strenuous outdoor work only if essential, with frequent indoor breaks."},
                 "community": {0: "A normal day.",
                               1: "Outdoor plans can go on. Older residents and people with asthma: take it easy.",
                               2: "Pause outdoor events today and keep walks short.",
                               3: "Keep everyone's activities indoors today."}},
        "none": "No reliable air number this morning. Check a nearby station before deciding.",
        "level": {0: "Good or Satisfactory", 1: "Moderate", 2: "Poor", 3: "Very poor or worse", None: "No reliable number"},
        "todo_t": "Today's checklist:",
        "todo": {"inhalers": "Check children with asthma have their inhalers",
                 "notify": "Tell parents before they leave home", "assembly_in": "Hold assembly indoors",
                 "pe_in": "Move PE indoors", "brief": "Brief the crew on today's air",
                 "less_strenuous": "Cut strenuous outdoor work where possible",
                 "breaks_in": "Give breaks indoors", "masks": "Hand out well-fitting masks if available",
                 "share": "Share this warning on the residents' group", "pause_events": "Pause outdoor events",
                 "check_neighbours": "Check on older and vulnerable neighbours"},
        "outside": "Your crew will be outside about {h} h today.",
        "log": "Open today's plan and mark what was done:",
        "foot": "Station air, not your exact location, and not anyone's measured dose. When the number is old, the range is an estimate.",
        "confirm_subject": "Confirm morning air emails for {name}",
        "confirm_body": "Taaza Hawa will email the day's bad-air plan for {name} at 06:30.\n\n"
                        "Confirm this address:\n{link}\n\nIf you did not ask for this, ignore this email; nothing will be sent.",
    },
    "hi": {
        "rows": {"assembly": "सुबह की प्रार्थना सभा", "pe": "PE और खेल", "recess": "आधी छुट्टी (रिसेस)",
                 "sensitive": "अस्थमा या साँस की तकलीफ़ वाले बच्चे",
                 "events": "बाहर के कार्यक्रम", "walks": "सैर और योग के समूह"},
        "rows_community": {"sensitive": "बुज़ुर्ग और अस्थमा वाले लोग"},
        "status": {OUT: "बाहर", LIMIT: "थोड़ी देर, हल्का", IN: "अंदर"},
        "head": {"school": {0: "सामान्य दिन: गतिविधियाँ बाहर हो सकती हैं।",
                            1: "बाहर ठीक है। अस्थमा वाले बच्चों का PE छोटा और हल्का रखें।",
                            2: "आज प्रार्थना सभा और PE अंदर कराएँ।",
                            3: "आज सारी गतिविधियाँ अंदर रखें।"},
                 "work": {0: "बाहर के काम के लिए सामान्य दिन।",
                          1: "काम चल सकता है। अस्थमा या दिल की तकलीफ़ वाले कामगारों को हल्का काम दें।",
                          2: "आपके इलाक़ों में खराब हवा: भारी बाहरी काम कम करें, आराम अंदर कराएँ।",
                          3: "बहुत खराब हवा: भारी बाहरी काम सिर्फ़ ज़रूरी हो तो, और बार-बार अंदर आराम।"},
                 "community": {0: "सामान्य दिन।",
                               1: "बाहर के कार्यक्रम हो सकते हैं। बुज़ुर्ग और अस्थमा वाले लोग ध्यान रखें।",
                               2: "आज बाहर के कार्यक्रम रोकें और सैर छोटी रखें।",
                               3: "आज सबकी गतिविधियाँ अंदर रखें।"}},
        "none": "आज सुबह हवा का भरोसेमंद नंबर नहीं मिला। फ़ैसले से पहले पास का स्टेशन देखें।",
        "level": {0: "अच्छी या संतोषजनक", 1: "मध्यम", 2: "खराब", 3: "बहुत खराब या उससे बदतर", None: "भरोसेमंद नंबर नहीं"},
        "todo_t": "आज की सूची:",
        "todo": {"inhalers": "अस्थमा वाले बच्चों के इन्हेलर देख लें",
                 "notify": "माता-पिता को घर से निकलने से पहले बताएँ", "assembly_in": "प्रार्थना सभा अंदर कराएँ",
                 "pe_in": "PE अंदर कराएँ", "brief": "टीम को आज की हवा के बारे में बताएँ",
                 "less_strenuous": "जहाँ हो सके भारी बाहरी काम कम करें",
                 "breaks_in": "आराम अंदर कराएँ", "masks": "उपलब्ध हों तो ठीक से फ़िट होने वाले मास्क दें",
                 "share": "यह चेतावनी निवासियों के समूह पर भेजें", "pause_events": "बाहर के कार्यक्रम रोकें",
                 "check_neighbours": "बुज़ुर्ग और कमज़ोर पड़ोसियों का हाल पूछें"},
        "outside": "आपकी टीम आज लगभग {h} घंटे बाहर रहेगी।",
        "log": "आज का प्लान खोलें और जो किया उसे दर्ज करें:",
        "foot": "यह स्टेशन की हवा है, आपकी सटीक जगह की नहीं, और किसी के शरीर में गई हवा का माप नहीं। नंबर पुराना हो तो दायरा एक अंदाज़ा है।",
        "confirm_subject": "{name} के लिए सुबह की हवा वाले ईमेल की पुष्टि करें",
        "confirm_body": "ताज़ा हवा सुबह 06:30 बजे {name} के लिए खराब हवा की योजना ईमेल करेगी।\n\n"
                        "यह पता पक्का करें:\n{link}\n\nअगर आपने यह नहीं माँगा, तो इस ईमेल को छोड़ दें; कुछ नहीं भेजा जाएगा।",
    },
}


def head_text(kind: str, level: int | None, lang: str) -> str:
    c = COPY[lang]
    return c["none"] if level is None else c["head"][kind][level]


def basis_line(day: dict, lang: str) -> str:
    b, st = day["basis"], day["station"]
    age = (human_age_hi if lang == "hi" else human_age_en)(b.get("age_min") or 0)
    if b["state"] == "fresh":
        return (f"{st}: AQI {b['value']}, {age} पहले नापा गया।" if lang == "hi"
                else f"{st}: AQI {b['value']}, measured {age} before this plan.")
    if b.get("hi") is None:
        return (f"{st} का नंबर {age} पुराना है और अंदाज़े के लिए पास का कोई ताज़ा स्टेशन नहीं है।" if lang == "hi"
                else f"{st}'s number is {age} old and no fresh station nearby could estimate it.")
    n = b.get("n_neighbours") or 0
    if lang == "hi":
        src = f"पास के {n} ताज़ा स्टेशनों से अंदाज़ा" if n else "पुराने नंबर से, उम्र के हिसाब से चौड़ा दायरा"
        return f"{st}: AQI शायद {b['lo']}–{b['hi']}। इसका आख़िरी नंबर {age} पुराना था ({src})। प्लान दायरे के ऊपरी सिरे पर बना है।"
    src = f"estimated from {n} fresh stations nearby" if n else "from its old number, widened for age"
    return f"{st}: AQI probably {b['lo']}–{b['hi']}. Its last number was {age} old ({src}). The plan uses the top of the range."


COMPASS = {"en": ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"],
           "hi": ["उत्तर", "उत्तर-पूर्व", "पूर्व", "दक्षिण-पूर्व", "दक्षिण", "दक्षिण-पश्चिम", "पश्चिम", "उत्तर-पश्चिम"]}


def compass(deg: float, lang: str) -> str:
    return COMPASS[lang][round(deg / 45) % 8]


def fire_line(f: dict, lang: str) -> str:
    n, r, h = f["total"], f.get("radius_km", 500), f.get("window_h", 48)
    if lang == "hi":
        s = f"NASA उपग्रहों ने पिछले {h} घंटे में दिल्ली से {r} किमी के अंदर {n} आग देखीं।"
        if f.get("upwind") is not None and n:
            s += f" हवा {compass(f['wind_from'], 'hi')} से आ रही थी; {f['upwind']} आग उसी तरफ़ थीं।"
        return s + " (यह आग की गिनती है, धुएँ का माप नहीं।)"
    s = f"NASA satellites saw {n} fires within {r} km of Delhi in the last {h} h."
    if f.get("upwind") is not None and n:
        s += f" The wind came from the {compass(f['wind_from'], 'en')}; {f['upwind']} fires were on that side."
    return s + " (A fire count, not a smoke measurement.)"


def plan_text(school: dict, day: dict) -> tuple[str, str]:
    lang, kind = school.get("lang", "hi"), school.get("kind", "school")
    c = COPY[lang]
    head = head_text(kind, day.get("level"), lang)
    lines = [f"Taaza Hawa · {school['name']} · {day['date']}", "", head, ""]
    p = plan(day.get("level"), kind)
    if p:
        names = {**c["rows"], **(c["rows_community"] if kind == "community" else {})}
        lines += [f"{names[a]}: {c['status'][p[a]]}" for a in ROWS[kind]] + [""]
    for z in day.get("zones") or []:
        lines.append(f"{z['name']}: {c['level'][z.get('level')]}")
        lines.append("  " + basis_line(z, lang))
    if kind == "work" and school.get("shift"):
        lines += ["", c["outside"].format(h=school["shift"][1] - school["shift"][0])]
    todo = checklist(kind, day.get("level"))
    if todo:
        lines += ["", c["todo_t"]] + [f"- {c['todo'][a]}" for a in todo]
    if kind != "work":
        lines += ["", basis_line(day, lang)]
    if day.get("fires"):
        lines.append(fire_line(day["fires"], lang))
    link = mail.site_link(f"plan?id={school['id']}&k={school['key']}")
    if link:
        lines += ["", c["log"], link]
    lines += ["", c["foot"]]
    return f"{school['name']}: {head}", "\n".join(lines)


def send_morning(school: dict, day: dict) -> None:
    subject, body = plan_text(school, day)
    mail.send(school["email"], subject, body)


def send_confirm(school: dict, token: str) -> None:
    c = COPY[school.get("lang", "hi")]
    link = mail.site_link(f"plan?id={school['id']}&k={school['key']}&confirm={token}")
    mail.send(school["email"], c["confirm_subject"].format(name=school["name"]),
              c["confirm_body"].format(name=school["name"], link=link or "(link unavailable)"))
