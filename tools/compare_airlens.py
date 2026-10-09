#!/usr/bin/env python3
"""Build the 10 Air Lens comparison branches and show them side by side in one browser tab.

    python tools/compare_airlens.py              # fetch, build all 10, serve, open the comparison page
    python tools/compare_airlens.py --no-build   # serve the builds from last time
    python tools/compare_airlens.py --only 02,06 # build/serve a subset

Needs git, Node 20+ (npm on PATH) and Python 3.9+. Every build talks to the live API with GET
requests only. Work files go to .airlens-compare/ (git-ignored). Ctrl+C stops all servers.
"""
from __future__ import annotations

import argparse
import functools
import hashlib
import html
import io
import os
import shutil
import subprocess
import sys
import tarfile
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

API = "https://ktmdmcvoyilf7pfl5npdigkyaq0uucbi.lambda-url.ap-south-1.on.aws"
COMPARE_PORT = 5200
FIRST_PORT = 5201
BRANCHES = [
    ("01", "airlens/01-baseline", "Baseline", "Air Lens as it is live today"),
    ("02", "airlens/02-sky", "Living sky", "Real sun lighting and AQI-driven haze; Live / Dusk / Day"),
    ("03", "airlens/03-wind", "Wind", "Open-Meteo wind streaks and a wind readout in the panel"),
    ("04", "airlens/04-replay", "24-hour replay", "Scrub or play the last 24 hours across all stations"),
    ("05", "airlens/05-nearby", "Cleaner air near me", "Drop a pin: nearby fresh stations ranked, plus accessibility fixes"),
    ("06", "airlens/06-sky-wind", "Sky + wind", "The realism pair"),
    ("07", "airlens/07-replay-nearby", "Replay + nearby", "The usefulness pair"),
    ("08", "airlens/08-sky-replay", "Sky + replay", ""),
    ("09", "airlens/09-wind-nearby", "Wind + nearby", ""),
    ("10", "airlens/10-all-four", "All four", "Sky, wind, replay and cleaner air near me"),
]

ROOT = Path(subprocess.run(["git", "rev-parse", "--show-toplevel"], capture_output=True, text=True, check=True).stdout.strip())
WORK = ROOT / ".airlens-compare"
SRC = WORK / "src"      # one checkout area, so node_modules is installed once
DIST = WORK / "dist"


def run(cmd: list[str], cwd: Path | None = None, env: dict | None = None) -> None:
    print("  $", " ".join(cmd))
    subprocess.run(cmd, cwd=cwd, env=env, check=True)


def ref_for(branch: str) -> str:
    for ref in (f"origin/{branch}", branch):
        if subprocess.run(["git", "rev-parse", "--verify", "--quiet", ref], cwd=ROOT, capture_output=True).returncode == 0:
            return ref
    sys.exit(f"Branch {branch} not found. Run `git fetch origin` and check the name.")


def export_web(ref: str) -> None:
    """Replace SRC/web with the branch's web/ folder, keeping the installed node_modules."""
    web = SRC / "web"
    web.mkdir(parents=True, exist_ok=True)
    for child in web.iterdir():
        if child.name != "node_modules":
            shutil.rmtree(child) if child.is_dir() else child.unlink()
    tar = subprocess.run(["git", "archive", "--format=tar", ref, "web"], cwd=ROOT, capture_output=True, check=True).stdout
    with tarfile.open(fileobj=io.BytesIO(tar)) as t:
        try:
            t.extractall(SRC, filter="data")
        except TypeError:  # Python without extraction filters
            t.extractall(SRC)


def build(code: str, branch: str, npm: str) -> None:
    ref = ref_for(branch)
    print(f"\n[{code}] {branch} ({ref})")
    export_web(ref)
    web = SRC / "web"
    lock = hashlib.sha1((web / "package-lock.json").read_bytes()).hexdigest()
    stamp = web / "node_modules" / ".compare-lock"
    if not stamp.exists() or stamp.read_text() != lock:
        run([npm, "ci", "--no-audit", "--no-fund"], cwd=web)
        stamp.write_text(lock)
    out = DIST / code
    run([npm, "run", "build", "--", "--outDir", str(out), "--emptyOutDir"], cwd=web, env={**os.environ, "VITE_API_URL": API})


class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args) -> None:
        pass


