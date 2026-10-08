"""Tiny key-value layer: DynamoDB in AWS, a dict in tests and local dev.

Single table, string pk/sk. Key layout:
  STATION / {uid}            station meta + per-pollutant calibration
  READ#{uid} / {ts:012d}     one reading (sub-indices) + CAMS value at that hour
  PRED#{uid} / MORNING#{date}  or  HOLD#{id}    graded promises
  KV / {name}                misc (cams cache, bulletin line, poll health)
"""
from __future__ import annotations

import os
from decimal import Decimal
from typing import Any, Protocol


class Store(Protocol):
    def put(self, pk: str, sk: str, item: dict) -> None: ...
    def get(self, pk: str, sk: str) -> dict | None: ...
    def query(self, pk: str, prefix: str = "", limit: int | None = None,
              reverse: bool = False) -> list[dict]: ...


class MemoryStore:
    def __init__(self) -> None:
        self._d: dict[str, dict[str, dict]] = {}

    def put(self, pk: str, sk: str, item: dict) -> None:
        self._d.setdefault(pk, {})[sk] = {**item, "pk": pk, "sk": sk}

    def get(self, pk: str, sk: str) -> dict | None:
        item = self._d.get(pk, {}).get(sk)
        return dict(item) if item else None

    def query(self, pk: str, prefix: str = "", limit: int | None = None,
              reverse: bool = False) -> list[dict]:
        keys = sorted(k for k in self._d.get(pk, {}) if k.startswith(prefix))
        if reverse:
            keys.reverse()
        if limit:
            keys = keys[:limit]
        return [dict(self._d[pk][k]) for k in keys]


def _to_ddb(v: Any) -> Any:
    if isinstance(v, float):
        return Decimal(str(round(v, 4)))
    if isinstance(v, dict):
        return {k: _to_ddb(x) for k, x in v.items() if x is not None}
    if isinstance(v, list):
        return [_to_ddb(x) for x in v]
    return v


def _from_ddb(v: Any) -> Any:
    if isinstance(v, Decimal):
        return int(v) if v == v.to_integral_value() else float(v)
    if isinstance(v, dict):
        return {k: _from_ddb(x) for k, x in v.items()}
    if isinstance(v, list):
        return [_from_ddb(x) for x in v]
    return v


class DynamoStore:
    def __init__(self, table_name: str | None = None) -> None:
        import boto3  # provided by the Lambda runtime
        self._t = boto3.resource("dynamodb").Table(table_name or os.environ["TABLE_NAME"])

    def put(self, pk: str, sk: str, item: dict) -> None:
        self._t.put_item(Item=_to_ddb({**item, "pk": pk, "sk": sk}))

    def get(self, pk: str, sk: str) -> dict | None:
        r = self._t.get_item(Key={"pk": pk, "sk": sk}).get("Item")
        return _from_ddb(r) if r else None

    def query(self, pk: str, prefix: str = "", limit: int | None = None,
              reverse: bool = False) -> list[dict]:
        from boto3.dynamodb.conditions import Key
        cond = Key("pk").eq(pk)
        if prefix:
            cond = cond & Key("sk").begins_with(prefix)
        kw: dict = {"KeyConditionExpression": cond, "ScanIndexForward": not reverse}
        if limit:
            kw["Limit"] = limit
        out: list[dict] = []
        while True:
            r = self._t.query(**kw)
            out.extend(_from_ddb(i) for i in r.get("Items", []))
            if limit and len(out) >= limit:
                return out[:limit]
            if "LastEvaluatedKey" not in r:
                return out
            kw["ExclusiveStartKey"] = r["LastEvaluatedKey"]
