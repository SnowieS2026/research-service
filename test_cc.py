"""Quick test: extract model and mot entries from car-checking.com"""
from playwright.sync_api import sync_playwright
import re

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=CHROME)
    ctx = browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        extra_http_headers={"Accept-Language": "en-GB,en;q=0.9"}
    )
    page = ctx.new_page()
    page.goto("https://www.car-checking.com/", wait_until="domcontentloaded", timeout=20000)
    page.wait_for_timeout(3000)
    page.locator("#subForm1").fill("AJ05RCF")
    page.wait_for_timeout(500)
    page.locator("button[type='submit']").first.click()
    page.wait_for_timeout(8000)
    body = page.text_content("body") or ""
    browser.close()

# Test model extraction
labels = ["Make", "Model", "Colour", "Year of manufacture", "Gearbox", "Engine capacity", "Fuel type", "MOT expiry"]
for label in labels:
    m = re.search(rf'{re.escape(label)}[\s:]+', body, re.I)
    if m:
        start = m.end()
        next_label = "MOT expiry" if label == "Fuel type" else None
        if next_label:
            nm = re.search(rf'{re.escape(next_label)}[\s:]', body[start:], re.I)
            end = start + nm.start() if nm else len(body)
        else:
            end = start + 100
        val = body[start:end].strip()[:80]
        print(f"{label}: '{val}'")

print("\n=== MOT entries ===")
blocks = re.split(r'(?=MOT #\d)', body)
for block in blocks[:3]:
    block = block.strip()
    if not block.startswith('MOT #'):
        continue
    print(f"\nBlock: {block[:300]}")
    num = re.search(r'^MOT #(\d+)', block)
    date_m = re.search(r'(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', re.search(r'Result:[^\n]{0,200}', block).group(0) if re.search(r'Result:', block) else '')
    mil = re.search(r'(\d{5,6})\s*miles?', block)
    res = "Pass" if re.search(r'\bPass\b', block) else "Fail"
    print(f"  num={num.group(1) if num else '?'} date={date_m.group(1) if date_m else '?'} miles={mil.group(1) if mil else '?'} result={res}")