def serve(directory: Path, port: int) -> ThreadingHTTPServer:
    server = ThreadingHTTPServer(("127.0.0.1", port), functools.partial(Quiet, directory=str(directory)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


def compare_page(items: list[tuple]) -> str:
    cards = "\n".join(f"""
    <article class="card" id="c{code}">
      <header><b>{code} · {html.escape(title)}</b><span>{html.escape(note)}</span>
        <a href="http://localhost:{port}/#/stations" target="_blank" rel="noopener">open full ↗</a>
        <button type="button" data-zoom="c{code}">enlarge</button></header>
      <iframe loading="lazy" src="http://localhost:{port}/#/stations" title="{html.escape(title)}"></iframe>
      <footer><code>git switch {html.escape(branch)}</code></footer>
    </article>""" for code, branch, title, note, port in items)
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Air Lens: compare {len(items)} configurations</title>
<style>
 body {{ margin: 0; font: 14px/1.4 system-ui, sans-serif; background: #f3f1ea; color: #1d1c19; }}
 .top {{ position: sticky; top: 0; z-index: 2; display: flex; gap: 16px; align-items: center; padding: 10px 18px; background: #1d1c19; color: #fbf8f2; }}
 .top label {{ display: flex; gap: 6px; align-items: center; }}
 .grid {{ display: grid; grid-template-columns: repeat(var(--cols, 2), minmax(0, 1fr)); gap: 14px; padding: 14px; }}
 .card {{ display: flex; flex-direction: column; background: #fff; border: 1px solid #ddd6c8; border-radius: 10px; overflow: hidden; }}
 .card header {{ display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap; padding: 8px 12px; border-bottom: 1px solid #eee7da; }}
 .card header span {{ color: #6b665c; flex: 1; }}
 .card header a, .card header button {{ font: inherit; color: #2f6da8; background: none; border: 0; cursor: pointer; padding: 0; }}
 .card iframe {{ width: 100%; height: var(--h, 720px); border: 0; }}
 .card footer {{ padding: 6px 12px; color: #6b665c; font-size: 12px; }}
 .card.zoom {{ position: fixed; inset: 52px 14px 14px; z-index: 3; }}
 .card.zoom iframe {{ height: 100%; flex: 1; }}
</style></head><body>
<div class="top"><b>Air Lens · {len(items)} configurations</b>
 <label>columns <select id="cols"><option>1</option><option selected>2</option><option>3</option></select></label>
 <label>height <select id="h"><option>560</option><option selected>720</option><option>900</option></select></label>
 <span>Each frame is its own site (own port), so language, Dusk/Day and toggles are set per frame. Maps load as you scroll.</span></div>
<main class="grid" id="grid">{cards}
</main>
<script>
 const grid = document.getElementById('grid');
 document.getElementById('cols').onchange = (e) => grid.style.setProperty('--cols', e.target.value);
 document.getElementById('h').onchange = (e) => grid.style.setProperty('--h', e.target.value + 'px');
 document.querySelectorAll('[data-zoom]').forEach((b) => b.onclick = () => {{
   const c = document.getElementById(b.dataset.zoom), on = !c.classList.contains('zoom');
   document.querySelectorAll('.card.zoom').forEach((x) => x.classList.remove('zoom'));
   c.classList.toggle('zoom', on); b.textContent = on ? 'close' : 'enlarge';
 }});
</script></body></html>"""


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--no-build", action="store_true", help="serve existing builds in .airlens-compare/dist")
    ap.add_argument("--only", help="comma list of codes, e.g. 01,06,10")
    ap.add_argument("--no-open", action="store_true", help="don't open a browser")
    a = ap.parse_args()
    chosen = [b for b in BRANCHES if not a.only or b[0] in a.only.split(",")]

    if not a.no_build:
        npm = shutil.which("npm") or shutil.which("npm.cmd")
        if not npm:
            sys.exit("npm not found on PATH: install Node 20+ first.")
        print("Fetching branches…")
        subprocess.run(["git", "fetch", "origin", "--quiet"], cwd=ROOT, check=False)
        for code, branch, *_ in chosen:
            build(code, branch, npm)

    servers, items = [], []
    for i, (code, branch, title, note) in enumerate(BRANCHES):
        if (code, branch, title, note) not in chosen:
            continue
        out = DIST / code
        if not (out / "index.html").exists():
            print(f"[{code}] no build at {out}; run without --no-build")
            continue
        port = FIRST_PORT + i
        servers.append(serve(out, port))
        items.append((code, branch, title, note, port))
        print(f"[{code}] {title:22} http://localhost:{port}/#/stations")

    page = WORK / "compare"
    page.mkdir(parents=True, exist_ok=True)
    (page / "index.html").write_text(compare_page(items), encoding="utf-8")
    servers.append(serve(page, COMPARE_PORT))
    url = f"http://localhost:{COMPARE_PORT}/"
    print(f"\nSide by side: {url}\nCtrl+C to stop.")
    if not a.no_open:
        webbrowser.open(url)
    try:
        threading.Event().wait()
    except KeyboardInterrupt:
        for s in servers:
            s.shutdown()


if __name__ == "__main__":
    main()
