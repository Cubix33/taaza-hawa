"""
generate_all_screenshots.py - Captures all 7 screenshots directly from the live site
for README.md, replacing synthetic demo images with real live data.

Targets in docs/screenshots/:
1. home.jpg      (1440x900 JPEG)
2. check.jpg     (1440x1080 JPEG)
3. school.jpg    (1440x1000 JPEG)
4. notice.png    (796x890 PNG)
5. air-lens.png  (1440x900 PNG)
6. record.jpg    (1440x900 JPEG)
7. mobile.png    (1370x1500 PNG RGBA - Dual iPhone mockups with live data)
"""
import sys
import os
import pathlib
import numpy as np
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

SITE = 'https://main.d2r1frd99buxhf.amplifyapp.com/'
DOCS_SCREENSHOTS = pathlib.Path('docs/screenshots')
DOCS_SCREENSHOTS.mkdir(parents=True, exist_ok=True)

def ensure_english(page):
    lang_btn = page.query_selector('#lang')
    if lang_btn and 'English' in lang_btn.inner_text():
        lang_btn.click()
        page.wait_for_timeout(1500)

def register_school_if_needed(page):
    page.goto(SITE + '#/plan', wait_until='networkidle')
    page.wait_for_timeout(1500)
    ensure_english(page)
    
    input_el = page.query_selector('#scname')
    if input_el:
        input_el.fill('Sarvodaya Kanya')
        page.wait_for_timeout(2500)
        opt = page.query_selector('.sc-opt')
        if opt:
            opt.click()
            page.wait_for_timeout(1000)
            submit = page.query_selector('button[type="submit"]')
            if submit:
                submit.click()
                page.wait_for_timeout(3000)

def capture_home(browser):
    print("Capturing home.jpg...")
    context = browser.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=1)
    page = context.new_page()
    page.goto(SITE + '#/', wait_until='networkidle')
    page.wait_for_timeout(2500)
    ensure_english(page)
    page.wait_for_timeout(2000)
    
    out_path = DOCS_SCREENSHOTS / 'home.jpg'
    page.screenshot(path=str(out_path), type='jpeg', quality=92)
    print(f" -> Saved {out_path} ({out_path.stat().st_size} bytes)")
    context.close()

def capture_check(browser):
    print("Capturing check.jpg...")
    context = browser.new_context(viewport={'width': 1440, 'height': 1080}, device_scale_factor=1)
    page = context.new_page()
    page.goto(SITE + '#/check', wait_until='networkidle')
    page.wait_for_timeout(2500)
    ensure_english(page)
    page.wait_for_timeout(2000)
    
    out_path = DOCS_SCREENSHOTS / 'check.jpg'
    page.screenshot(path=str(out_path), type='jpeg', quality=92)
    print(f" -> Saved {out_path} ({out_path.stat().st_size} bytes)")
    context.close()

def capture_school(browser):
    print("Capturing school.jpg...")
    context = browser.new_context(viewport={'width': 1440, 'height': 1000}, device_scale_factor=1)
    page = context.new_page()
    register_school_if_needed(page)
    page.goto(SITE + '#/plan', wait_until='networkidle')
    page.wait_for_timeout(2500)
    ensure_english(page)
    page.wait_for_timeout(2000)
    
    out_path = DOCS_SCREENSHOTS / 'school.jpg'
    page.screenshot(path=str(out_path), type='jpeg', quality=92)
    print(f" -> Saved {out_path} ({out_path.stat().st_size} bytes)")
    context.close()

def capture_notice(browser):
    print("Capturing notice.png...")
    context = browser.new_context(viewport={'width': 900, 'height': 1100}, device_scale_factor=1)
    page = context.new_page()
    register_school_if_needed(page)
    page.goto(SITE + '#/plan', wait_until='networkidle')
    page.wait_for_timeout(2500)
    ensure_english(page)
    
    # Show .sc-print as an A4 notice sheet with crisp white paper and light gray border
    page.evaluate("""() => {
        const el = document.querySelector('.sc-print');
        if (el) {
            el.style.display = 'block';
            el.style.background = '#ffffff';
            el.style.padding = '36px 42px';
            el.style.width = '794px';
            el.style.minHeight = '888px';
            el.style.boxSizing = 'border-box';
            el.style.color = '#111';
            el.style.border = '1px solid #c8c8c8';
            el.style.borderRadius = '2px';
            document.body.style.background = '#f0f0f0';
            document.querySelector('.topbar').style.display = 'none';
            document.querySelector('.site-foot').style.display = 'none';
            document.querySelector('.tabbar').style.display = 'none';
            document.querySelector('.pl').style.display = 'none';
            document.querySelector('.pl-head').style.display = 'none';
        }
    }""")
    page.wait_for_timeout(1000)
    sc_print = page.query_selector('.sc-print')
    out_path = DOCS_SCREENSHOTS / 'notice.png'
    sc_print.screenshot(path=str(out_path))
    
    # Ensure exact size ~796x890
    img = Image.open(out_path)
    if img.size[0] != 796 or img.size[1] != 890:
        # Create a 796x890 white canvas with 1px border
        sheet = Image.new('RGB', (796, 890), (255, 255, 255))
        # paste rendered notice in top
        sheet.paste(img, (0, 0))
        # Draw 1px border
        draw = ImageDraw.Draw(sheet)
        draw.rectangle([0, 0, 795, 889], outline=(200, 200, 200), width=1)
        sheet.save(out_path)
        
    print(f" -> Saved {out_path} ({out_path.stat().st_size} bytes)")
    context.close()

