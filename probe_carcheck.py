"""Find the actual form input on car-checking.com."""
from playwright.sync_api import sync_playwright

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=CHROME)
    page = browser.new_page()
    page.goto("https://www.car-checking.com/", wait_until="load", timeout=20000)
    page.wait_for_timeout(2000)
    print(f"Title: {page.title()}")

    # Find ALL visible inputs
    inputs = page.locator("input").all()
    print(f"All inputs: {len(inputs)}")
    for inp in inputs:
        try:
            visible = inp.is_visible()
            name = inp.get_attribute("name") or ""
            id = inp.get_attribute("id") or ""
            type_ = inp.get_attribute("type") or ""
            placeholder = inp.get_attribute("placeholder") or ""
            cls = inp.get_attribute("class") or ""
            print(f"  visible={visible} name={name!r} id={id!r} type={type_!r} placeholder={placeholder!r} class={cls!r}")
        except Exception as e:
            print(f"  Error: {e}")

    # Try filling by placeholder or specific text
    try:
        inp2 = page.locator('input[placeholder*="reg" i], input[placeholder*="vehicle" i], input[placeholder*="VRM" i]').first
        print(f"\nTrying placeholder input: visible={inp2.is_visible()}")
        if inp2.is_visible():
            inp2.fill("AJ05RCF")
            page.wait_for_timeout(500)
            inp2.press("Enter")
            page.wait_for_timeout(8000)
            print(f"URL after submit: {page.url}")
            body = page.text_content("body") or ""
            print(f"Body (first 3000 chars):\n{body[:3000]}")
    except Exception as e:
        print(f"Fill error: {e}")

    browser.close()
