"""Quick probe of new vehicle OSINT sources using Playwright."""
import sys
import re
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

def probe(url, label, steps):
    """Visit URL, run steps, return findings."""
    print(f"\n{'='*60}")
    print(f"PROBING: {label} ({url})")
    print('='*60)
    browser = None
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, executable_path=CHROME_PATH)
            page = browser.new_page()
            page.goto(url, wait_until="load", timeout=20000)
            page.wait_for_timeout(3000)
            results = steps(page)
            browser.close()
        return results
    except Exception as e:
        print(f"  ERROR: {e}")
        if browser:
            browser.close()
        return {"error": str(e)}

def check_totalcarcheck(page):
    """totalcarcheck.co.uk — free stolen check form"""
    print("  Page title:", page.title())
    # Look for reg input
    inp = page.locator('input[type=text], input[name*="reg"], input[id*="reg"]').all()
    print(f"  Inputs found: {len(inp)}")
    for i in inp:
        print(f"    - {i.get_attribute('name')} | {i.get_attribute('id')} | {i.get_attribute('placeholder')}")
    body = page.text_content("body") or ""
    # Check for form elements
    forms = page.locator("form").all()
    print(f"  Forms: {len(forms)}")
    return {"inputs": len(inp), "forms": len(forms), "body_snippet": body[:500]}

def check_carcheckfree(page):
    """carcheckfree.co.uk — vehicle data API signup page"""
    print("  Page title:", page.title())
    body = page.text_content("body") or ""
    print(f"  Body snippet: {body[:300]}")
    # Look for API docs or signup
    links = page.locator("a[href*='api']").all()
    print(f"  API links: {len(links)}")
    return {"links": len(links)}

def check_carapi(page):
    """carapi.app — free vehicle spec API"""
    print("  Page title:", page.title())
    body = page.text_content("body") or ""
    print(f"  Body snippet: {body[:500]}")
    return {"body": body[:1000]}

def check_isitnicked_terms(page):
    """isitnicked.com terms page"""
    print("  Page title:", page.title())
    body = page.text_content("body") or ""
    # Check what data sources they access
    if re.search(r'PNC|police national computer', body, re.I):
        print("  CONFIRMED: Uses Police National Computer (PNC)")
    if re.search(r'free|FREE', body):
        print("  Mentions free service")
    return {"body": body[:1000]}

if __name__ == "__main__":
    # Test totalcarcheck stolen check form
    r = probe("https://totalcarcheck.co.uk/StolenCarCheck", "TotalCarCheck", check_totalcarcheck)
    print("  RESULT:", r)

    # Test carcheckfree API page
    r = probe("https://www.carcheckfree.co.uk/vehicle-data-api", "CarCheckFree", check_carcheckfree)
    print("  RESULT:", r)

    # Test carapi
    r = probe("https://carapi.app", "CarAPI", check_carapi)
    print("  RESULT:", r)

    # Test isitnicked terms
    r = probe("https://isitnicked.com/Terms", "IsItNicked Terms", check_isitnicked_terms)
    print("  RESULT:", r)
