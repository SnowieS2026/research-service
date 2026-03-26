"""Find where dates and mileage live in each MOT block."""
import re
from playwright.sync_api import sync_playwright

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
    page.wait_for_timeout(500)
    page.locator("button[type='submit']").first.click()
    page.wait_for_timeout(8000)
    body = page.text_content("body") or ""
    browser.close()

# Split by MOT # markers
blocks = re.split(r'(?=MOT #\d)', body)
for block in blocks:
    block_stripped = block.strip()
    if not block_stripped.startswith('MOT #'):
        continue
    # Show first 400 chars of each block to see the structure
    print(f"\n=== {block_stripped[:60]} ===")
    print(repr(block_stripped[:400]))
