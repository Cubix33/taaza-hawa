import json
import os
import time

from taaza.store import DynamoStore

_store = None


def store():
    global _store
    if _store is None:
        _store = DynamoStore()
    return _store


def now() -> int:
    return int(time.time())


def sfn():
    import boto3
    return boto3.client("stepfunctions")


def send_hold_result(hold: dict) -> None:
    """Close the waiting Step Functions execution with the grade (no-op until a token is registered)."""
    token = hold.get("task_token")
    if not token:
        return
    out = {k: hold.get(k) for k in ("id", "uid", "name", "pollutant", "lo", "hi", "status",
                                    "actual", "miss_by", "email")}
    try:
        sfn().send_task_success(taskToken=token, output=json.dumps(out))
    except Exception as e:  # token already used / execution gone: grading is already stored
        print("send_task_success skipped:", repr(e))


def table_env() -> str:
    return os.environ["TABLE_NAME"]
