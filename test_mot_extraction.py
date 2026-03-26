"""Proper car-checking.com extraction — handles the actual text format."""
import re, sys
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

# ── SPEC EXTRACTION ──
# Labels are "Make:", "Model:", etc. followed by their value until the next label
spec_labels = [
    ("Make", "make"),
    ("Model", "model"),
    ("Colour", "colour"),
    ("Year of manufacture", "year"),
    ("Top speed", "top_speed"),
    ("0 to 60 MPH", "zero_to_60"),
    ("Gearbox", "gearbox"),
    ("Engine & fuel consumption", "engine_note"),
    ("Fuel type", "fuel_type"),
    ("Consumption city", "mpg_city"),
    ("Consumption extra urban", "mpg_extra"),
    ("Consumption combined", "mpg_combined"),
    ("CO2 emission", "co2"),
    ("Power", "power"),
    ("Torque", "torque"),
    ("Engine capacity", "engine_cc"),
    ("Cylinders", "cylinders"),
]

found = {}
for label, key in spec_labels:
    m = re.search(rf'{re.escape(label)}[\s:]+([^\n]{2,120})', body, re.I)
    if m:
        val = m.group(1).strip().replace('\n', ' ').replace('  ', ' ')[:100]
        found[key] = val
        print(f"{key}: '{val}'")

# ── MOT SUMMARY ──
mot_expiry_m = re.search(r'MOT expiry date[\s\n]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', body, re.I)
mot_pass_rate_m = re.search(r'MOT pass rate[\s\n]+(\d+)\s*%', body, re.I)
mot_passed_m = re.search(r'MOT passed[\s\n]+(\d+)', body, re.I)
mot_failed_m = re.search(r'Failed MOT tests[\s\n]+(\d+)', body, re.I)

print(f"\nMOT expiry: {mot_expiry_m.group(1) if mot_expiry_m else '?'}")
print(f"MOT pass rate: {mot_pass_rate_m.group(1) if mot_pass_rate_m else '?'}%")
print(f"MOT passed: {mot_passed_m.group(1) if mot_passed_m else '?'}")
print(f"MOT failed: {mot_failed_m.group(1) if mot_failed_m else '?'}")

# ── MOT HISTORY: count + extract per-entry result + advisories ──
# Each "MOT #N" block contains: test number, result (Pass/Fail), advisories
# Dates and mileage are NOT present in individual MOT blocks on this site
mot_entries = []
blocks = re.split(r'(?=MOT #\d)', body)
for block in blocks:
    block = block.strip()
    if not block.startswith('MOT #'):
        continue
    entry = {}
    num_m = re.search(r'^MOT #(\d+)', block)
    entry["test_number"] = num_m.group(1) if num_m else ""
    entry["result"] = "Pass" if re.search(r'\bPass\b', block) and not re.search(r'\bFail\b', block) else "Fail" if re.search(r'\bFail\b', block) else "Unknown"
    # Extract failure items
    failures = []
    for fm in re.finditer(r'Failure\s+([^\n]{10,200})', block, re.I):
        failures.append(fm.group(1).strip()[:150])
    entry["failures"] = failures
    # Extract advisory items
    advs = []
    for am in re.finditer(r'Advice\s+([^\n]{5,150})', block, re.I):
        txt = am.group(1).strip()
        if txt:
            advs.append(txt[:150])
    entry["advisories"] = advs
    # Dates and mileage NOT available per-entry on car-checking.com
    entry["date"] = "N/A"
    entry["mileage"] = "N/A"
    mot_entries.append(entry)

print(f"\nMOT entries found: {len(mot_entries)}")
for e in mot_entries:
    res = "PASS" if e['result'] == 'Pass' else "FAIL"
    print(f"  MOT #{e['test_number']}: {res} | failures={len(e['failures'])} | advisories={len(e['advisories'])}")

# ── Current mileage (from overall page) ──
current_mileage = re.search(r'(\d{5,6})\s*miles', body)
print(f"\nCurrent mileage (from page): {current_mileage.group(1) if current_mileage else '?'}")

# ── Advisory deduplication ──
all_advs = []
seen = set()
for e in mot_entries:
    for a in e['advisories']:
        key = a.lower().strip()[:60]
        if key and key not in seen:
            seen.add(key)
            all_advs.append(a)
print(f"\nDeduplicated advisories: {len(all_advs)}")
for a in all_advs[:10]:
    print(f"  - {a[:100]}")
