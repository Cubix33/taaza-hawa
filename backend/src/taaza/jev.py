"""Optional TypeSafe Jev classifier.  It returns labels only, never prose or AQI data."""
from __future__ import annotations

import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

URL = "https://api.typesafe.ai/v1/systemone"


def enabled() -> bool:
    return bool(os.environ.get("JEV_API_KEY") or os.environ.get("TYPESAFE_API_KEY")) and os.environ.get("JEV_ENABLED", "true").lower() != "false"


def classify(text: str) -> dict | None:
    """Return TypeSafe's typed fan-out answers, or None for every provider failure."""
    key = os.environ.get("JEV_API_KEY") or os.environ.get("TYPESAFE_API_KEY")
    if not enabled() or not key:
        return None
    payload = {"model": os.environ.get("JEV_MODEL") or os.environ.get("TYPESAFE_MODEL", "jev-1.13.0"),
               "state": {"user_text": text},
               "questions": {
                   "mismatch_kind": {"type": "choice", "instructions": "What does not match the app?", "criteria": {"device_reading": "own purifier or monitor", "other_app": "another app", "sky_looks_worse": "sky or smell", "station_distrust": "doubts station", "other": None}},
                   "source": {"type": "choice", "instructions": "Where did the number come from?", "criteria": {"home_purifier": "purifier", "personal_monitor": "monitor", "iqair_app": "IQAir", "phone_weather": "phone weather", "govt_app": "government app", "news": "news", "unknown": None}},
                   "says_ugm3": {"type": "noul", "instructions": "Does it say PM concentration in ug/m3, not AQI?"},
                   "indoors": {"type": "noul", "instructions": "Was it measured inside?"},
                   "indoor_smoke": {"type": "noul", "instructions": "Does it mention incense, cooking, smoking, coil, diya, or heater?"},
                   "fog_or_humid": {"type": "noul", "instructions": "Does it mention fog, mist, humidity, or rain?"}}}
    try:
        timeout = max(0.1, min(float(os.environ.get("JEV_TIMEOUT_MS", "1500")) / 1000, 2.0))
        req = Request(URL, data=json.dumps(payload).encode(), headers={"authorization": f"Bearer {key}", "content-type": "application/json"}, method="POST")
        with urlopen(req, timeout=timeout) as response:
            return json.loads(response.read())
    except (HTTPError, URLError, TimeoutError, ValueError, OSError):
        return None
