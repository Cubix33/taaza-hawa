"""EventBridge Scheduler target. One function, three schedules (event["task"]):
  poll      every 15 min : WAQI stations + CAMS -> ingest, calibrate, grade, close holds
  morning   06:30 IST    : one graded promise per station (feeds the Scoreboard)
  bulletin  17:30 IST    : quote CPCB's own participation line
"""
import os
from datetime import datetime

from taaza import service
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
        res = service.ingest(s, readings, cams, t, on_hold_graded=send_hold_result)
        res["morning_catch_up"] = service.ensure_morning(s, t)
        print("poll", res)
        return res
    if task == "morning":
        n = service.morning_predictions(s, t)
        print("morning predictions", n)
        return {"created": n}
    if task == "bulletin":
        day = datetime.fromtimestamp(t, service.IST).date()
        found = bulletin.fetch_participation(day)
        if found:
            s.put("KV", "bulletin", found)
        print("bulletin", found)
        return found or {}
    raise ValueError(f"unknown task {task}")
