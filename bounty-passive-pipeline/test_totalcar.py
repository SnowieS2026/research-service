"""Test TotalCarCheck stolen car check form submission."""
import sys
import re
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

PLATE = "AJ05RCF"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=CHROME_PATH)
    page = browser.new_page()
    print(f"Loading totalcarcheck.co.uk...")
    page.goto("https://totalcarcheck.co.uk/StolenCarCheck", wait_until="load", timeout=20000)
    page.wait_for_timeout(2000)
    print(f"Page title: {page.title()}")

    # Find the reg input
    inp = page.locator('input[name="regno"]')
    if inp.count() > 0:
        print(f"Found reg input, filling with {PLATE}...")
        inp.fill(PLATE)
        page.wait_for_timeout(500)
        # Submit
        inp.press("Enter")
        page.wait_for_timeout(5000)
        body = page.text_content("body") or ""
        print(f"Body after submit ({len(body)} chars):")
        print(body[:2000])
    else:
        print("Reg input not found!")
        print(page.content()[:1000])

    browser.close()
