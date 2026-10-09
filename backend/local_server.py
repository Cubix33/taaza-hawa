"""Local dev server: same routes as the Lambda API, in-memory store.

  python local_server.py            -> SYNTHETIC demo data (every response carries "demo": true)
  WAQI_TOKEN=xxx python local_server.py --live   -> poll real WAQI + CAMS every 15 min

Extra dev-only routes (demo mode): POST /dev/return?uid=1  -> that station "comes back" with a
fresh reading, which grades any pending promise. POST /dev/morning -> create morning promises
(and today's school plans).
"""
import argparse
import json
import os
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qsl, urlparse

sys.path.insert(0, str(Path(__file__).parent / "src"))

from handlers.api import route  # noqa: E402
from taaza import demo, school, service  # noqa: E402
from taaza.sources import bulletin, openmeteo, waqi  # noqa: E402
from taaza.sources.waqi import StationReading  # noqa: E402

STORE = None
LIVE = False
LOCK = threading.Lock()


def now():
    return int(time.time())


def poll_forever(token):
    while True:
        try:
            with LOCK:
                readings = waqi.fetch_delhi(token)
                try:
                    cams = openmeteo.fetch_cams()
                except Exception as e:
                    print("CAMS failed:", e)
                    cams = {}
                print("poll", service.ingest(STORE, readings, cams, now()))
        except Exception as e:
            print("poll failed:", repr(e))
        time.sleep(900)


def dev_return(uid):
    meta = STORE.get("STATION", str(uid))
    last = service.latest_reading(STORE, uid)
    cards = service.build_card(STORE, uid, now())
    level = cards.get("interval", {}).get("point") if cards.get("interval") else (last or {}).get("values", {}).get("pm10", 200)
    t = now()
    r = StationReading(uid, meta["name"], meta["lat"], meta["lon"], t + 1, {"pm10": round(level + 18), "pm25": round(level * 0.7)})
    return service.ingest(STORE, [r], service.get_cams(STORE), t + 2)


class H(BaseHTTPRequestHandler):
    def _send(self, code, body):
        data = json.dumps(body, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("content-type", "application/json; charset=utf-8")
        self.send_header("access-control-allow-origin", "*")
        self.send_header("access-control-allow-headers", "content-type")
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self._send(204, {})

    def _go(self, method):
        u = urlparse(self.path)
        q = dict(parse_qsl(u.query))
        n = int(self.headers.get("content-length") or 0)
        body = json.loads(self.rfile.read(n)) if n else {}
        try:
            with LOCK:
                if u.path == "/dev/return" and not LIVE:
                    return self._send(200, dev_return(int(q["uid"])))
                if u.path == "/dev/morning" and not LIVE:
                    return self._send(200, {"created": service.morning_predictions(STORE, now()),
                                            "schools": school.morning(STORE, now())})
                code, out = route(method, u.path, q, body, STORE, now())
        except (KeyError, ValueError) as e:
            code, out = 400, {"error": str(e)}
        if isinstance(out, dict) and not LIVE:
            out["demo"] = True
        self._send(code, out)

    def do_GET(self):
        self._go("GET")

    def do_POST(self):
        self._go("POST")

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--live", action="store_true")
    ap.add_argument("--port", type=int, default=8787)
    a = ap.parse_args()
    LIVE = a.live
    os.environ.setdefault("DEFAULT_STATION_UID", "1")
    if LIVE:
        from taaza.store import MemoryStore
        STORE = MemoryStore()
        threading.Thread(target=poll_forever, args=(os.environ["WAQI_TOKEN"],), daemon=True).start()
    else:
        STORE = demo.seed(now())
        service.morning_predictions(STORE, now())
        # demo only: plans are decided whenever you look, so a rehearsal at night isn't empty
        school.DECIDE_AT = (0, 0)
        print("Demo Bad-air plan network (open a link to see that organisation):")
        network = demo.seed_network(STORE, now())
        school.morning(STORE, now())
        for org in network:
            print(f"  {org['name']:<32} http://localhost:5173/#/plan?id={org['id']}&k={org['key']}"
                  + (f"   crew page: http://localhost:5173/#/crew?t={org['pub']}" if org["kind"] == "work" else ""))
    print(f"Taaza Hawa API on http://localhost:{a.port} ({'LIVE' if LIVE else 'DEMO synthetic data'})")
    ThreadingHTTPServer(("127.0.0.1", a.port), H).serve_forever()
