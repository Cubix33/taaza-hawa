"""School mode: one plan per school day, decided at 06:30 IST, and what the school did with it.

The plan is a fixed table on the same CPCB bands as the public answer, never model-chosen:
  level 0  AQI 0-100    everything outside as usual
  level 1  101-200      outside is fine; children with asthma keep PE short and light
                        (CPCB's own note for Moderate: breathing discomfort to people with asthma)
  level 2  201-300      assembly and PE indoors, recess short and light, children with asthma indoors
  level 3  301+         everything indoors
An old station number is planned on the high end of its estimate, as everywhere else.

No login: a school is opened with its id plus a random key (kept on the device and in its emails).
Morning emails go only to an address that has been confirmed from that address's inbox.
"""
from __future__ import annotations

import secrets
from datetime import datetime

from . import grader, mail, places, service, smoke
from .aqi import band_index
from .freshness import human_age_en, human_age_hi
from .store import Store

ACTIVITIES = ("assembly", "pe", "recess", "sensitive")
OUT, LIMIT, IN = "out", "limit", "in"
PLAN = {0: (OUT, OUT, OUT, OUT), 1: (OUT, OUT, OUT, LIMIT), 2: (IN, IN, LIMIT, IN), 3: (IN, IN, IN, IN)}
ACTIONS = ("followed", "outdoor", "closed")
DECIDE_AT = service.MORNING_AT  # 06:30 IST, the same run as the public morning estimates
SEND_UNTIL_HOUR = 10  # a late catch-up run must not email a "morning" plan at lunchtime
HISTORY_DAYS = 30


def level_for(aqi: float) -> int:
    return {0: 0, 1: 0, 2: 1, 3: 2}.get(band_index(aqi), 3)


def plan(level: int | None) -> dict | None:
    return None if level is None else dict(zip(ACTIVITIES, PLAN[level]))


# ---------- the school record ----------

def register(store: Store, name: str, uid: int, now_ts: int, lang: str = "hi",
             email: str | None = None, place: dict | None = None) -> tuple[dict | None, str | None]:
    """Returns (school, confirm_token). confirm_token is set when an email still needs confirming.
    place: {lat, lon, address} when the school was found on the map (shows the distance to its station)."""
    if not store.get("STATION", str(uid)):
        return None, None
    sid = secrets.token_hex(5)
    school = {"id": sid, "key": secrets.token_urlsafe(18), "name": name, "uid": uid,
              "lang": lang, "created_ts": now_ts}
    if place:
        school["place"] = place
    token = _set_email(school, email)
    store.put("SCHOOL", sid, school)
    return school, token


def authorize(store: Store, sid: str, key: str) -> dict | None:
    school = store.get("SCHOOL", str(sid or ""))
    if not school or not secrets.compare_digest(school["key"], str(key or "")):
        return None
    return school


def update(store: Store, school: dict, name: str | None = None, uid: int | None = None,
           email: str | None = None, clear_email: bool = False, lang: str | None = None,
           place: dict | None = None, set_place: bool = False,
           now_ts: int | None = None) -> tuple[dict | None, str | None]:
    """Change school (name, station, map position), email language or contact.
    A new address must be confirmed again. A new station discards today's plan, so it is made again
    for that station; set_place=True with place=None forgets the map position."""
    if uid is not None:
        if not store.get("STATION", str(uid)):
            return None, None
        if uid != school["uid"] and now_ts is not None:
            store.delete(f"SDAY#{school['id']}", service.ist_date(now_ts))
        school["uid"] = uid
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
    store.delete("SCHOOL", school["id"])


# ---------- the day's plan ----------

def _decided_yet(now_ts: int) -> bool:
    t = datetime.fromtimestamp(now_ts, service.IST)
    return (t.hour, t.minute) >= DECIDE_AT


