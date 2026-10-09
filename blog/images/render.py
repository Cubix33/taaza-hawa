"""Render blog figures from images/src/*.html to 2x PNGs (1760 px wide) for AWS Builder Center.

    py blog/images/render.py            # all figures
    py blog/images/render.py cover      # one figure

Needs Python Playwright with Chromium (`pip install playwright && playwright install chromium`).
Fonts load from Google Fonts, so run it online.
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE / "src"
FIGS = ["cover", "architecture", "loop", "clock-bug", "perfect-score"]


def main(names: list[str]) -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 960, "height": 900}, device_scale_factor=2)
        for name in names:
            page.goto((SRC / f"{name}.html").as_uri(), wait_until="networkidle")
            page.evaluate("document.fonts.ready")
            page.wait_for_timeout(400)
            out = HERE / f"{name}.png"
            page.locator(".frame").screenshot(path=str(out))
            print("wrote", out.relative_to(HERE.parent.parent))
        browser.close()


if __name__ == "__main__":
    main(sys.argv[1:] or FIGS)
