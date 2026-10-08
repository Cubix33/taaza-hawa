"""Step Functions task handlers for the 'हमें परखो' execution.

  register : receives the task token, parks it in DynamoDB (the poller closes it later)
  expire   : 72 h with no judging reading -> "Missed, still waiting"
  notify   : SES receipt email (best effort; the card already shows the result)
"""
import os

from taaza import grader, service

from .common import send_hold_result, store


def register(event, _ctx):
    s = store()
    hold = service.get_hold(s, event["holdId"])
    hold["task_token"] = event["token"]
    s.put(hold["pk"], hold["sk"], hold)
    if hold["status"] != grader.PENDING:  # graded before the token landed: close right away
        send_hold_result(hold)
    return {}  # response is ignored; the execution waits for SendTaskSuccess


def expire(event, _ctx):
    s = store()
    hold = service.get_hold(s, event["holdId"])
    if hold["status"] == grader.PENDING:
        hold["status"] = grader.MISSED_WAITING
        s.put(hold["pk"], hold["sk"], hold)
    return {k: hold.get(k) for k in ("id", "uid", "name", "pollutant", "lo", "hi", "status",
                                     "actual", "miss_by", "email")}


def notify(event, _ctx):
    g = event.get("grade") or event
    email = g.get("email")
    if not email or not os.environ.get("SES_SENDER"):
        return g
    verdict = {"HIT": "सही (Hit)", "MISSED": f"चूक by {g.get('miss_by')} (Missed)",
               "MISSED_WAITING": "चूक: 72 घंटे में रीडिंग नहीं आई (Missed, still waiting)"}.get(g["status"], g["status"])
    body = (f"{g['name']}\nहमने कहा था: {round(g['lo'])}–{round(g['hi'])}\n"
            f"स्टेशन ने बताया: {g.get('actual')}\nनतीजा: {verdict}\n\n"
            "Station air, not your street. An estimate, not the truth.")
    try:
        import boto3
        boto3.client("ses").send_email(
            Source=os.environ["SES_SENDER"], Destination={"ToAddresses": [email]},
            Message={"Subject": {"Data": f"Taaza Hawa: {verdict}"}, "Body": {"Text": {"Data": body}}})
    except Exception as e:
        print("SES skipped:", repr(e))
    return g
