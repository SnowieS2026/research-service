"""Improved vehicle-osint with proper car-checking.com extraction + cross-reference enrichment."""
import sys, os, re, time, argparse, tempfile
import io
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
from datetime import datetime
from pathlib import Path
import requests
import cloudscraper
import threading

# ─── Playwright ───────────────────────────────────────────────────────────────
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

def delay(sec):
    time.sleep(sec)

def http_get(url, timeout=10):
    s = cloudscraper.create_scraper()
    s.headers.update({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
    return s.get(url, timeout=timeout).text

# ─── Database ────────────────────────────────────────────────────────────────
ORIGINAL_MSRP = {
    ("Ford", "Mondeo"): (18000, 25000),
    ("Ford", "Focus"): (14000, 20000),
    ("Ford", "Fiesta"): (8000, 14000),
    ("Vauxhall", "Corsa"): (8000, 14000),
    ("Vauxhall", "Astra"): (12000, 18000),
    ("VW", "Golf"): (15000, 22000),
    ("VW", "Polo"): (10000, 16000),
    ("BMW", "3 Series"): (22000, 35000),
    ("BMW", "M2"): (55000, 70000),
    ("Audi", "A3"): (20000, 30000),
    ("Toyota", "Yaris"): (11000, 17000),
    ("Toyota", "Corolla"): (13000, 20000),
    ("Honda", "Civic"): (12000, 18000),
    ("Nissan", "Qashqai"): (15000, 22000),
}

INSURANCE_GROUPS = {
    ("Ford", "Mondeo"): (25, 35, "High-performance family car"),
    ("Ford", "Focus"): (18, 26, "Popular hatchback"),
    ("Ford", "Fiesta"): (10, 18, "Small hatchback, lower insurance"),
    ("Vauxhall", "Corsa"): (8, 16, "Budget-friendly hatchback"),
    ("Vauxhall", "Astra"): (14, 22, "Family hatchback"),
    ("VW", "Golf"): (18, 28, "Premium hatchback"),
    ("VW", "Polo"): (12, 20, "Supermini"),
    ("BMW", "3 Series"): (28, 40, "Executive saloon"),
    ("Audi", "A3"): (22, 32, "Premium compact"),
    ("Toyota", "Yaris"): (8, 14, "Reliable small car"),
    ("Toyota", "Corolla"): (12, 20, "Family hatchback"),
    ("Honda", "Civic"): (14, 22, "Reliable hatchback"),
    ("Renault", "Clio"): (8, 14, "Budget hatchback"),
    ("Nissan", "Qashqai"): (14, 22, "Popular crossover SUV"),
}

KNOWN_ISSUES = {
    ("Ford", "Mondeo"): [
        {"issue": "DPF problems on diesel models", "severity": "medium", "cost_min": 300, "cost_max": 800},
        {"issue": "Dual-mass flywheel wear", "severity": "medium", "cost_min": 250, "cost_max": 600},
        {"issue": "PCV valve failure", "severity": "low", "cost_min": 80, "cost_max": 200},
    ],
    ("Ford", "Focus"): [
        {"issue": "Tyre pressure sensor failures", "severity": "low", "cost_min": 40, "cost_max": 120},
        {"issue": "Ronin engine timing chain tensioner", "severity": "high", "cost_min": 400, "cost_max": 1200},
    ],
    ("Ford", "Fiesta"): [
        {"issue": "Water pump failure", "severity": "medium", "cost_min": 200, "cost_max": 500},
        {"issue": "DPF problems on diesel", "severity": "medium", "cost_min": 300, "cost_max": 800},
    ],
    ("Vauxhall", "Corsa"): [
        {"issue": "High oil consumption", "severity": "low", "cost_min": 50, "cost_max": 200},
    ],
    ("Vauxhall", "Astra"): [
        {"issue": "Carbon buildup on intake", "severity": "low", "cost_min": 100, "cost_max": 300},
    ],
    ("VW", "Golf"): [
        {"issue": "Turbo wear issues", "severity": "medium", "cost_min": 400, "cost_max": 1200},
        {"issue": "DSG gearbox mechatronics", "severity": "high", "cost_min": 600, "cost_max": 1800},
    ],
}

# ─── Cross-reference enrichment ──────────────────────────────────────────────
ENGINE_CC_DB = {
    ("ford", "mondeo"): (1997, 2199),
    ("ford", "focus"): (1560, 2265),
    ("ford", "fiesta"): (1242, 1598),
    ("vauxhall", "corsa"): (1229, 1398),
    ("vauxhall", "astra"): (1364, 1598),
    ("vw", "golf"): (1197, 1984),
    ("vw", "polo"): (999, 1395),
    ("vw", "passat"): (1390, 1984),
    ("bmw", "3 series"): (1995, 2996),
    ("audi", "a3"): (1395, 1984),
    ("audi", "a4"): (1968, 2995),
    ("toyota", "yaris"): (998, 1496),
    ("toyota", "corolla"): (1197, 1798),
    ("honda", "civic"): (1339, 1798),
    ("renault", "clio"): (898, 1498),
    ("nissan", "qashqai"): (1332, 1749),
}

GEARBOX_DB = {
    ("ford", "mondeo"): "Manual / Automatic",
    ("ford", "focus"): "Manual",
    ("ford", "fiesta"): "Manual",
    ("vauxhall", "corsa"): "Manual",
    ("vauxhall", "astra"): "Manual / Automatic",
    ("vw", "golf"): "Manual / Automatic",
    ("vw", "polo"): "Manual / Automatic",
    ("vw", "passat"): "Automatic",
    ("bmw", "3 series"): "Automatic",
    ("audi", "a3"): "Manual / Automatic",
}

BODY_TYPE_DB = {
    ("ford", "mondeo"): "Saloon / Estate",
    ("ford", "focus"): "Hatchback / Estate",
    ("ford", "fiesta"): "Hatchback",
    ("vauxhall", "corsa"): "Hatchback",
    ("vauxhall", "astra"): "Hatchback / Estate",
    ("vw", "golf"): "Hatchback",
    ("vw", "polo"): "Hatchback",
    ("vw", "passat"): "Saloon / Estate",
    ("bmw", "3 series"): "Saloon / Estate",
    ("audi", "a3"): "Hatchback / Saloon",
    ("toyota", "yaris"): "Hatchback",
    ("toyota", "corolla"): "Hatchback / Saloon / Estate",
    ("honda", "civic"): "Hatchback / Saloon",
    ("renault", "clio"): "Hatchback",
    ("nissan", "qashqai"): "SUV / Crossover",
}

FUEL_TYPE_DB = {
    ("ford", "mondeo", "diesel"): "Diesel",
    ("ford", "mondeo", "petrol"): "Petrol",
    ("ford", "focus", "diesel"): "Diesel",
    ("ford", "focus", "petrol"): "Petrol",
    ("ford", "fiesta", "petrol"): "Petrol",
    ("vauxhall", "corsa", "diesel"): "Diesel",
    ("vauxhall", "corsa", "petrol"): "Petrol",
    ("vauxhall", "astra", "diesel"): "Diesel",
    ("vw", "golf", "diesel"): "Diesel",
    ("vw", "golf", "petrol"): "Petrol / Mild Hybrid",
    ("vw", "polo", "petrol"): "Petrol",
    ("vw", "passat", "diesel"): "Diesel",
    ("bmw", "3 series", "diesel"): "Diesel",
    ("audi", "a3", "diesel"): "Diesel",
    ("toyota", "yaris", "hybrid"): "Hybrid / Petrol",
    ("honda", "civic", "hybrid"): "Hybrid / Petrol",
    ("renault", "clio", "petrol"): "Petrol / Hybrid",
    ("nissan", "qashqai", "diesel"): "Diesel",
    ("nissan", "qashqai", "petrol"): "Petrol / Hybrid",
}


def cross_reference(make, model, year, engine_cc, fuel_type):
    """Fill gaps using local databases."""
    result = {}
    make_l = make.lower() if make else ""
    model_l = model.lower() if model else ""

    # Engine CC
    if engine_cc == 0:
        for (dm, dmo), (cmin, cmax) in ENGINE_CC_DB.items():
            if dm in make_l and (not model_l or dmo in model_l):
                result["engine_cc"] = (cmin + cmax) // 2
                result["engine_cc_confidence"] = 75
                break

    # Fuel type
    if not fuel_type or fuel_type.lower() in ("unknown", ""):
        for (dm, dmo, df), dft in FUEL_TYPE_DB.items():
            if dm in make_l and (not model_l or dmo in model_l):
                result["fuel_type"] = dft
                result["fuel_type_confidence"] = 70
                break
        if "fuel_type" not in result:
            result["fuel_type"] = "Petrol" if (year and year >= 2015) else "Diesel / Petrol (verify)"
            result["fuel_type_confidence"] = 40

    # Gearbox
    for (dm, dmo), dbg in GEARBOX_DB.items():
        if dm in make_l and (not model_l or dmo in model_l):
            result["gearbox"] = dbg
            result["gearbox_confidence"] = 80
            break

    # Body type
    for (dm, dmo), dbbt in BODY_TYPE_DB.items():
        if dm in make_l and (not model_l or dmo in model_l):
            result["body_type"] = dbbt
            result["body_type_confidence"] = 80
            break

    return result


# ─── Collectors ──────────────────────────────────────────────────────────────

def collect_car_check(plate, pw):
    """Primary collector — car-checking.com. Returns FULL MOT history + all specs."""
    result = {"findings": [], "errors": [], "raw_data": {}, "source": "car-checking.com"}
    browser = None
    try:
        browser = pw.chromium.launch(
            headless=True,
            executable_path=CHROME_PATH,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--disable-dev-shm-usage",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-web-security",
                "--disable-features=IsolateOrigins,site-per-process",
            ]
        )
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            extra_http_headers={"Accept-Language": "en-GB,en;q=0.9"}
        )
        # Patch navigator.webdriver before any pages load
        ctx.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
            window.navigator.chrome = { runtime: {} };
        """)
        page = ctx.new_page()
        page.on("dialog", lambda d: d.accept())
        page.goto("https://www.car-checking.com/", wait_until="domcontentloaded", timeout=20000)
        page.wait_for_timeout(4000)
        page.locator("#subForm1").fill(plate)
        page.wait_for_timeout(500)
        page.locator("button[type='submit']").first.click()
        page.wait_for_timeout(8000)
        body = page.text_content("body") or ""
        if len(body.strip()) < 50:
            page.wait_for_timeout(5000)
            body = page.text_content("body") or ""
        result["raw_data"]["raw_text"] = body[:20000]

        if "your report is ready" not in body.lower():
            result["errors"].append("car-checking.com: report not ready")
            return result

        # ── Extract spec fields ──
        def extract(pattern, field, default=None):
            m = re.search(pattern, body, re.I)
            val = m.group(1).strip() if m else default
            if val:
                result["raw_data"][field] = val
                result["findings"].append({"source": "car-checking.com", "field": field, "value": val, "confidence": 95})
            return val or ""

        extract(r'Make\s+([A-Za-z ]+?)(?=\s+Model|\s+Colour|\s+Year|$)', "make")
        m = re.search(r'Model\s+([^\n]+?)\s+Colour', body)
        result["raw_data"]["model"] = m.group(1).strip() if m else ""
        # Fix: non-greedy capture stops at "Year of manufacture" (was capturing entire rest of page)
        extract(r'Colour\s+([A-Za-z]+?)(?=\s+Year|\s*$)', "colour")
        extract(r'Year of manufacture\s+(\d{4})', "year")
        # Fix: non-greedy capture stops at "Engine" (was capturing engine/power text)
        extract(r'Gearbox\s+([A-Za-z0-9/ ]+?)(?=\s+Engine|\s*$)', "gearbox")
        extract(r'Engine capacity\s+(\d+)\s*cc', "engine_capacity")
        # Fix: non-greedy capture stops at "Consumption" (was capturing MPG values)
        extract(r'Fuel type\s+([A-Za-z/]+?)(?=\s+Consumption|\s*$)', "fuel_type")
        extract(r'Power\s+([\d.]+)\s*BHP', "power_bhp")
        extract(r'CO2 emission\s+(\d+)\s*g', "co2_gkm")
        extract(r'Consumption combined\s+([\d.]+)\s*mpg', "combined_mpg")

        # VIN
        vin_m = re.search(r'\b([A-HJ-NPR-Z0-9]{17})\b', body)
        if vin_m:
            result["raw_data"]["vin"] = vin_m.group(1).upper()
            result["findings"].append({"source": "car-checking.com", "field": "vin", "value": vin_m.group(1).upper(), "confidence": 95})

        # MOT summary
        extract(r'MOT expiry date\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', "mot_expiry")
        extract(r'MOT pass rate\s+(\d+)\s*%', "mot_pass_rate")
        extract(r'MOT passed\s+(\d+)', "mot_passed")
        extract(r'Failed MOT tests\s+(\d+)', "mot_failed")
        extract(r'Total advice items\s+(\d+)', "total_advisories")
        extract(r'Total items failed\s+(\d+)', "total_failed_items")

        # Current mileage from body text
        mileage_m = re.search(r'(\d{5,6})\s*miles', body)
        if mileage_m:
            result["raw_data"]["current_mileage"] = int(mileage_m.group(1))
            result["findings"].append({"source": "car-checking.com", "field": "current_mileage", "value": f"{int(mileage_m.group(1)):,} mi", "confidence": 90})

        # ── FULL MOT HISTORY — parse each MOT test entry ──
        mot_entries = []
        # Split body by "MOT #N" markers
        mot_blocks = re.split(r'(?=MOT #\d)', body)
        for block in mot_blocks:
            block = block.strip()
            if not block.startswith('MOT #'):
                continue
            entry = {}
            # Test number
            num_m = re.search(r'^MOT #(\d+)', block)
            entry["test_number"] = num_m.group(1) if num_m else ""
            # Extract ONLY date fields that are WITHIN this block (not expiry date)
            # Look for date near "Result:" label
            result_area = re.search(r'Result:[^\n]{0,200}', block, re.I)
            result_text = result_area.group(0) if result_area else ""
            date_m = re.search(r'(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', result_text)
            entry["date"] = date_m.group(1) if date_m else ""
            # Result
            entry["result"] = "Pass" if re.search(r'\bPass\b', block) else "Fail"
            # Mileage — look for 5-digit number near "miles" anywhere in block
            mil_m = re.search(r'(\d{5,6})\s*miles?', block)
            entry["mileage"] = mil_m.group(1) if mil_m else ""
            # Test centre
            tc_m = re.search(r'(?:Test centre|Centre|Location)[\s\:]+([^\n<]{3,50})', block, re.I)
            entry["test_centre"] = tc_m.group(1).strip() if tc_m else ""
            # Advisories — capture each on its own line
            advs = []
            for am in re.finditer(r'Advice\s+([\w\s\(\)\[\]\.,\-]{10,150})', block, re.I):
                txt = am.group(1).strip()
                if txt and len(txt) > 5:
                    advs.append(txt[:150])
            entry["advisories"] = advs
            if entry["test_number"] or entry["date"] or entry.get("result"):
                mot_entries.append(entry)

        result["raw_data"]["mot_history"] = mot_entries
        result["raw_data"]["mot_history_count"] = len(mot_entries)
        if mot_entries:
            result["findings"].append({"source": "car-checking.com", "field": "mot_history_count", "value": str(len(mot_entries)), "confidence": 95})

        # Build mileage timeline (reverse chronological, newest first)
        mileage_timeline = []
        for e in mot_entries:
            if e.get("mileage") and e["mileage"].isdigit():
                mileage_timeline.append(int(e["mileage"]))
        # If no per-test mileages found, try to find a general mileage
        if not mileage_timeline:
            gen_miles = re.findall(r'(\d{5,6})\s*miles?', body)
            mileage_timeline = sorted([int(m) for m in set(gen_miles)], reverse=True)
        if not mileage_timeline and result["raw_data"].get("current_mileage"):
            mileage_timeline = [result["raw_data"]["current_mileage"]]
        result["raw_data"]["mileage_timeline"] = sorted(set(mileage_timeline), reverse=True)

        # All advisory notes — deduplicated
        all_advisories = []
        seen = set()
        for e in mot_entries:
            for a in e.get("advisories", []):
                # Normalize: lowercase, strip, remove trailing punctuation
                key = re.sub(r'\s+', ' ', a.lower().strip())[:80]
                if key and key not in seen:
                    seen.add(key)
                    all_advisories.append(a[:150])
        result["raw_data"]["advisory_notes"] = all_advisories

    except Exception as e:
        result["errors"].append(f"car-checking.com: {e}")
    finally:
        if browser:
            browser.close()
    delay(0.5)
    return result


def collect_dvla(plate, pw):
    """DVLA vehicle enquiry — colour, VIN, first registration, tax status.
    Uses cloudscraper first (no Cloudflare on gov.uk), falls back to Playwright."""
    result = {"findings": [], "errors": [], "raw_data": {}, "source": "gov.uk-DVLA"}

    # ── Try cloudscraper first (no Cloudflare, fast) ──────────────────────────
    try:
        scraper = cloudscraper.create_scraper()
        scraper.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-GB,en;q=0.9",
            "Referer": "https://vehicleenquiry.service.gov.uk/",
        })
        resp = scraper.get("https://vehicleenquiry.service.gov.uk/", timeout=20)
        body = resp.text

        # Extract hidden form fields
        hidden = {}
        for m in re.finditer(r'<input[^>]*type=["\']hidden["\'][^>]*name=["\']([^"\']+)["\'][^>]*value=["\']([^"\']*)["\']', body, re.I):
            hidden[m.group(1)] = m.group(2)
        for m in re.finditer(r'<input[^>]*value=["\']([^"\']*)["\'][^>]*type=["\']hidden["\'][^>]*name=["\']([^"\']+)["\']', body, re.I):
            hidden[m.group(2)] = m.group(1)

        # Submit form
        form_data = dict(hidden)
        form_data["wizard_vehicle_enquiry_capture_vrn[vrn]"] = plate
        resp2 = scraper.post(
            "https://vehicleenquiry.service.gov.uk/",
            data=form_data, timeout=20, allow_redirects=True,
            headers={"Referer": "https://vehicleenquiry.service.gov.uk/"}
        )
        body2 = resp2.text
        result["raw_data"]["raw_text"] = body2[:8000]

        # If redirected to result page, extract vehicle data
        if resp2.url and "session-timeout" not in resp2.url and "vehicle" in resp2.url.lower() or \
           any(k in body2 for k in ["Colour", "Tax status", "Make"]):
            pairs = [
                ("Colour", "colour"), ("Tax status", "tax_status"),
                ("Date of first registration", "first_reg"),
                ("First registered", "first_reg"),
                ("Vehicle make", "make_dvla"), ("Make", "make_dvla"),
                ("MOT expiry date", "mot_expiry_dvla"),
            ]
            for label, field in pairs:
                m = re.search(rf'{re.escape(label)}[\s:]+([^\n<]{2,80})', body2, re.I)
                if m:
                    result["raw_data"][field] = m.group(1).strip()
                    if field != "make_dvla":
                        result["findings"].append({"source": "gov.uk-DVLA", "field": field, "value": m.group(1).strip(), "confidence": 90})
        else:
            raise ValueError("cloudscraper got redirected to session-timeout")

    except Exception as cloudscraper_err:
        result["errors"].append(f"cloudscraper DVLA failed ({cloudscraper_err}), falling back to Playwright")
        # ── Fallback: Playwright with system Chrome + anti-detection ────────────
        browser = None
        try:
            browser = pw.chromium.launch(
                headless=True, executable_path=CHROME_PATH,
                args=["--disable-blink-features=AutomationControlled",
                      "--disable-dev-shm-usage", "--no-sandbox",
                      "--disable-setuid-sandbox", "--disable-web-security"]
            )
            ctx = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                extra_http_headers={"Accept-Language": "en-GB,en;q=0.9"}
            )
            ctx.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            page = ctx.new_page()
            page.goto("https://vehicleenquiry.service.gov.uk/", wait_until="networkidle", timeout=25000)
            try:
                page.locator("button", has_text=re.compile(r"Reject", re.I)).first.click()
                page.wait_for_load_state("networkidle", timeout=10000)
            except Exception:
                pass
            page.locator("#wizard_vehicle_enquiry_capture_vrn_vrn").fill(plate)
            page.get_by_role("button", name="Continue").click()
            page.wait_for_load_state("networkidle", timeout=20000)
            body = page.text_content("body") or ""
            result["raw_data"]["raw_text"] = body[:5000]

            pairs = {
                "Colour": "colour", "Vehicle colour": "colour",
                "Tax status": "tax_status", "Vehicle tax status": "tax_status",
                "First registered": "first_reg", "Date of first registration": "first_reg",
                "Make": "make_dvla", "Vehicle make": "make_dvla",
                "MOT expiry date": "mot_expiry_dvla",
                "Fuel type": "fuel_type_dvla",
            }
            for label, field in pairs.items():
                m = re.search(rf'{re.escape(label)}[\s:]+([^\n]{2,60})', body, re.I)
                if m:
                    val = m.group(1).strip()
                    result["raw_data"][field] = val
                    if field not in ("make_dvla",):
                        result["findings"].append({"source": "gov.uk-DVLA", "field": field, "value": val, "confidence": 90})
        except Exception as pw_err:
            result["errors"].append(f"Playwright DVLA also failed: {pw_err}")
        finally:
            if browser:
                browser.close()
    delay(0.5)
    return result


def collect_check_mot_history(plate):
    """check-mot-history.co.uk — full MOT history via cloudscraper (no Cloudflare on GET).
    Falls back to data.gov.uk direct API if blocked."""
    result = {"findings": [], "errors": [], "raw_data": {}, "source": "check-mot-history.co.uk"}
    try:
        scraper = cloudscraper.create_scraper()
        scraper.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-GB,en;q=0.9",
            "Referer": "https://www.check-mot-history.co.uk/",
        })

        resp = scraper.get(
            f"https://www.check-mot-history.co.uk/vehicle/{plate.upper().replace(' ', '')}",
            timeout=20
        )
        result["raw_data"]["status_code"] = resp.status_code
        result["raw_data"]["url"] = resp.url

        # cloudscraper returns the JS-challenged page; we need to wait for the302 redirect
        # Try waiting a bit for the challenge to complete
        if resp.status_code in (403, 503, 202):
            result["errors"].append(f"check-mot-history.co.uk: HTTP {resp.status_code} — Cloudflare challenge in progress")
            # Try data.gov.uk MOT API directly instead
            return collect_data_gov_uk_mot(plate)

        body = resp.text
        result["raw_data"]["raw_text"] = body[:20000]

        # Parse vehicle details
        # Format: "2006 VAUXHALL VECTRA Colour: Grey Fuel Type: Diesel First Registered: 14/06/2006"
        m = re.search(r'(\d{4})\s+(VAUXHALL|FORD|TOYOTA|BMW|AUDI|MERCEDES|VW|Volkswagen|HONDA|NISSAN|PEUGEOT|RENAULT|SKODA|SEAT|CITROEN|MAZDA|SUBARU|MITSUBISHI|KIA|HYUNDAI|LAND ROVER|JAGUAR|PORSCHE)\s+([^\s][^\n]*?)(?=Colour:|$)', body, re.I)
        if m:
            result["raw_data"]["year"] = m.group(1)
            result["raw_data"]["make"] = m.group(2).upper()
            result["raw_data"]["model"] = m.group(3).strip()[:60]
            result["findings"].append({"source": "check-mot-history.co.uk", "field": "year", "value": m.group(1), "confidence": 95})
            result["findings"].append({"source": "check-mot-history.co.uk", "field": "make", "value": m.group(2).upper(), "confidence": 95})

        pairs = [("Colour:", "colour"), ("Fuel Type:", "fuel_type"), ("First Registered:", "first_reg")]
        for label, field in pairs:
            m2 = re.search(rf'{re.escape(label)}\s*([^\n]+)', body, re.I)
            if m2:
                result["raw_data"][field] = m2.group(1).strip()
                result["findings"].append({"source": "check-mot-history.co.uk", "field": field, "value": m2.group(1).strip(), "confidence": 90})

        # Parse MOT history entries
        # Format: "Date Tested: DD/MM/YYYY Test Result: ✔ Passed MOT Expiry Date: DD/MM/YYYY Mileage: NNNNN Comments:"
        # Comments as list items
        mot_entries = []
        date_re = re.compile(r'Date Tested:\s*(\d{1,2}\/\d{1,2}\/\d{4})(.*?)(?=Date Tested:|$)', re.S)
        for entry_m in date_re.finditer(body):
            date_str = entry_m.group(1)
            block = entry_m.group(2)[:500]
            result_m = re.search(r'Test Result:\s*([✔✖]\s*(?:Pass|Failed))', block)
            expiry_m = re.search(r'MOT Expiry Date:\s*(\d{1,2}\/\d{1,2}\/\d{4})', block)
            mileage_m = re.search(r'Mileage:\s*(\d{1,6})', block)
            comments = []
            for c_m in re.finditer(r'[✔✖]?\s*(Advisory|Major|Dangerous|Fail|Prs)\s*[-–]\s*([^\n<]{3,200})', block):
                comments.append(c_m.group(2).strip())
            if result_m:
                mot_entries.append({
                    "date": date_str,
                    "result": "PASSED" if "Pass" in result_m.group(1) else "FAILED",
                    "expiry": expiry_m.group(1) if expiry_m else "",
                    "mileage": int(mileage_m.group(1)) if mileage_m else 0,
                    "comments": comments
                })
            if len(mot_entries) >= 30:
                break

        if mot_entries:
            result["raw_data"]["mot_history"] = mot_entries
            result["raw_data"]["mot_history_count"] = len(mot_entries)
            result["findings"].append({"source": "check-mot-history.co.uk", "field": "mot_history_count", "value": str(len(mot_entries)), "confidence": 95})
            latest = mot_entries[0]
            result["findings"].append({"source": "check-mot-history.co.uk", "field": "mot_result_latest", "value": latest.get("result", "Unknown"), "confidence": 95})
            result["findings"].append({"source": "check-mot-history.co.uk", "field": "current_mileage", "value": f"{latest.get('mileage', 0):,}", "confidence": 90})
        else:
            # Fallback to data.gov.uk if no MOT parsed
            raise ValueError("No MOT history found in page body")

    except Exception as e:
        result["errors"].append(f"check-mot-history.co.uk: {e}")
        # Fall back to data.gov.uk
        fallback = collect_data_gov_uk_mot(plate)
        result["findings"].extend(fallback["findings"])
        result["errors"].extend(fallback["errors"])
        result["raw_data"].update(fallback["raw_data"])

    delay(0.5)
    return result


def collect_data_gov_uk_mot(plate):
    """data.gov.uk MOT history API — free, no auth. Returns full MOT history.
    Endpoint: https://data.gov.uk/data/api/pre_release/mot/vehicle?q=REG&date=YYYY-MM"""
    result = {"findings": [], "errors": [], "raw_data": {}, "source": "data.gov.uk-MOT"}
    try:
        scraper = cloudscraper.create_scraper()
        scraper.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
        })
        # Try the data.gov.uk MOT API
        url = f"https://data.gov.uk/data/api/pre_release/mot/vehicle?q={plate.upper()}"
        resp = scraper.get(url, timeout=15)
        result["raw_data"]["status_code"] = resp.status_code
        result["raw_data"]["response"] = resp.text[:2000]
        if resp.status_code == 200 and resp.text.strip().startswith("["):
            import json
            data = json.loads(resp.text)
            if isinstance(data, list) and len(data) > 0:
                mot_entries = []
                for e in data[:30]:
                    if isinstance(e, dict):
                        mot_entries.append({
                            "date": e.get("date", ""),
                            "result": e.get("testResult", "UNKNOWN"),
                            "expiry": e.get("expiryDate", ""),
                            "mileage": int(e.get("odometerReading", 0)),
                            "comments": [e.get("rfrAndComments", "")[:200]]
                        })
                result["raw_data"]["mot_history"] = mot_entries
                result["findings"].append({"source": "data.gov.uk-MOT", "field": "mot_history_count", "value": str(len(mot_entries)), "confidence": 95})
    except Exception as e:
        result["errors"].append(f"data.gov.uk MOT: {e}")
    return result


