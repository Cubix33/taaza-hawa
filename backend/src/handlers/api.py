"""Lambda Function URL (payload v2) router. CORS is set on the URL config in the SAM template."""
import json
import os
import re

from taaza import mail, phrase, places, reliability, school, service, smoke, speech

from .common import now, sfn, store

DEFAULT_UID = int(os.environ.get("DEFAULT_STATION_UID", "0"))
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def email_enabled():
    """Receipts only go out when an SES sender is configured; the UI hides email otherwise."""
    return bool(os.environ.get("SES_SENDER"))


def _resp(code, body):
    return {"statusCode": code, "headers": {"content-type": "application/json; charset=utf-8",
                                            "cache-control": "no-store"},
            "body": json.dumps(body, ensure_ascii=False)}


def _recent_dates(t, n=4):
    from datetime import datetime, timedelta
    d = datetime.fromtimestamp(t, service.IST).date()
    return [(d - timedelta(days=i)).isoformat() for i in reversed(range(n))]


def route(method, path, q, body, s, t, start_execution=None):
    if path == "/health":
        poll = s.get("KV", "poll")
        return 200, {"ok": True, "now": t, "last_poll": poll,
                     "poll_age_min": (t - poll["at"]) // 60 if poll else None}
    if path == "/stations" and method == "GET":
        return 200, {"stations": service.station_list(s, t), "email_enabled": email_enabled()}
    if path == "/card" and method == "GET":
        uid = int(q.get("uid") or DEFAULT_UID)
        card = service.build_card(s, uid, t)
        if not card:
            return 404, {"error": "unknown station"}
        ai = phrase.rephrase(s, card["sentence_hi"])
        card["sentence_hi_ai"] = ai
        card["ai_on"] = ai is not None
        card["email_enabled"] = email_enabled()
        card["reliability"] = reliability.for_station(s, uid, t)
        card["fires"] = smoke.current(s, t)
        return 200, card
    if path == "/speak" and method == "GET":
        card = service.build_card(s, int(q.get("uid") or DEFAULT_UID), t)
        if not card:
            return 404, {"error": "unknown station"}
        lang = q.get("lang") if q.get("lang") in ("hi", "en") else "hi"
        try:
            return 200, speech.synthesize(s, speech.spoken_text(card, lang), lang)
        except Exception as e:  # no credentials / Polly unavailable: the page falls back to the browser voice
            print("speak failed:", repr(e))
            return 503, {"error": "voice unavailable"}
    if path == "/scoreboard" and method == "GET":
        rel = reliability.get(s, t)
        return 200, {**service.scoreboard(s, _recent_dates(t)), "now": t,
                     "recent_holds": service.recent_holds(s), "accuracy": service.accuracy(s),
                     "reliability": {"window_h": rel["window_h"],
                                     "stations": sorted(rel["stations"].values(), key=lambda r: (r["pct"], r["name"]))}}
    if path == "/history" and method == "GET":
        uid = int(q.get("uid") or DEFAULT_UID)
        hours = max(1, min(72, int(q.get("hours") or 24)))
        return 200, {"uid": uid, "hours": hours, "now": t, "points": service.history(s, uid, t, hours)}
    if path == "/hold" and method == "POST":
        card = service.build_card(s, int(body["uid"]), t)
        if not card or not card.get("can_hold"):
            return 409, {"error": "this station's reading is fresh; there is no estimate to hold"}
        email = _clean_email(body.get("email"))
        hold = service.create_hold(s, int(body["uid"]), t, email)
        if not hold:
            return 409, {"error": "no estimate available for this station right now"}
        if start_execution:
            start_execution(hold)
        return 201, _public(hold)
    if path == "/hold/email" and method == "POST":
        # add (or change) the receipt address after the promise was made, while it is still pending
        hold = service.get_hold(s, body.get("id", ""))
        email = _clean_email(body.get("email"))
        if not hold:
            return 404, {"error": "unknown hold"}
        if not email:
            return 400, {"error": "invalid email"}
        if hold["status"] != "PENDING":
            return 409, {"error": "this promise is already graded"}
        hold["email"] = email
        s.put(hold["pk"], hold["sk"], hold)
        return 200, _public(hold)
    if path == "/places" and method == "GET":
        return 200, places.search(s, q.get("q", ""))
    if path.startswith("/school"):
        return _school_route(method, path, q, body, s, t)
    if path == "/hold" and method == "GET":
        hold = service.get_hold(s, q.get("id", ""))
        return (200, _public(hold)) if hold else (404, {"error": "unknown hold"})
    return 404, {"error": "not found"}


def _clean_name(v):
    v = " ".join(str(v or "").split())
    return v if 2 <= len(v) <= 80 else None


def _school_route(method, path, q, body, s, t):
    if path == "/school" and method == "POST":
        name = _clean_name(body.get("name"))
        if not name:
            return 400, {"error": "school name must be 2 to 80 characters"}
        lang = body.get("lang") if body.get("lang") in ("hi", "en") else "hi"
        sc, token = school.register(s, name, int(body["uid"]), t, lang, _clean_email(body.get("email")),
                                    _clean_place(body.get("place")))
        if not sc:
            return 404, {"error": "unknown station"}
        _send_confirm(sc, token)
        return 201, {**_school_view(s, sc, t), "key": sc["key"]}
    args = q if method == "GET" else body
    sc = school.authorize(s, args.get("id"), args.get("k"))
    if not sc:
        return 404, {"error": "unknown school"}
    if path == "/school" and method == "GET":
        return 200, _school_view(s, sc, t)
    if method != "POST":
        return 404, {"error": "not found"}
    if path == "/school/edit":
        raw = (body.get("email") or "").strip() if "email" in body else None
        email = _clean_email(raw) if raw else None
        if raw and not email:
            return 400, {"error": "invalid email"}
        name = _clean_name(body.get("name")) if body.get("name") is not None else None
        if body.get("name") is not None and not name:
            return 400, {"error": "school name must be 2 to 80 characters"}
        uid = int(body["uid"]) if body.get("uid") is not None else None
        lang = body.get("lang") if body.get("lang") in ("hi", "en") else None
        sc, token = school.update(s, sc, name, uid, email, clear_email=raw == "", lang=lang)
        if not sc:
            return 404, {"error": "unknown station"}
        _send_confirm(sc, token)
        return 200, _school_view(s, sc, t)
    if path == "/school/confirm":
        if not school.confirm_email(s, sc, body.get("token")):
            return 409, {"error": "this confirmation link is no longer valid"}
        return 200, _school_view(s, sc, t)
    if path == "/school/log":
        action = body.get("action")
        if action is not None and action not in school.ACTIONS:
            return 400, {"error": "unknown action"}
        if not school.log_action(s, sc, body.get("date"), action, t):
            return 404, {"error": "no plan for that day"}
        return 200, _school_view(s, sc, t)
    if path == "/school/delete":
        school.remove(s, sc)
        return 200, {"deleted": True}
    return 404, {"error": "not found"}


def _clean_place(p):
    if not isinstance(p, dict):
        return None
    lat, lon = float(p["lat"]), float(p["lon"])
    if not places.in_area(lat, lon):
        return None
    return {"lat": lat, "lon": lon, "address": " ".join(str(p.get("address") or "").split())[:160]}


def _school_view(s, sc, t):
    return {**school.view(s, sc, t), "email_enabled": email_enabled(),
            "reliability": reliability.for_station(s, sc["uid"], t)}


def _send_confirm(sc, token):
    if token and mail.enabled():
        try:
            school.send_confirm(sc, token)
        except Exception as e:  # the page still shows "not confirmed yet"; they can re-enter the address
            print("confirm email skipped:", repr(e))


def _clean_email(v):
    v = (v or "").strip()
    return v if email_enabled() and EMAIL_RE.match(v) and len(v) <= 254 else None


def _mask(email):
    name, _, domain = email.partition("@")
    return f"{name[:2]}…@{domain}"


def _public(h):
    out = {k: h.get(k) for k in ("id", "uid", "name", "pollutant", "created_ts", "lo", "hi",
                                 "point", "calibrated", "status", "actual", "miss_by", "actual_ts")}
    out["email_hint"] = _mask(h["email"]) if h.get("email") else None  # never echo the full address
    return out


def _start(hold):
    arn = os.environ.get("STATE_MACHINE_ARN")
    if arn:
        sfn().start_execution(stateMachineArn=arn, name=hold["id"],
                              input=json.dumps({"holdId": hold["id"]}))


def handler(event, _ctx):
    http = event["requestContext"]["http"]
    body = json.loads(event["body"]) if event.get("body") else {}
    try:
        code, out = route(http["method"], event["rawPath"], event.get("queryStringParameters") or {},
                          body, store(), now(), _start)
    except (KeyError, ValueError) as e:
        code, out = 400, {"error": f"bad request: {e}"}
    return _resp(code, out)
