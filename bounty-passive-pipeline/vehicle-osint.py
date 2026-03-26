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
        browser = pw.chromium.launch(headless=True, executable_path=CHROME_PATH)
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            extra_http_headers={"Accept-Language": "en-GB,en;q=0.9"}
        )
        page = ctx.new_page()
        page.on("dialog", lambda d: d.accept())
        page.goto("https://www.car-checking.com/", wait_until="domcontentloaded", timeout=20000)
        page.wait_for_timeout(3000)
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

        extract(r'Make\s+([A-Z0-9 ]+)', "make")
        m = re.search(r'Model\s+([^\n]+?)\s+Colour', body)
        result["raw_data"]["model"] = m.group(1).strip() if m else ""
        extract(r'Colour\s+([A-Za-z ]+)', "colour")
        extract(r'Year of manufacture\s+(\d{4})', "year")
        extract(r'Gearbox\s+([A-Za-z0-9/ ]+)', "gearbox")
        extract(r'Engine capacity\s+(\d+)\s*cc', "engine_capacity")
        extract(r'Fuel type\s+([A-Za-z/ ]+)', "fuel_type")
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
    """DVLA vehicle enquiry — colour, VIN, first registration, tax status."""
    result = {"findings": [], "errors": [], "raw_data": {}, "source": "gov.uk-DVLA"}
    browser = None
    try:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME_PATH)
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            extra_http_headers={"Accept-Language": "en-GB,en;q=0.9"}
        )
        page = ctx.new_page()
        page.goto("https://vehicleenquiry.service.gov.uk/", wait_until="networkidle", timeout=25000)
        try:
            page.locator("button", has_text=re.compile(r"Reject", re.I)).first.click()
            page.wait_for_load_state("networkidle", timeout=10000)
        except:
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

    except Exception as e:
        result["errors"].append(f"DVLA: {e}")
    finally:
        if browser:
            browser.close()
    delay(0.5)
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
    value = estimate_value(make, model, year, mileage, condition)
    age = datetime.now().year - (year or 2005)
    diesel = bool(re.search(r"diesel|dci|tdi|cdti", fuel_type or "", re.I))
    months = 3 if has_critical else (6 if has_high else (12 if len(advisories) >= 5 else (18 if diesel and age > 15 else 24)))

    total_adv_min = sum(a.get("cost_min", 0) for a in advisories)
    total_adv_max = sum(a.get("cost_max", 0) for a in advisories)
    repair_penalty_min = round(total_adv_min * 0.7)
    repair_penalty_max = round(total_adv_max * 0.7)
    val_adv_min = max(200, value["min"] - repair_penalty_max)
    val_adv_max = max(300, value["max"] - repair_penalty_min)

    make_l = make.lower() if make else ""
    model_l = model.lower() if model else ""
    msrp_key = next(((m, mo) for (m, mo) in ORIGINAL_MSRP if re.search(m, make_l) and re.search(mo, model_l)), None)
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
    current_mileage = data.get("current_mileage") or 0
    mot_expiry = data.get("mot_expiry") or ""
    mot_pass_rate = data.get("mot_pass_rate") or ""
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
    sep = "─" * 50

    lines.append(f"# 🅾️ OSINT Report — {plate}\n")
    lines.append(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M')}  **Type:** UK Registration\n\n")

    # ── Vehicle Header ──
    lines.append(f"## 🚗 Vehicle Header\n\n")
    lines.append(f"| Field | Value |\n|---|---|\n")
    lines.append(f"| Registration | **{plate}** |\n")
    lines.append(f"| Make | {make or '⚠️ Unknown'} |\n")
    lines.append(f"| Model | {model or '⚠️ Unknown'} |\n")
    lines.append(f"| Year | {year or '⚠️ Unknown'} |\n")
    lines.append(f"| Colour | {colour or '⚠️ Unknown'} |\n")
    lines.append(f"| Body Type | {body_type or '⚠️ Unknown'} |\n")
    lines.append(f"| Fuel Type | {fuel_type or '⚠️ Unknown'} |\n")
    lines.append(f"| Engine | {f'{engine_cc} cc' if engine_cc else '⚠️ Unknown'} |\n")
    lines.append(f"| Gearbox | {gearbox or '⚠️ Unknown'} |\n")
    if current_mileage:
        lines.append(f"| Mileage | {current_mileage:,} mi |\n")
    lines.append(f"| VIN | {data.get('vin') or 'Not found'} |\n")
    lines.append(f"| Tax Status | {tax_status or 'Unknown'} |\n")
    lines.append(f"| MOT Expiry | {mot_expiry or '⚠️ Unknown'} |\n")
    lines.append(f"| First Registered | {data.get('first_reg') or 'Unknown'} |\n")
    lines.append("\n")

    # ── MOT Status ──
    lines.append(f"{sep}\n## 📋 MOT Status\n\n")
    lines.append(f"**MOT Expiry:** {mot_expiry or '⚠️ Unknown'}  |  ")
    lines.append(f"**Pass Rate:** {mot_pass_rate + '%' if mot_pass_rate else '⚠️ Unknown'}  |  ")
    lines.append(f"**Passed:** {mot_passed} / Failed: {mot_failed}  |  ")
    lines.append(f"**Tests on record:** {mot_history_count}\n\n")
    lines.append(f"**Risk:** {risk}\n\n")

    # ── MOT History Table ──
    lines.append(f"{sep}\n## 📅 MOT History\n\n")
    if mot_history:
        lines.append(f"| # | Date | Mileage | Result | Advisories | Test Centre |\n")
        lines.append(f"|---|------|---------|--------|-------------|-------------|\n")
        for entry in mot_history:
            adv_text = ", ".join(entry.get("advisories", [])[:2])
            if len(", ".join(entry.get("advisories", []))) > 60:
                adv_text = adv_text[:60] + "..."
            res_emoji = "✔ Pass" if entry.get("result") == "Pass" else "✗ Fail"
            lines.append(f"| {entry.get('test_number','')} | {entry.get('date','')} | {entry.get('mileage','') or '?'} | {res_emoji} | {adv_text or 'None'} | {entry.get('test_centre','') or '?'} |\n")
    else:
        lines.append("⚠️ Full MOT history not available from open sources.\n")
    lines.append("\n")

    # ── Advisories ──
    lines.append(f"{sep}\n## 🔧 Advisory Items\n\n")
    if advisories:
        for a in advisories:
            sev_emoji = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}.get(a.get("severity",""), "⚪")
            lines.append(f"- {sev_emoji} **{a.get('issue','Unknown issue')}** — est. £{a.get('cost_min',0):,}–£{a.get('cost_max',0):,}\n")
    else:
        lines.append("✔ No advisories recorded.\n")
    lines.append("\n")

    # ── Mileage Timeline ──
    lines.append(f"{sep}\n## 📊 Mileage Intelligence\n\n")
    if mileage_timeline:
        current = mileage_timeline[0]
        oldest = mileage_timeline[-1] if len(mileage_timeline) > 1 else current
        if len(mileage_timeline) >= 2:
            years_between = max(1, year and (datetime.now().year - year) or 5)
            annual_miles = (current - oldest) / years_between if years_between > 0 else 0
            lines.append(f"- Current odometer: **{current:,} mi**\n")
            lines.append(f"- Annual average: **{annual_miles:,.0f} mi/yr**\n")
            lines.append(f"- Consistency: {'🟢 Consistent' if annual_miles < 15000 else '🟡 Normal' if annual_miles < 25000 else '🔴 High mileage'}\n")
        else:
            lines.append(f"- Current mileage: **{current:,} mi**\n")
    else:
        lines.append("⚠️ Mileage timeline not available.\n")
    lines.append("\n")

    # ── Valuation ──
    lines.append(f"{sep}\n## 💷 Valuation\n\n")
    lines.append(f"**Estimated value:** £{val_min:,} – £{val_max:,}\n")
    lines.append(f"**With advisories:** £{val_adv_min:,} – £{val_adv_max:,}\n")
    lines.append(f"**Depreciation:** ~{depr}% from new (~£{msrp_min:,}–£{msrp_max:,})\n")
    lines.append(f"**Expected months remaining:** {valuation.get('expected_months_remaining', '?')} months\n")
    if valuation.get("total_advisory_cost_min"):
        lines.append(f"**Advisory repair cost:** £{valuation['total_advisory_cost_min']:,}–£{valuation['total_advisory_cost_max']:,}\n")
    lines.append(f"\n**Valuation confidence:** {'🟢 High' if len(mot_history) >= 5 else '🟡 Medium' if mot_history else '🔴 Low'} — based on {len(mot_history)} MOT records\n\n")

    # ── Risk ──
    lines.append(f"{sep}\n## 🚨 Risk Assessment\n\n")
    lines.append(f"**Overall risk:** {risk}\n\n")
    if advisories:
        for a in advisories:
            if a.get("severity") in ("critical", "high"):
                lines.append(f"🔴 **{a.get('issue')}** — £{a.get('cost_min',0):,}–£{a.get('cost_max',0):,}\n\n")
    if mot_failed > 2:
        lines.append(f"⚠️ Multiple MOT failures ({mot_failed}) — potential systemic issues.\n\n")
    if age > 15:
        lines.append(f"⚠️ Vehicle is {age} years old — monitor for rust, corrosion, and wear items.\n\n")
    if not advisories and mot_failed == 0:
        lines.append("✔ No significant risk flags.\n\n")

    # ── Insurance ──
    lines.append(f"{sep}\n## 🛡 Insurance & Ownership\n\n")
    ins = data.get("insurance_group", {})
    ins_grp = ins.get("group_min")
    if ins_grp:
        lines.append(f"**Insurance Group:** {ins_grp}" + (f" – {ins.get('group_max')}" if ins.get("group_max") else "") + "\n")
    lines.append(f"**Est. owners:** {data.get('owner_count', '?')}\n\n")

    # ── Data Sources ──
    lines.append(f"{sep}\n## 📡 Data Sources\n\n")
    for s in data_sources:
        status = "✔" if s.get("success") else "✗"
        note = f" — {s.get('note')}" if s.get("note") else ""
        lines.append(f"{status} {s.get('name','?')}{note}\n")

    # ── Confidence ──
    lines.append(f"\n**Overall OSINT Confidence:** {'🟢 High' if conf_pct >= 70 else '🟡 Medium' if conf_pct >= 50 else '🔴 Low'} ({conf_pct}%)\n\n")

    # ── Errors ──
    if errors:
        lines.append(f"\n⚠️ **Errors ({len(errors)}):**\n")
        for e in errors[:5]:
            lines.append(f"- {e}\n")

    return "".join(lines)


# ─── Main Orchestrator ──────────────────────────────────────────────────────

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
    data_sources.append({"name": "car-checking.com", "success": bool(cc.get("findings")), "note": cc.get("source","")})
    data_sources.append({"name": "gov.uk DVLA", "success": bool(dvla.get("findings")), "note": dvla.get("source","")})
    errors.extend(cc.get("errors", []))
    errors.extend(dvla.get("errors", []))

    # ── Extract fields from collected data ──
    raw = cc.get("raw_data", {})
    dvla_raw = dvla.get("raw_data", {})

    make = raw.get("make", "") or dvla_raw.get("make_dvla", "") or ""
    model = (raw.get("model", "") or "").strip()
    model = model.strip()
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
    plate = sys.argv[1] if len(sys.argv) > 1 else input("Enter plate: ").strip()
    if not plate:
        print("No plate entered.")
        sys.exit(1)
    run_vehicle_osint(plate, sys.argv[2] if len(sys.argv) > 2 else None)