# ─── Valuations ─────────────────────────────────────────────────────────────

def estimate_value(make, model, year, mileage, condition):
    base = {
        ("ford", "mondeo"): (700, 1200),
        ("ford", "focus"): (800, 2000),
        ("ford", "fiesta"): (400, 1200),
        ("ford", "kuga"): (1500, 4000),
        ("vauxhall", "corsa"): (400, 1200),
        ("vauxhall", "astra"): (500, 1500),
        ("vauxhall", "insignia"): (800, 2000),
        ("vw", "golf"): (1500, 4500),
        ("vw", "polo"): (800, 2500),
        ("vw", "passat"): (1200, 3500),
        ("vw", "tiguan"): (2000, 5000),
        ("bmw", "3 series"): (2000, 6000),
        ("bmw", "5 series"): (3000, 8000),
        ("bmw", "m2"): (45000, 60000),
        ("audi", "a3"): (1500, 4500),
        ("audi", "a4"): (1800, 5000),
        ("mercedes", "c class"): (2000, 6000),
        ("toyota", "yaris"): (800, 2500),
        ("toyota", "corolla"): (1000, 3000),
        ("toyota", "c-hr"): (1500, 4000),
        ("honda", "civic"): (800, 2500),
        ("honda", "cr-v"): (1500, 4000),
        ("renault", "clio"): (400, 1200),
        ("renault", "megane"): (500, 1500),
        ("nissan", "qashqai"): (1500, 4500),
        ("nissan", "juke"): (1000, 2500),
        ("hyundai", "tucson"): (1500, 4000),
        ("hyundai", "i30"): (1000, 3000),
        ("kia", "sportage"): (1500, 4000),
        ("kia", "niro"): (1200, 3000),
        ("ford", "transit"): (2000, 6000),
    }.get((make.lower().strip(), model.lower().strip()), (600, 2000))

    age = max(0, datetime.now().year - (year or 2005))
    # Depreciation: 10% per year for first 5 years, then 5% per year after (logarithmic curve)
    # Floor at 35% of base value for any age
    depr_rate = max(0.35, 1.0 - (min(age, 5) * 0.10) - (max(0, age - 5) * 0.05))
    val_min = int(base[0] * depr_rate)
    val_max = int(base[1] * depr_rate)

    if mileage and mileage > 100000:
        val_min = int(val_min * 0.85)
        val_max = int(val_max * 0.90)
    elif mileage and mileage > 150000:
        val_min = int(val_min * 0.70)
        val_max = int(val_max * 0.75)

    if condition == "poor":
        val_min = int(val_min * 0.75)
        val_max = int(val_max * 0.85)
    elif condition == "good":
        val_min = int(val_min * 1.10)
        val_max = int(val_max * 1.15)

    return {"min": max(200, val_min), "max": max(300, val_max)}


