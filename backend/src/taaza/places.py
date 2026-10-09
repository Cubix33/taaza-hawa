"""Find a school by name: Amazon Location Service (Places) on AWS, OpenStreetMap Photon where
Amazon Location is unavailable (local dev without boto3/credentials). Results are kept, because the
chosen school's position is stored, so Amazon Location is asked with IntendedUse=Storage."""
from __future__ import annotations

import hashlib
import math
import os
import urllib.parse

from .sources.http import get_json
from .store import Store

DELHI_NCR = (76.80, 28.35, 77.55, 28.95)  # west, south, east, north
LIMIT = 6


def in_area(lat: float, lon: float) -> bool:
    w, s, e, n = DELHI_NCR
    return s <= lat <= n and w <= lon <= e


def km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    a = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lon2 - lon1) / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(a))


def search(store: Store, q: str) -> dict:
    q = " ".join(str(q or "").split())[:100]
    if len(q) < 3:
        return {"results": [], "source": None}
    key = hashlib.sha1(q.lower().encode()).hexdigest()
    hit = store.get("KV", f"place#{key}")
    if hit:
        return {"results": hit["results"], "source": hit["source"]}
    try:
        out = {"results": _amazon(q), "source": "Amazon Location Service"}
    except Exception as e:  # no boto3 / credentials / quota: the open map still finds most schools
        print("Amazon Location unavailable:", repr(e))
        try:
            out = {"results": _photon(q), "source": "OpenStreetMap"}
        except Exception as e2:
            print("Photon failed:", repr(e2))
            return {"results": [], "source": None}
    out["results"].sort(key=lambda r: not r["school"])  # schools first, stable otherwise
    store.put("KV", f"place#{key}", out)
    return out


def _amazon(q: str) -> list[dict]:
    import boto3
    geo = boto3.client("geo-places", region_name=os.environ.get("PLACES_REGION", "ap-south-1"))
    r = geo.search_text(QueryText=q, MaxResults=LIMIT, Language="en", IntendedUse="Storage",
                        Filter={"BoundingBox": list(DELHI_NCR), "IncludeCountries": ["IND"]})
    out = []
    for i in r.get("ResultItems", []):
        lon, lat = i["Position"]
        label = (i.get("Address") or {}).get("Label") or ""
        title = i.get("Title") or label.split(",")[0]
        out.append({"name": title, "address": _rest(label, title), "lat": lat, "lon": lon,
                    "school": any(c.get("Id", "").startswith(("school", "education"))
                                  or "school" in (c.get("Name") or "").lower() for c in i.get("Categories", []))})
    return out


def _photon(q: str) -> list[dict]:
    w, s, e, n = DELHI_NCR
    url = ("https://photon.komoot.io/api/?" +
           urllib.parse.urlencode({"q": q, "limit": LIMIT, "lang": "en", "bbox": f"{w},{s},{e},{n}"}))
    out = []
    for f in get_json(url, timeout=8).get("features", []):
        p = f.get("properties", {})
        lon, lat = f["geometry"]["coordinates"]
        name = p.get("name") or p.get("street")
        if not name:
            continue
        addr = ", ".join(x for x in (p.get("street"), p.get("district"), p.get("city"), p.get("postcode")) if x)
        out.append({"name": name, "address": addr, "lat": lat, "lon": lon,
                    "school": p.get("osm_value") in ("school", "college", "kindergarten")})
    return out


def _rest(label: str, title: str) -> str:
    """Address without the place's own name in front, and without the country at the end."""
    rest = label[len(title):].lstrip(", ") if label.startswith(title) else label
    return rest.removesuffix(", India")
