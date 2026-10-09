"""EventBridge Scheduler target. One function, three schedules (event["task"]):
  poll      every 15 min : WAQI stations + CAMS -> ingest, calibrate, grade, close holds;
                         NASA FIRMS fire count + wind, at most every 3 h
  morning   06:30 IST    : one graded promise per station (feeds the Scoreboard),
                         then each registered school's plan for the day (emailed if confirmed)
  bulletin  17:30 IST    : quote CPCB's own participation line
"""
import os
from datetime import datetime

from taaza import mail, school, service, smoke
from taaza.sources import bulletin, openmeteo, waqi

from .common import now, send_hold_result, store


def handler(event, _ctx):
    task = (event or {}).get("task", "poll")
    s, t = store(), now()
    if task == "poll":
        readings = waqi.fetch_delhi(os.environ["WAQI_TOKEN"])
        try:
            cams = openmeteo.fetch_cams()
        except Exception as e:
            print("CAMS fetch failed:", repr(e))
            cams = {}
        migrated = service.migrate_v2(s, t)  # once, before the first corrected readings land
        if any(migrated.values()):
            print("migrated to real UTC + CPCB scale", migrated)
        res = service.ingest(s, readings, cams, t, on_hold_graded=send_hold_result)
        res["morning_catch_up"] = service.ensure_morning(s, t)
        try:
            res["fires"] = smoke.refresh(s, t)
        except Exception as e:  # context only: the answer never depends on it
            print("fires refresh failed:", repr(e))
        res["schools"] = school.morning(s, t, _school_mailer())
        print("poll", res)
        return res
    if task == "morning":
        n = service.morning_predictions(s, t)
        schools = school.morning(s, t, _school_mailer())
        print("morning predictions", n, "schools", schools)
        return {"created": n, "schools": schools}
    if task == "bulletin":
        day = datetime.fromtimestamp(t, service.IST).date()
        found = bulletin.fetch_participation(day)
        if found:
            s.put("KV", "bulletin", found)
        print("bulletin", found)
        return found or {}
    raise ValueError(f"unknown task {task}")


def _school_mailer():
    return school.send_morning if mail.enabled() else None
