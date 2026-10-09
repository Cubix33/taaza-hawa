"""Capture the live site for the blog, with real data. Run this only AFTER the clock fix is deployed.

    py blog/images/capture_live.py                      # writes blog/images/live-*.png
    OUT=some/dir py blog/images/capture_live.py         # write somewhere else
"""
import os
import pathlib

from playwright.sync_api import sync_playwright

SITE = os.environ.get("SITE", "https://main.d2r1frd99buxhf.amplifyapp.com/")
OUT = pathlib.Path(os.environ.get("OUT", pathlib.Path(__file__).resolve().parent))
SHOTS = [  # (file, hash route, viewport)
    ("live-home", "#/", (1280, 860)),
    ("live-check", "#/check", (1280, 860)),
    ("live-record", "#/record", (1280, 860)),
    ("live-stations", "#/stations", (1280, 860)),
    ("live-mobile-check", "#/check", (390, 844)),
]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for name, route, (w, h) in SHOTS:
            page = browser.new_page(viewport={"width": w, "height": h}, device_scale_factor=2)
            page.goto(SITE + route, wait_until="networkidle", timeout=60000)
            page.wait_for_timeout(2500)  # let the sky, dial and map settle
            page.screenshot(path=str(OUT / f"{name}.png"), full_page=False)
            print("wrote", OUT / f"{name}.png")
            page.close()
        browser.close()


if __name__ == "__main__":
    main()