def ensure_day(store: Store, school: dict, now_ts: int) -> dict | None:
    """Today's plan, decided once (at 06:30, or at sign-up if that is later) and then kept."""
    if not _decided_yet(now_ts):
        return None
    date = service.ist_date(now_ts)
    day = store.get(f"SDAY#{school['id']}", date)
    if day:
        return day
    card = service.build_card(store, school["uid"], now_ts)
    if not card:
        return None
    iv = card.get("interval")
    v = iv["hi"] if iv else card.get("value")
    day = {"date": date, "uid": card["uid"], "station": card["name"], "decided_ts": now_ts,
           "level": None if v is None else level_for(v),
           "basis": {"state": card["state"], "age_min": card.get("age_min"), "value": card.get("value"),
                     "lo": iv["lo"] if iv else None, "hi": iv["hi"] if iv else None,
                     "n_neighbours": iv["n_neighbours"] if iv else None}}
    fires = smoke.current(store, now_ts)  # the context as it stood when the plan was made
    if fires:
        day["fires"] = {k: fires.get(k) for k in ("total", "upwind", "wind_from", "window_h", "radius_km")}
    store.put(f"SDAY#{school['id']}", date, day)
    return store.get(f"SDAY#{school['id']}", date)


def log_action(store: Store, school: dict, date: str, action: str | None, now_ts: int) -> dict | None:
    day = store.get(f"SDAY#{school['id']}", str(date))
    if not day:
        return None
    day.pop("action", None)
    day.pop("action_ts", None)
    if action:
        day.update(action=action, action_ts=now_ts)
    store.put(day["pk"], day["sk"], day)
    return day


def morning(store: Store, now_ts: int, send=None) -> dict:
    """06:30 job (and the poller's catch-up): decide every school's day, email confirmed contacts."""
    if not _decided_yet(now_ts):
        return {"days": 0, "emailed": 0}
    late = datetime.fromtimestamp(now_ts, service.IST).hour >= SEND_UNTIL_HOUR
    days = emailed = 0
    for school in store.query("SCHOOL"):
        day = ensure_day(store, school, now_ts)
        if not day:
            continue
        days += 1
        if send and not late and school.get("email_confirmed") and not day.get("emailed"):
            try:
                send(school, day)
            except Exception as e:  # one bad address must not stop the others
                print("school email skipped:", school["id"], repr(e))
                continue
            day["emailed"] = True
            store.put(day["pk"], day["sk"], day)
            emailed += 1
    return {"days": days, "emailed": emailed}


# ---------- what the page sees ----------

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


def _public_day(store: Store, d: dict) -> dict:
    keep = ("date", "uid", "station", "decided_ts", "level", "action", "emailed")
    out = {k: d.get(k) for k in keep}
    b = d["basis"]
    out["basis"] = {k: b.get(k) for k in ("state", "age_min", "value", "lo", "hi", "n_neighbours")}
    out["plan"] = plan(d.get("level"))
    out["fires"] = d.get("fires")
    out["grade"] = _grade(store, d)
    return out


def summary(days: list[dict]) -> dict:
    bad = [d for d in days if (d.get("level") or 0) >= 2]
    graded = [d["grade"] for d in days if d.get("grade") and d["grade"]["status"] in (grader.HIT, grader.MISSED)]
    return {"days": len(days), "bad_days": len(bad),
            "followed": sum(d.get("action") == "followed" for d in bad),
            "outdoor": sum(d.get("action") == "outdoor" for d in bad),
            "est_graded": len(graded), "est_hits": sum(g["status"] == grader.HIT for g in graded)}


def _mask(email: str) -> str:
    name, _, domain = email.partition("@")
    return f"{name[:2]}…@{domain}"


def view(store: Store, school: dict, now_ts: int) -> dict:
    ensure_day(store, school, now_ts)
    meta = store.get("STATION", str(school["uid"])) or {}
    pl = school.get("place")
    dist = round(places.km(pl["lat"], pl["lon"], meta["lat"], meta["lon"]), 1) if pl and meta else None
    days = [_public_day(store, d) for d in store.query(f"SDAY#{school['id']}", limit=HISTORY_DAYS, reverse=True)]
    today = service.ist_date(now_ts)
    return {"school": {"id": school["id"], "name": school["name"], "uid": school["uid"],
                       "station": meta.get("name"), "station_km": dist, "place": pl,
                       "address": pl.get("address") if pl else None, "lang": school.get("lang", "hi"),
                       "created_ts": school["created_ts"],
                       "email_hint": _mask(school["email"]) if school.get("email") else None,
                       "email_confirmed": bool(school.get("email_confirmed"))},
            "today": next((d for d in days if d["date"] == today), None),
            "days": days, "summary": summary(days), "now": now_ts,
            "decides_at": "%02d:%02d" % DECIDE_AT}