def generate_valuation(make, model, year, mileage, fuel_type, advisories, mot_failures, mot_total, tax_status, mot_expiry):
    has_critical = any(a.get("severity") in ("critical", "high") for a in advisories)
    has_high = any(a.get("severity") == "high" for a in advisories)
    condition = "poor" if has_critical else "fair" if has_high else "good"
    model_clean = re.sub(r'\b(auto|manual|gearbox|engine|\d+\s*gear|\d+ gears?)\b', '', model.lower().strip()).strip()
    value = estimate_value(make, model_clean, year, mileage, condition)
    age = datetime.now().year - (year or 2005)
    diesel = bool(re.search(r"diesel|dci|tdi|cdti", fuel_type or "", re.I))
    months = 3 if has_critical else (6 if has_high else (12 if len(advisories) >= 5 else (18 if diesel and age > 15 else 24)))

    total_adv_min = sum(a.get("cost_min", 0) for a in advisories)
    total_adv_max = sum(a.get("cost_max", 0) for a in advisories)
    repair_penalty_min = round(total_adv_min * 0.7)
    repair_penalty_max = round(total_adv_max * 0.7)
    val_adv_min = max(200, value["min"] - repair_penalty_max)
    val_adv_max = max(300, value["max"] - repair_penalty_min)

    make_l = make.lower().strip()
    model_l = re.sub(r'\b(auto|manual|gearbox|engine|\d+\s*gear|\d+ gears?)\b', '', model.lower().strip()).strip()
    msrp_key = next(((m, mo) for (m, mo) in ORIGINAL_MSRP if re.search(m.lower(), make_l) and re.search(mo.lower(), model_l)), None)
    msrp_min, msrp_max = ORIGINAL_MSRP.get(msrp_key, (10000, 20000)) if msrp_key else (10000, 20000)
    depr_pct = max(0, min(99, round((1 - value["max"] / msrp_max) * 100, 1))) if msrp_max > 0 else 0

    return {
        "current_value_min": value["min"], "current_value_max": value["max"],
        "value_with_advisories_min": val_adv_min, "value_with_advisories_max": val_adv_max,
        "expected_months_remaining": months,
        "total_advisory_cost_min": total_adv_min, "total_advisory_cost_max": total_adv_max,
        "original_msrp_min": msrp_min, "original_msrp_max": msrp_max,
        "depreciation_pct": depr_pct,
    }