def capture_air_lens(browser):
    print("Capturing air-lens.png...")
    context = browser.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=1)
    page = context.new_page()
    page.goto(SITE + '#/stations', wait_until='networkidle')
    page.wait_for_timeout(3000)
    ensure_english(page)
    # Give WebGL map tiles and building models ample time to fully settle
    page.wait_for_timeout(5000)
    
    out_path = DOCS_SCREENSHOTS / 'air-lens.png'
    page.screenshot(path=str(out_path))
    print(f" -> Saved {out_path} ({out_path.stat().st_size} bytes)")
    context.close()

def capture_record(browser):
    print("Capturing record.jpg...")
    context = browser.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=1)
    page = context.new_page()
    page.goto(SITE + '#/record', wait_until='networkidle')
    page.wait_for_timeout(2500)
    ensure_english(page)
    page.wait_for_timeout(2000)
    
    out_path = DOCS_SCREENSHOTS / 'record.jpg'
    page.screenshot(path=str(out_path), type='jpeg', quality=92)
    print(f" -> Saved {out_path} ({out_path.stat().st_size} bytes)")
    context.close()

def capture_mobile(browser):
    print("Capturing mobile.png (iPhone mockups)...")
    context = browser.new_context(
        viewport={'width': 393, 'height': 910},
        device_scale_factor=2,
        is_mobile=True,
        has_touch=True
    )
    page = context.new_page()
    
    # 1. School plan on mobile
    register_school_if_needed(page)
    page.goto(SITE + '#/plan', wait_until='networkidle')
    page.wait_for_timeout(2500)
    ensure_english(page)
    page.wait_for_timeout(1500)
    scratch_school = pathlib.Path('.scratch_m_school.png')
    page.screenshot(path=str(scratch_school))
    
    # 2. Check my air on mobile
    page.goto(SITE + '#/check', wait_until='networkidle')
    page.wait_for_timeout(2500)
    ensure_english(page)
    page.wait_for_timeout(1500)
    scratch_check = pathlib.Path('.scratch_m_check.png')
    page.screenshot(path=str(scratch_check))
    context.close()

    # Now composite into the dual-iPhone template
    orig = Image.open('docs/screenshots/mobile.png').convert('RGBA')
    W, H = orig.size  # (1370, 1500)
    
    # Screen boxes:
    # Left: x in [46, 655], y in [35, 1447] -> 609 x 1412
    # Right: x in [715, 1324], y in [35, 1447] -> 609 x 1412
    SW, SH = 609, 1412
    
    school_img = Image.open(scratch_school).convert('RGBA').resize((SW, SH), Image.Resampling.LANCZOS)
    check_img = Image.open(scratch_check).convert('RGBA').resize((SW, SH), Image.Resampling.LANCZOS)
    
    # Rounded corner mask for screen interior (radius 44)
    screen_mask = Image.new('L', (SW, SH), 0)
    sdraw = ImageDraw.Draw(screen_mask)
    sdraw.rounded_rectangle([0, 0, SW - 1, SH - 1], radius=44, fill=255)
    
    # Base transparent canvas
    composite = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    composite.paste(school_img, (46, 35), screen_mask)
    composite.paste(check_img, (715, 35), screen_mask)
    
    # Frame mask: everything outside the screen rectangle is kept from original
    frame_mask = Image.new('L', (W, H), 255)
    fdraw = ImageDraw.Draw(frame_mask)
    fdraw.rounded_rectangle([46, 35, 654, 1446], radius=44, fill=0)
    fdraw.rounded_rectangle([715, 35, 1323, 1446], radius=44, fill=0)
    
    # Paste phone frames (bezels, shadows, outer buttons)
    composite.paste(orig, (0, 0), frame_mask)
    
    # Dynamic Island overlay (black pill at top center of each screen)
    di_mask = Image.new('L', (W, H), 0)
    di_draw = ImageDraw.Draw(di_mask)
    # Left phone DI
    di_draw.rounded_rectangle([46 + 235, 35 + 13, 46 + 375, 35 + 43], radius=15, fill=255)
    # Right phone DI
    di_draw.rounded_rectangle([715 + 235, 35 + 13, 715 + 375, 35 + 43], radius=15, fill=255)
    composite.paste(orig, (0, 0), di_mask)
    
    # iOS Home indicator bar at bottom center of each screen (translucent bar)
    cdraw = ImageDraw.Draw(composite)
    # Left phone home bar
    cdraw.rounded_rectangle([46 + 225, 35 + 1395, 46 + 385, 35 + 1400], radius=3, fill=(255, 255, 255, 120))
    # Right phone home bar
    cdraw.rounded_rectangle([715 + 225, 35 + 1395, 715 + 385, 35 + 1400], radius=3, fill=(255, 255, 255, 120))
    
    out_path = DOCS_SCREENSHOTS / 'mobile.png'
    composite.save(out_path, format='PNG')
    print(f" -> Saved {out_path} ({out_path.stat().st_size} bytes)")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, channel='chrome')
        capture_home(browser)
        capture_check(browser)
        capture_school(browser)
        capture_notice(browser)
        capture_air_lens(browser)
        capture_record(browser)
        capture_mobile(browser)
        browser.close()
    print("\nAll 7 live screenshots successfully captured and updated!")

if __name__ == '__main__':
    main()
