"""CPCB daily AQI bulletin: we quote its station-participation line verbatim, nothing more.

The PDF layout is NOT yet verified (see docs R8). `find_participation` is deliberately lenient
and returns the matched source line so the UI can show CPCB's own words; if nothing matches
we return None and show nothing rather than guess.
"""
from __future__ import annotations

import io
import re
from datetime import date

from .http import get_bytes

URL = "https://cpcb.gov.in/upload/Downloads/AQI_Bulletin_{ymd}.pdf"
PATTERNS = [
    re.compile(r"(\d+)\s*(?:out\s+of|of|/)\s*(\d+)\s+(?:Delhi\s+)?(?:CAAQMS\s+)?stations", re.I),
    re.compile(r"(?:stations|monitoring\s+stations)[^\n]{0,60}?(\d+)\s*(?:out\s+of|of|/)\s*(\d+)", re.I),
]


def find_participation(text: str) -> dict | None:
    for line in text.splitlines():
        for pat in PATTERNS:
            m = pat.search(line)
            if m:
                a, b = int(m.group(1)), int(m.group(2))
                if 0 < a <= b <= 200:
                    return {"reporting": a, "total": b, "line": line.strip()}
    return None


def pdf_text(data: bytes) -> str:
    from pypdf import PdfReader  # pure Python (bundled via requirements.txt); the table is text
    return "\n".join((p.extract_text() or "") for p in PdfReader(io.BytesIO(data)).pages)


def fetch_participation(day: date) -> dict | None:
    url = URL.format(ymd=day.strftime("%Y%m%d"))
    found = find_participation(pdf_text(get_bytes(url, timeout=30)))
    return {**found, "date": day.isoformat(), "source": url} if found else None
