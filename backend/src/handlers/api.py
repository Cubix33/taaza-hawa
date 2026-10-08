"""Lambda Function URL (payload v2) router. CORS is set on the URL config in the SAM template."""
import json
import os

from taaza import phrase, service

from .common import now, sfn, store

DEFAULT_UID = int(os.environ.get("DEFAULT_STATION_UID", "0"))


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
        return 200, {"stations": service.station_list(s, t)}
    if path == "/card" and method == "GET":
        uid = int(q.get("uid") or DEFAULT_UID)
        card = service.build_card(s, uid, t)
        if not card:
            return 404, {"error": "unknown station"}
        ai = phrase.rephrase(s, card["sentence_hi"])
        card["sentence_hi_ai"] = ai
        card["ai_on"] = ai is not None
        return 200, card
    if path == "/scoreboard" and method == "GET":
        return 200, {**service.scoreboard(s, _recent_dates(t)), "now": t}
    if path == "/hold" and method == "POST":
        hold = service.create_hold(s, int(body["uid"]), t, body.get("email") or None)
        if not hold:
            return 409, {"error": "no estimate available for this station right now"}
        if start_execution:
            start_execution(hold)
        return 201, _public(hold)
    if path == "/hold" and method == "GET":
        hold = service.get_hold(s, q.get("id", ""))
        return (200, _public(hold)) if hold else (404, {"error": "unknown hold"})
    return 404, {"error": "not found"}


def _public(h):
    return {k: h.get(k) for k in ("id", "uid", "name", "pollutant", "created_ts", "lo", "hi",
                                  "point", "calibrated", "status", "actual", "miss_by", "actual_ts")}


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