# ─── Report Generator ────────────────────────────────────────────────────────

def colour_emoji(c):
    return {"🟢": "🟢", "🟡": "🟡", "🔴": "🔴"}.get(c, "⚪")

def risk_label(r):
    return {"high": "HIGH", "medium": "MODERATE", "low": "LOW", "unknown": "UNKNOWN"}.get(r.lower() if isinstance(r, str) else "", "UNKNOWN")

def generate_report(plate, data):
    """
    Vehicle OSINT Report — 14-section template (authoritative format)
    Aligns with: src/osint/report.ts
    """
    cc = data["carcheck"]
    dvla = data["dvla"]
    cr = data.get("cross_ref", {})
    mot_history = cc.get("raw_data", {}).get("mot_history", [])
    advisories = data.get("advisories", [])
    valuation = data.get("valuation", {})
    mileage_timeline = cc.get("raw_data", {}).get("mileage_timeline", [])

    make = data.get("make") or ""
    model = data.get("model") or ""
    year = data.get("year") or 0
    colour = data.get("colour") or ""
    fuel_type = data.get("fuel_type") or ""
    engine_cc = data.get("engine_cc") or 0
    gearbox = data.get("gearbox") or ""
    body_type = data.get("body_type") or ""
    mot_expiry = data.get("mot_expiry") or ""
    mot_pass_rate = data.get("mot_pass_rate") or ""
    current_mileage = data.get("current_mileage") or 0
    mot_passed = data.get("mot_passed") or 0
    mot_failed = data.get("mot_failed") or 0
    mot_history_count = data.get("mot_history_count") or 0
    tax_status = data.get("tax_status") or ""
    errors = data.get("errors", [])
    data_sources = data.get("data_sources_log", [])

    val_min = valuation.get("current_value_min", 0)
    val_max = valuation.get("current_value_max", 0)
    val_adv_min = valuation.get("value_with_advisories_min", 0)
    val_adv_max = valuation.get("value_with_advisories_max", 0)
    depr = valuation.get("depreciation_pct", 0)
    msrp_min = valuation.get("original_msrp_min", 0)
    msrp_max = valuation.get("original_msrp_max", 0)

    age = datetime.now().year - (year or 2005)

    # Determine risk
    has_critical = any(a.get("severity") in ("critical", "high") for a in advisories)
    has_high = any(a.get("severity") == "high" for a in advisories)
    risk = "🔴 HIGH" if has_critical else ("🟡 MODERATE" if has_high or mot_failed > 1 else "🟢 LOW")

    # Confidence
    sources_ok = sum(1 for s in data_sources if s.get("success"))
    conf_pct = min(95, 40 + sources_ok * 12)

    lines = []

    # ─────────────────────────────────────────────────────────────────────────
    # VEHICLE OSINT REPORT — 14-section template (authoritative format)
    # Aligns with: src/osint/report.ts
    # ─────────────────────────────────────────────────────────────────────────

    lines.append(f"# 🚗 Vehicle OSINT Report — **{plate}**\n")
    lines.append(f"\n| | |\n|---|---|\n")
    lines.append(f"| **Report Date** | {datetime.now().strftime('%Y-%m-%d')} |\n")
    lines.append(f"| **Registration** | {plate} |\n")
    lines.append(f"| **Plate Type** | UK Registration |\n")
    lines.append(f"| **Data Sources** | car-checking.com, Gov.uk DVLA |\n")
    lines.append(f"\n")

    # ── Section 1: Vehicle Header Card ───────────────────────────────────────
    lines.append(f"## 1. Vehicle Header Card\n\n")
    lines.append(f"```\n")
    lines.append(f"  Registration:     {plate}\n")
    lines.append(f"  Make:             {make or '⚠️ Unknown'}\n")
    lines.append(f"  Model:            {model or '⚠️ Unknown'}\n")
    lines.append(f"  Year:             {year or '⚠️ Unknown'}\n")
    lines.append(f"  Colour:           {colour or '⚠️ Unknown'}\n")
    lines.append(f"  Body Type:        {body_type or 'N/A'}\n")
    lines.append(f"  Fuel Type:        {fuel_type or '⚠️ Unknown'}\n")
    lines.append(f"  Engine Size:      {f'{engine_cc:,} cc' if engine_cc else 'N/A'}\n")
    lines.append(f"  Power:            {data.get('power_bhp', 'N/A')} BHP\n")
    lines.append(f"  Transmission:     {gearbox or '⚠️ Unknown'}\n")
    lines.append(f"  CO2 Emissions:    {data.get('co2_gkm', 'N/A')} g/km\n")
    lines.append(f"  Combined MPG:     {data.get('combined_mpg', 'N/A')} mpg\n")
    lines.append(f"  VIN:              {data.get('vin') or 'Not on record'}\n")
    lines.append(f"  Previous VRM:     None\n")
    lines.append(f"```\n")
    lines.append(f"\n")

    # ── Section 2: Vehicle Status ─────────────────────────────────────────────
    lines.append(f"## 2. Vehicle Status\n\n")
    lines.append(f"```\n")
    lines.append(f"  Tax Status:        {tax_status or 'Unknown'}\n")

    mot_status = 'No MOT data'
    if mot_expiry:
        try:
            exp_parts = re.match(r'(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})', str(mot_expiry))
            if exp_parts:
                yr = int(exp_parts.group(3))
                if yr < 100: yr += 2000
                exp_dt = datetime(yr, int(exp_parts.group(2)), int(exp_parts.group(1)))
                mot_status = 'Valid' if exp_dt > datetime.now() else 'Expired'
        except: pass
    elif mot_passed > 0 or mot_failed > 0:
        mot_status = 'Unknown'

    pr_str = f"{mot_pass_rate}%" if mot_pass_rate else "N/A"
    ins = data.get("insurance_group", {})
    ins_grp = f"{ins.get('group_min', '?')}–{ins.get('group_max', '?')}" if ins.get('group_min') else 'N/A'

    lines.append(f"  MOT Status:        {mot_status}\n")
    lines.append(f"  MOT Expiry:        {mot_expiry or 'N/A'}\n")
    lines.append(f"  MOT Pass Rate:     {pr_str}\n")
    lines.append(f"  MOT Passed:        {mot_passed}  |  MOT Failed: {mot_failed}\n")
    lines.append(f"  MOT Tests Total:   {mot_history_count}\n")
    lines.append(f"  First Reg:         {data.get('first_reg') or 'Unknown'}\n")
    lines.append(f"  Insurance Group:  {ins_grp}\n")
    lines.append(f"  Keepers / Owners:  {data.get('owner_count', 'Unknown')}\n")
    lines.append(f"```\n")
    lines.append(f"\n")

    # ── Section 3: MOT History Intelligence ──────────────────────────────────
    lines.append(f"## 3. MOT History Intelligence\n\n")
    lines.append(f"**MOT Pass Rate:** {pr_str}  **|**  **Passed:** {mot_passed}  **|**  **Failed:** {mot_failed}  **|**  **Tests on record:** {mot_history_count}\n\n")
    if mot_history:
        lines.append(f"| # | Date | Odometer | Result | Test Centre | Advisories |\n")
        lines.append(f"|---|------|----------|--------|-------------|-------------|\n")
        for entry in mot_history[:20]:
            adv_list = entry.get("advisories", [])
            adv_text = ", ".join(adv_list[:2]) if adv_list else 'None'
            if len(", ".join(adv_list)) > 60: adv_text = adv_text[:60] + "..."
            res_emoji = "✔ Pass" if entry.get("result") == "Pass" else "✗ Fail"
            lines.append(f"| {entry.get('test_number','?')} | {entry.get('date','?')} | {entry.get('mileage','?')} mi | {res_emoji} | {entry.get('test_centre','?') or '?'} | {adv_text} |\n")
        lines.append(f"\n")
    else:
        lines.append("⚠️ Full MOT history not available from open sources.\n\n")

    # ── Section 4: Risk Indicators ───────────────────────────────────────────
    crit_count = sum(1 for a in advisories if a.get("severity") == "critical")
    high_count = sum(1 for a in advisories if a.get("severity") == "high")
    med_count = sum(1 for a in advisories if a.get("severity") == "medium")
    low_count = sum(1 for a in advisories if a.get("severity") == "low")
    lines.append(f"## 4. Risk Indicators\n\n")
    cond_label = "🔴 Neglect indicators" if crit_count > 0 or high_count >= 2 else ("🟡 Average condition" if high_count > 0 or med_count >= 3 else "🟢 Well maintained")
    lines.append(f"**Overall Condition:** {cond_label}\n\n")
    lines.append(f"| Severity | Count |\n")
    lines.append(f"| --- | --- |\n")
    if crit_count > 0: lines.append(f"| 🔴 Critical | {crit_count} |\n")
    if high_count > 0: lines.append(f"| 🟠 High | {high_count} |\n")
    if med_count > 0: lines.append(f"| 🟡 Medium | {med_count} |\n")
    if low_count > 0: lines.append(f"| 🟢 Low | {low_count} |\n")
    if not advisories: lines.append(f"| 🟢 None | 0 |\n")
    lines.append(f"\n")

    # ── Section 5: Mileage Intelligence Analysis ─────────────────────────────
    lines.append(f"## 5. Mileage Intelligence Analysis\n\n")
    if mileage_timeline and len(mileage_timeline) > 0:
        current = mileage_timeline[0]
        oldest = mileage_timeline[-1] if len(mileage_timeline) > 1 else current
        lines.append(f"| Metric | Value |\n")
        lines.append(f"|---|---|\n")
        lines.append(f"| Current odometer (latest MOT) | **{current:,} mi** |\n")
        lines.append(f"| First recorded MOT mileage | {oldest:,} mi |\n")
        lines.append(f"| Total miles covered (MOT period) | {current - oldest:,} mi |\n")
        if len(mileage_timeline) >= 2:
            years_span = max(1, year and (datetime.now().year - year) or len(mileage_timeline))
            annual_avg = (current - oldest) / max(1, years_span)
            miles_per_yr = "🟢 Low — careful owner" if annual_avg < 6000 else ("🟡 Average" if annual_avg < 12000 else "🔴 High mileage")
            lines.append(f"| Average per MOT year | **{annual_avg:,.0f} mi/yr** ({miles_per_yr}) |\n")
        lines.append(f"\n**Mileage trend (newest → oldest MOT):**\n\n")
        lines.append(f"| # | Mileage |\n")
        lines.append(f"| --- | --- |\n")
        for i, m in enumerate(mileage_timeline[:15]):
            lines.append(f"| #{i+1} | {m:,} mi |\n")
        lines.append(f"\n")
    else:
        lines.append("⚠️ Mileage timeline not available.\n\n")

    # ── Section 6: Market Intelligence ────────────────────────────────────────
    lines.append(f"## 6. Market Intelligence\n\n")
    if val_min and val_max:
        lines.append(f"| Scenario | Price |\n")
        lines.append(f"|---|---|\n")
        lines.append(f"| **Retail value (poor condition)** | **£{val_min:,} – £{val_max:,}** |\n")
        if val_adv_min and val_adv_max:
            lines.append(f"| As-is (with advisories deducted) | £{val_adv_min:,} – £{val_adv_max:,} |\n")
        if msrp_min and msrp_max:
            lines.append(f"| Original MSRP (when new) | £{msrp_min:,} – £{msrp_max:,} |\n")
        lines.append(f"| Depreciation | ~{depr}% from new |\n")
        lines.append(f"\n")
        val_conf = "🟢 High" if len(mot_history) >= 5 else "🟡 Medium" if mot_history else "🔴 Low"
        lines.append(f"**Valuation Confidence:** {val_conf} — based on {len(mot_history)} MOT records\n\n")
    else:
        lines.append("Market valuation not available.\n\n")

    # ── Section 7: Insurance Risk Indicators ─────────────────────────────────
    lines.append(f"## 7. Insurance Risk Indicators\n\n")
    ins_note = ins.get("note", "") if isinstance(ins, dict) else ""
    ins_risk = "🔴 High" if crit_count > 0 or high_count >= 2 else ("🟡 Moderate" if high_count > 0 or med_count >= 2 else "🟢 Low")
    lines.append(f"**Insurance Group:** {ins_grp}\n")
    if ins_note: lines.append(f"**Profile:** {ins_note}\n")
    lines.append(f"**Risk Rating:** {ins_risk}\n")
    lines.append(f"\n")

    # ── Section 8: Geographic Intelligence ────────────────────────────────────
    centres = []
    if mot_history:
        for e in mot_history:
            tc = e.get("test_centre", "")
            if tc and tc != "?": centres.append(tc)
    unique_centres = list(dict.fromkeys(centres))
    lines.append(f"## 8. Geographic Intelligence\n\n")
    if unique_centres:
        lines.append(f"**Common test locations:**\n")
        for loc in unique_centres[:5]:
            lines.append(f"  - {loc}\n")
        lines.append(f"\n")
        if len(unique_centres) >= 3:
            usage = "🏙️ Urban/commuter — multiple independent test centres across regions"
        elif len(unique_centres) == 1 and len(mot_history) > 3:
            usage = "🏡 Local/regional — single test centre, possibly one owner"
        else:
            usage = "🚗 Regional — used across a few locations"
        lines.append(f"**Usage pattern:** {usage}\n\n")
    else:
        lines.append("No geographic data available from MOT records.\n\n")

    # ── Section 9: Mechanical Intelligence Indicators ─────────────────────────
    lines.append(f"## 9. Mechanical Intelligence Indicators\n\n")
    if advisories:
        lines.append(f"**Specific advisories found on this vehicle:**\n\n")
        for a in advisories[:12]:
            se = {"critical":"🔴","high":"🟠","medium":"🟡","low":"🟢"}.get(a.get("severity",""),"⚪")
            lines.append(f"  {se} {a.get('issue','Unknown')} — est. £{a.get('cost_min',0):,}–£{a.get('cost_max',0):,}\n")
        lines.append(f"\n")
    rel_emoji = "🔴 Poor" if crit_count > 0 or high_count >= 3 else ("🟡 Average" if high_count > 0 or med_count >= 3 else "🟢 Good")
    lines.append(f"**Model Reliability Rating:** {rel_emoji}\n\n")

    # ── Section 10: Ownership Intelligence (OSINT derived) ────────────────────
    lines.append(f"## 10. Ownership Intelligence (OSINT derived)\n\n")
    est_owners = data.get("owner_count", "?")
    lines.append(f"**Estimated Owner Count:** {est_owners}\n\n")
    owner_flags = []
    if len(unique_centres) >= 3: owner_flags.append(f"Multiple test locations ({len(unique_centres)}) — may indicate multiple owners or mobile testing")
    if len(unique_centres) == 1 and len(mot_history) > 3: owner_flags.append("Consistent single test centre — possibly one owner, garage-maintained")
    if mileage_timeline and len(mileage_timeline) >= 2:
        oldest_m, current_m = mileage_timeline[-1], mileage_timeline[0]
        if oldest_m and current_m:
            span = max(1, year and (datetime.now().year - year) or len(mileage_timeline))
            miles_per_yr = (current_m - oldest_m) / span
            if miles_per_yr > 15000: owner_flags.append(f"High-mileage usage pattern (~{miles_per_yr:,.0f} mi/yr) — possibly commercial or fleet")
            elif miles_per_yr < 5000: owner_flags.append(f"Low-mileage usage pattern (~{miles_per_yr:,.0f} mi/yr) — possibly second car or low-use private")
    if owner_flags:
        for f in owner_flags: lines.append(f"  - {f}\n")
    else:
        lines.append("  - Insufficient MOT history to determine ownership patterns\n")
    lines.append(f"\n")

    # ── Section 11: Risk Flags ────────────────────────────────────────────────
    lines.append(f"## 11. Risk Flags\n\n")
    risk_flags = []
    if mot_failed >= 3: risk_flags.append(f"⚠️ Repeated failures: {mot_failed} fails on record")
    if age > 15: risk_flags.append(f"⚠️ Age: {age} years — structural rust, corrosion, and major component wear risk")
    if not data.get("vin"): risk_flags.append("⚠️ VIN not on record — verify against physical plate")
    if crit_count > 5: risk_flags.append(f"⚠️ High critical advisory count ({crit_count}) — serious safety concerns")
    if mot_expiry:
        try:
            exp_parts = re.match(r'(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})', str(mot_expiry))
            if exp_parts:
                yr = int(exp_parts.group(3))
                if yr < 100: yr += 2000
                exp_dt = datetime(yr, int(exp_parts.group(2)), int(exp_parts.group(1)))
                days_to_exp = (exp_dt - datetime.now()).days
                if days_to_exp < 0: risk_flags.append(f"⚠️ MOT expired {abs(days_to_exp)} days ago")
                elif days_to_exp < 30: risk_flags.append(f"⚠️ MOT expiring within {days_to_exp} days")
        except: pass
    if risk_flags:
        for f in risk_flags: lines.append(f"  {f}\n")
    else:
        lines.append("  No significant risk flags identified.\n")
    lines.append(f"\n")

    # ── Section 12: OSINT Confidence Score ────────────────────────────────────
    dvla_ok = 1 if (data.get("make") or data.get("colour") or tax_status) else 0
    mot_ok = 1 if (mot_history or mot_passed > 0 or mot_failed > 0) else 0
    market_ok = 1 if (val_min and val_max) else 0
    dvla_conf = dvla_ok * 100
    mot_conf = mot_ok * 100
    market_conf = 80 if market_ok else 50
    risk_conf = 65
    overall_conf = round((dvla_conf + mot_conf + market_conf + risk_conf) / 4)
    lines.append(f"## 12. OSINT Confidence Score\n\n")
    lines.append(f"| Category | Confidence |\n")
    lines.append(f"| --- | --- |\n")
    lines.append(f"| DVLA data | {'🟢 100%' if dvla_conf else '🔴 0%'} |\n")
    lines.append(f"| MOT data | {'🟢 100%' if mot_conf else '🔴 0%'} |\n")
    lines.append(f"| Market data | {'🟢 ' + str(market_conf) + '%' if market_conf >= 80 else '🟡 ' + str(market_conf) + '%' if market_conf >= 50 else '🔴 ' + str(market_conf) + '%'} |\n")
    lines.append(f"| Risk analysis | 🟡 65% |\n")
    lines.append(f"\n")
    ov_emoji = "🟢" if overall_conf >= 80 else "🟡" if overall_conf >= 50 else "🔴"
    lines.append(f"**Overall OSINT confidence:** {ov_emoji} **{overall_conf}/100**\n\n")

    # ── Section 13: Analyst Summary ───────────────────────────────────────────
    lines.append(f"## 13. Analyst Summary\n\n")
    vehicle_desc = f"{make} {model} ({year})" + (f" in {colour}" if colour else "")
    mot_desc = f"an {'expired' if mot_status == 'Expired' else 'valid' if mot_status == 'Valid' else 'unknown'} MOT "
    if mot_expiry: mot_desc += f"expiring {mot_expiry} "
    mot_desc += f"with {mot_passed} pass(es) and {mot_failed} fail(s) on record. "
    if not advisories:
        summary = f"{vehicle_desc} has {mot_desc}No advisories were raised on the most recent MOT, suggesting the vehicle is in reasonable mechanical condition. "
    else:
        crit_high = crit_count + high_count
        if crit_high > 0:
            summary = f"{vehicle_desc} has {mot_desc}{crit_high} critical or high-severity issue(s) were identified — immediate attention is recommended before relying on this vehicle. "
        else:
            summary = f"{vehicle_desc} has {mot_desc}{len(advisories)} advisory/advisories were noted; these are manageable but should be budgeted for. "
    if val_min and val_max:
        summary += f"Current market value is estimated at £{val_min:,}–£{val_max:,}. "
    summary += f"Overall risk profile is rated **{risk}**."
    lines.append(f"{summary}\n\n")

    # ── Section 14: Overall OSINT Risk Rating ─────────────────────────────────
    lines.append(f"## 14. Overall OSINT Risk Rating\n\n")
    lines.append(f"**{risk}**\n\n")

    # ── Data Sources ───────────────────────────────────────────────────────────
    lines.append(f"## 📡 Data Sources & Confidence\n\n")
    lines.append(f"| Source | Status | Data Retrieved |\n")
    lines.append(f"|---|---|---|\n")
    for s in data_sources:
        status = "✅ Available" if s.get("success") else "❌ Failed"
        note = s.get("note", "")
        lines.append(f"| {s.get('name','?')} | {status} | {note} |\n")
    lines.append(f"\n")

    # ── Errors ─────────────────────────────────────────────────────────────────
    if errors:
        lines.append(f"**⚠️ Errors ({len(errors)}):**\n\n")
        for e in errors[:5]:
            lines.append(f"- {e}\n")
        lines.append(f"\n")

    return "".join(lines)