# ---------- emails (plain text, the school's language) ----------

COPY = {
    "en": {
        "rows": {"assembly": "Morning assembly", "pe": "PE and sports", "recess": "Recess",
                 "sensitive": "Children with asthma or breathing trouble"},
        "status": {OUT: "Outside", LIMIT: "Short and light", IN: "Indoors"},
        "head": {0: "A normal day: activities can be outside.",
                 1: "Outside is fine. Keep PE short and light for children with asthma.",
                 2: "Move assembly and PE indoors today.",
                 3: "Keep every activity indoors today.",
                 None: "No reliable air number this morning. Check a nearby station before deciding."},
        "log": "Tell us what the school did today (one tap):",
        "foot": "Station air, not your playground. When the number is old, the range is an estimate, not the truth.",
        "confirm_subject": "Confirm morning air emails for {name}",
        "confirm_body": "Taaza Hawa will email the day's assembly and PE plan for {name} at 06:30 on school days.\n\n"
                        "Confirm this address:\n{link}\n\nIf you did not ask for this, ignore this email; nothing will be sent.",
    },
    "hi": {
        "rows": {"assembly": "सुबह की प्रार्थना सभा", "pe": "PE और खेल", "recess": "आधी छुट्टी (रिसेस)",
                 "sensitive": "अस्थमा या साँस की तकलीफ़ वाले बच्चे"},
        "status": {OUT: "बाहर", LIMIT: "थोड़ी देर, हल्का", IN: "अंदर"},
        "head": {0: "सामान्य दिन: गतिविधियाँ बाहर हो सकती हैं।",
                 1: "बाहर ठीक है। अस्थमा वाले बच्चों का PE छोटा और हल्का रखें।",
                 2: "आज प्रार्थना सभा और PE अंदर कराएँ।",
                 3: "आज सारी गतिविधियाँ अंदर रखें।",
                 None: "आज सुबह हवा का भरोसेमंद नंबर नहीं मिला। फ़ैसले से पहले पास का स्टेशन देखें।"},
        "log": "बताइए आज स्कूल ने क्या किया (एक टैप):",
        "foot": "यह स्टेशन की हवा है, आपके मैदान की नहीं। नंबर पुराना हो तो दायरा एक अंदाज़ा है, पक्का सच नहीं।",
        "confirm_subject": "{name} के लिए सुबह की हवा वाले ईमेल की पुष्टि करें",
        "confirm_body": "ताज़ा हवा स्कूल के दिनों में सुबह 06:30 बजे {name} के लिए प्रार्थना सभा और PE का प्लान ईमेल करेगी।\n\n"
                        "यह पता पक्का करें:\n{link}\n\nअगर आपने यह नहीं माँगा, तो इस ईमेल को छोड़ दें; कुछ नहीं भेजा जाएगा।",
    },
}


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
    lang = school.get("lang", "hi")
    c = COPY[lang]
    head = c["head"][day.get("level")]
    lines = [f"Taaza Hawa · {school['name']} · {day['date']}", "", head, ""]
    p = plan(day.get("level"))
    if p:
        lines += [f"{c['rows'][a]}: {c['status'][p[a]]}" for a in ACTIVITIES] + [""]
    lines.append(basis_line(day, lang))
    if day.get("fires"):
        lines.append(fire_line(day["fires"], lang))
    link = mail.site_link(f"school?id={school['id']}&k={school['key']}")
    if link:
        lines += ["", c["log"], link]
    lines += ["", c["foot"]]
    return f"{school['name']}: {head}", "\n".join(lines)


def send_morning(school: dict, day: dict) -> None:
    subject, body = plan_text(school, day)
    mail.send(school["email"], subject, body)


def send_confirm(school: dict, token: str) -> None:
    c = COPY[school.get("lang", "hi")]
    link = mail.site_link(f"school?id={school['id']}&k={school['key']}&confirm={token}")
    mail.send(school["email"], c["confirm_subject"].format(name=school["name"]),
              c["confirm_body"].format(name=school["name"], link=link or "(link unavailable)"))
