"""Optional Bedrock phrasing. Words only: the model never sees a decision to make.

Guard: the output must contain every number from the template and none of the banned words,
otherwise we silently fall back to the template and the UI shows the "AI बंद" badge.
"""
from __future__ import annotations

import hashlib
import os
import re

from .store import Store

BANNED = ("dark", "offline", "tamper", "true aqi", "sprinkler", "complaint", "grap", "अंधेरा", "छेड़छाड़")
PROMPT = ("Rewrite this air-quality note as ONE short, plain, natural Hindi sentence for a Delhi "
          "resident. Keep every number exactly. Do not add advice, causes, blame or health claims. "
          "Output only the sentence.\n\nNote: {t}")


def _numbers(s: str) -> set[str]:
    return set(re.findall(r"\d+", s))


def valid(template: str, out: str) -> bool:
    low = out.lower()
    return (bool(out.strip()) and "\n" not in out.strip() and _numbers(template) <= _numbers(out)
            and not any(b in low for b in BANNED))


def rephrase(store: Store, template_hi: str) -> str | None:
    model = os.environ.get("BEDROCK_MODEL_ID")
    if not model:
        return None
    key = hashlib.sha1(template_hi.encode()).hexdigest()
    hit = store.get("KV", f"phrase#{key}")
    if hit:
        return hit["text"]
    try:
        import boto3
        br = boto3.client("bedrock-runtime", region_name=os.environ.get("BEDROCK_REGION", "ap-south-1"))
        r = br.converse(modelId=model, messages=[{"role": "user", "content": [{"text": PROMPT.format(t=template_hi)}]}],
                        inferenceConfig={"maxTokens": 160, "temperature": 0})
        out = r["output"]["message"]["content"][0]["text"].strip()
    except Exception:
        return None
    if not valid(template_hi, out):
        return None
    store.put("KV", f"phrase#{key}", {"text": out})
    return out