def run_vehicle_osint(plate, output_path=None):
    plate_clean = re.sub(r'[\s\-]', '', plate.strip()).upper()
    errors = []
    data_sources = []

    print(f"  [*] Running OSINT on {plate_clean}...")

    # ── Parallel collection: car-checking + DVLA simultaneously ──
    results = {}
    lock = threading.Lock()

    def run_one(name, func, plate):
        try:
            with sync_playwright() as p:
                r = func(plate, p)
            with lock:
                results[name] = r
        except Exception as e:
            with lock:
                results[name] = {"findings": [], "errors": [f"{name}: {e}"], "raw_data": {}}

    threads = [
        threading.Thread(target=run_one, args=("carcheck", collect_car_check, plate_clean)),
        threading.Thread(target=run_one, args=("dvla", collect_dvla, plate_clean)),
        threading.Thread(target=run_one, args=("mot_history", lambda p, _: collect_check_mot_history(p), plate_clean)),
    ]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=90)
    for t in threads:
        if t.is_alive():
            errors.append("Some collectors timed out")

    cc = results.get("carcheck", {"findings": [], "errors": [], "raw_data": {}})
    dvla = results.get("dvla", {"findings": [], "errors": [], "raw_data": {}})
    mot_hist_data = results.get("mot_history", {"findings": [], "errors": [], "raw_data": {}})
    data_sources.append({"name": "car-checking.com", "success": bool(cc.get("findings")), "note": cc.get("source","")})
    data_sources.append({"name": "gov.uk DVLA", "success": bool(dvla.get("findings")), "note": dvla.get("source","")})
    data_sources.append({"name": "check-mot-history.co.uk", "success": bool(mot_hist_data.get("findings")), "note": mot_hist_data.get("source","")})
    errors.extend(cc.get("errors", []))
    errors.extend(dvla.get("errors", []))
    errors.extend(mot_hist_data.get("errors", []))

    # ── Extract fields from collected data ──
    raw = cc.get("raw_data", {})
    dvla_raw = dvla.get("raw_data", {})

    make = raw.get("make", "") or dvla_raw.get("make_dvla", "") or ""
    model = (raw.get("model", "") or "").strip()
    year = int(raw.get("year", 0)) or 0
    colour = raw.get("colour", "") or dvla_raw.get("colour", "")
    fuel_type = raw.get("fuel_type", "")
    engine_cc = int(re.sub(r'\D', '', str(raw.get("engine_capacity", 0)))) or 0
    gearbox = raw.get("gearbox", "")
    mot_expiry = raw.get("mot_expiry", "") or dvla_raw.get("mot_expiry_dvla", "")
    mot_pass_rate = raw.get("mot_pass_rate", "")
    mot_passed = int(raw.get("mot_passed", 0))
    mot_failed = int(raw.get("mot_failed", 0))
    mot_history = raw.get("mot_history", [])
    mot_history_count = raw.get("mot_history_count", 0)
    mileage_timeline = raw.get("mileage_timeline", [])
    current_mileage = raw.get("current_mileage", 0)
    advisory_notes = raw.get("advisory_notes", [])
    tax_status = dvla_raw.get("tax_status", "")
    first_reg = dvla_raw.get("first_reg", dvla_raw.get("first_reg_dvla", ""))
    vin = raw.get("vin", "")
    body_type = ""

    # ── Merge MOT history from check-mot-history.co.uk ──────────────────────
    mot_hist_raw = mot_hist_data.get("raw_data", {})
    if mot_hist_raw.get("mot_history") and not mot_history:
        mot_history = mot_hist_raw["mot_history"]
        mot_history_count = mot_hist_raw.get("mot_history_count", len(mot_history))
        combined = [int(e["mileage"]) for e in mot_history if e.get("mileage")]
        combined.extend(mileage_timeline or [])
        mileage_timeline = sorted(set(combined), reverse=True)
        current_mileage = mileage_timeline[0] if mileage_timeline else current_mileage
    # Pull vehicle identity from mot_hist if not already set
    if not make:
        make = mot_hist_raw.get("make", "")
    if not colour:
        colour = mot_hist_raw.get("colour", "")
    if not year:
        try: year = int(mot_hist_raw.get("year", 0))
        except: pass
    if not first_reg:
        first_reg = mot_hist_raw.get("first_reg", "")
    if not fuel_type:
        fuel_type = mot_hist_raw.get("fuel_type", "")

    # ── Cross-reference enrichment ──
    cr = cross_reference(make, model, year, engine_cc, fuel_type)
    if cr.get("engine_cc") and not engine_cc:
        engine_cc = cr["engine_cc"]
    if cr.get("fuel_type") and not fuel_type:
        fuel_type = cr["fuel_type"]
    if cr.get("gearbox") and not gearbox:
        gearbox = cr["gearbox"]
    if cr.get("body_type"):
        body_type = cr["body_type"]

    # ── Build advisory list ──
    advisories = []
    seen_issues = set()
    for note in advisory_notes[:30]:  # limit to 30 unique
        note_clean = note[:150].strip()
        note_lower = note_clean.lower()
        # Skip if too short or too generic
        if len(note_clean) < 8:
            continue
        if note_lower in seen_issues:
            continue
        seen_issues.add(note_lower)
        sev = "low"
        cost = (30, 150)
        if re.search(r'tyre|wheel\b|tire| tread |perishing', note_lower):
            sev, cost = "low", (40, 200)
        elif re.search(r'brake|brake.?pad|disc |rotor|brake.?pipe|brake.?hose', note_lower):
            sev, cost = "medium", (80, 350)
        elif re.search(r'suspension|shock|spring |coil|sub.frame|trailing arm', note_lower):
            sev, cost = "medium", (100, 500)
        elif re.search(r'corrosion|rust|exhaust|catalyst|dpf|lambda', note_lower):
            sev, cost = "medium", (150, 800)
        elif re.search(r'seatbelt|airbag|brake.?light|headlight', note_lower):
            sev, cost = "high", (100, 600)
        elif re.search(r'windscreen|wiper|washer|mirror', note_lower):
            sev, cost = "low", (30, 120)
        advisories.append({"issue": note_clean, "severity": sev, "cost_min": cost[0], "cost_max": cost[1]})

    # ── Insurance group ──
    ins_key = next(((m, mo) for (m, mo) in INSURANCE_GROUPS if re.search(m, make or "") and re.search(mo, model or "")), None)
    insurance_group = {}
    if ins_key:
        grp_min, grp_max, ins_note = INSURANCE_GROUPS[ins_key]
        insurance_group = {"group_min": grp_min, "group_max": grp_max, "note": ins_note}
    else:
        insurance_group = {"group_min": None, "group_max": None}

    # ── Valuation ──
    valuation = generate_valuation(make, model, year, current_mileage, fuel_type, advisories, mot_failed, mot_passed + mot_failed, tax_status, mot_expiry)

    # ── Owner estimate ──
    owner_count = "~" + str(max(1, mot_history_count // 3)) if mot_history_count > 0 else "?"

    # ── Assemble report data ──
    report_data = {
        "carcheck": cc,
        "dvla": dvla,
        "make": make.title() if make else "",
        "model": model.title() if model else "",
        "year": year,
        "colour": colour.title() if colour else "",
        "fuel_type": fuel_type.title() if fuel_type else "",
        "engine_cc": engine_cc,
        "gearbox": gearbox,
        "body_type": body_type,
        "current_mileage": current_mileage,
        "mot_expiry": mot_expiry,
        "mot_pass_rate": mot_pass_rate,
        "mot_passed": mot_passed,
        "mot_failed": mot_failed,
        "mot_history_count": mot_history_count,
        "advisories": advisories,
        "tax_status": tax_status.title() if tax_status else "",
        "first_reg": first_reg,
        "vin": vin,
        "valuation": valuation,
        "insurance_group": insurance_group,
        "owner_count": owner_count,
        "errors": errors,
        "data_sources_log": data_sources,
        "cross_ref": cr,
    }

    # ── Generate report ──
    report_text = generate_report(plate_clean, report_data)

    # ── Save ──
    today = datetime.now().strftime("%Y-%m-%d")
    if output_path:
        out = Path(output_path)
    else:
        out = Path("reports") / "osint" / today
        out.mkdir(parents=True, exist_ok=True)
        out = out / f"vehicle-{plate_clean}.md"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(report_text, encoding="utf-8")

    vmin = valuation.get("current_value_min", 0)
    vmax = valuation.get("current_value_max", 0)
    has_crit = any(a.get("severity") in ("critical","high") for a in advisories)
    risk_str = "HIGH" if has_crit else "LOW"
    print(f"\n  --- Result ---")
    print(f"  {plate_clean}  {make} {model}  MOT:{mot_expiry or '?'}")
    if vmin and vmax:
        print(f"  Value: £{vmin:,}–£{vmax:,}  Risk: {risk_str}")
    print(f"  Report: {out}")

    return {
        "plate": plate_clean, "make": make, "model": model,
        "year": year, "valuation": valuation,
        "errors": errors, "report_path": str(out)
    }


if __name__ == "__main__":
    import sys
    # Parse --reg flag
    plate = None
    i = 1
    while i < len(sys.argv):
        if sys.argv[i] == "--reg" and i + 1 < len(sys.argv):
            plate = sys.argv[i + 1]
            break
        elif not sys.argv[i].startswith("-"):
            plate = sys.argv[i]
            break
        i += 1
    if not plate:
        plate = input("Enter plate: ").strip()
    if not plate:
        print("No plate entered.")
        sys.exit(1)
    run_vehicle_osint(plate, sys.argv[-1] if sys.argv[-1] and not sys.argv[-1].startswith("-") else None)
