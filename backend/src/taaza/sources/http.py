from __future__ import annotations

import json
import urllib.request

UA = "taaza-hawa/0.1 (+https://github.com/Cubix33)"


def get_bytes(url: str, timeout: float = 20.0) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def get_json(url: str, timeout: float = 20.0) -> dict:
    return json.loads(get_bytes(url, timeout))
