"""Test exact model/year extraction from car-checking.com"""
from playwright.sync_api import sync_playwright
import re

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=CHROME)
    ctx = browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        extra_http_headers={"Accept-Language": "en-GB,en;q=0.9"}
    )
    page = ctx.new_page()
    page.goto("https://www.car-checking.com/", wait_until="domcontentloaded", timeout=20000)
    page.wait_for_timeout(3000)
    page.locator("#subForm1").fill("AJ05RCF")
    page.locator("button[type='submit']").first.click()
    page.wait_for_timeout(8000)
    body = page.text_content("body") or ""

    # Find the FORD+Model lines
    idx = body.find("FORD")
    if idx >= 0:
        print("FORD snippet (200 chars):")
        print(repr(body[idx:idx+200]))
        print()

    # Test model regex
    m = re.search(r'Model\s+([A-Za-z0-9 ]{2,40})(?=\s+Colour|\s+Year|\s+Fuel|\s+Engine|\s+Top|\s+0 to|$)', body)
    print("Model (boundary):", m.group(1).strip() if m else "NOT FOUND")

    m2 = re.search(r'Model\s+([^\n]+?)\s+Colour', body)
    print("Model (up to Colour):", m2.group(1).strip() if m2 else "NOT FOUND")

    # Year
    y = re.search(r'Year of manufacture\s+(\d{4})', body)
    print("Year:", y.group(1) if y else "NOT FOUND")

    browser.close()
