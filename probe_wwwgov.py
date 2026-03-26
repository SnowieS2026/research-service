"""Probe gov.uk MOT check page - find the actual form elements."""
from playwright.sync_api import sync_playwright

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=CHROME)
    page = browser.new_page()
    page.set_extra_http_headers({
        "Accept-Language": "en-GB,en;q=0.9",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    })

    page.goto("https://www.gov.uk/check-mot-history", wait_until="load", timeout=20000)
    page.wait_for_timeout(3000)
    print(f"Title: {page.title()}")

    # Find ALL inputs on the page
    inputs = page.locator("input").all()
    print(f"Inputs found: {len(inputs)}")
    for inp in inputs:
        try:
            name = inp.get_attribute("name") or ""
            id = inp.get_attribute("id") or ""
            type_ = inp.get_attribute("type") or ""
            placeholder = inp.get_attribute("placeholder") or ""
            print(f"  name={name!r} id={id!r} type={type_!r} placeholder={placeholder!r}")
        except:
            pass

    # Check for form elements
    forms = page.locator("form").all()
    print(f"Forms: {len(forms)}")
    for f in forms:
        action = f.get_attribute("action") or ""
        print(f"  action={action!r}")

    # Get page HTML snippet around where input would be
    html = page.content()
    import re
    # Find the vrm input area
    vrm_area = re.search(r'.{200}vrm.{200}', html, re.I | re.DOTALL)
    if vrm_area:
        print(f"\nVrm context: {vrm_area.group()[:400]}")

    browser.close()
