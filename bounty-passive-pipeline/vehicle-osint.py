#!/usr/bin/env python3
"""
vehicle-osint.py — Standalone Vehicle OSINT CLI (Python version)
Build: pyinstaller --onefile --console --name vehicle-osint vehicle-osint.py
Requires: pip install playwright cloudscraper colorama
         playwright install chromium
"""

import sys
import os
import re
import json
import time
import argparse
import tempfile
from pathlib import Path
from datetime import datetime
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

import cloudscraper

# Safe stdout/stderr init — handles headless/GUI environments
try:
    if sys.stdout is not None:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass
try:
    if sys.stderr is not None:
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

import colorama
colorama.init(autoreset=True)

RESET_ALL = colorama.Style.RESET_ALL
BRIGHT    = colorama.Style.BRIGHT
FRED      = colorama.Fore.RED
FYELLOW   = colorama.Fore.YELLOW
FGREEN    = colorama.Fore.GREEN
FCYAN     = colorama.Fore.CYAN

from playwright.sync_api import sync_playwright

__version__ = "1.0.0"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-GB,en;q=0.9",
}
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


# ═══════════════════════════════════════════════════════════════════════════════
# ADVISORY DATABASE
# ═══════════════════════════════════════════════════════════════════════════════

ADVISORY_DATABASE = [
    {"keywords": ["tyre worn close to legal limit","tyres worn close to legal limit"], "item": "Tyre(s) worn close to legal limit", "severity": "medium", "urgency": "soon", "cost_min": 90, "cost_max": 155, "labour_hours": 0.5, "notes": "MOT pass but retest due soon.", "parts_included": True},
    {"keywords": ["tyre worn on edge","tyres worn on edge","tyres below legal limit","tyre below legal limit","tyres worn below legal","tyre worn below legal"], "item": "Tyre(s) worn below legal limit", "severity": "critical", "urgency": "immediate", "cost_min": 90, "cost_max": 155, "labour_hours": 0.5, "notes": "ILLEGAL. Do not drive.", "parts_included": True},
    {"keywords": ["tyre slightly damaged","tyres slightly damaged","perishing","cracking on tyre","cracking on tyres"], "item": "Tyre(s) slightly damaged / perishing", "severity": "low", "urgency": "soon", "cost_min": 40, "cost_max": 80, "labour_hours": 0.25, "notes": "Monitor.", "parts_included": True},
    {"keywords": ["coil spring fractured","coil spring broken","coil spring split"], "item": "Coil spring fractured/broken", "severity": "critical", "urgency": "immediate", "cost_min": 250, "cost_max": 600, "labour_hours": 2.5, "notes": "Structural failure risk.", "parts_included": False},
    {"keywords": ["shock absorber leaking","shock absorber has a light leak","damper leaking","strut mount deteriorated","top mount failure"], "item": "Shock absorber / strut leaking", "severity": "high", "urgency": "soon", "cost_min": 150, "cost_max": 400, "labour_hours": 1.5, "notes": "Degraded handling and braking.", "parts_included": False},
    {"keywords": ["suspension arm corroded","suspension arm deteriorated","track control arm corroded","lower arm corroded","upper arm corroded"], "item": "Suspension arm / bush corroded", "severity": "medium", "urgency": "when_due", "cost_min": 100, "cost_max": 300, "labour_hours": 1.5, "notes": "Dangerous if ignored.", "parts_included": False},
    {"keywords": ["brake pipe corroded","brake pipe severely corroded","brake pipes corroded","corroded brake pipe"], "item": "Brake pipe corroded", "severity": "high", "urgency": "soon", "cost_min": 100, "cost_max": 250, "labour_hours": 1.5, "notes": "Can spread fast.", "parts_included": False},
    {"keywords": ["brake hose has slight corrosion","brake hose corroded","brake hose deteriorated","rubber hose cracked","flexible brake hose perished"], "item": "Brake hose corroded / perished", "severity": "medium", "urgency": "when_due", "cost_min": 60, "cost_max": 140, "labour_hours": 1.0, "notes": "Replace in pairs.", "parts_included": False},
    {"keywords": ["brake cable damaged","brake cable frayed","handbrake cable damaged","parking brake cable damaged","rear brake cable damaged"], "item": "Brake cable damaged", "severity": "medium", "urgency": "when_due", "cost_min": 60, "cost_max": 140, "labour_hours": 1.0, "notes": "Affects handbrake operation.", "parts_included": False},
    {"keywords": ["brake pad worn","brake pads worn","front brake pads worn","rear brake pads worn","brake pad excessive wear","pad worn close to wire"], "item": "Brake pad(s) worn", "severity": "high", "urgency": "immediate", "cost_min": 80, "cost_max": 200, "labour_hours": 1.0, "notes": "Replace in pairs.", "parts_included": False},
    {"keywords": ["brake disc worn","brake discs worn","brake disc in poor condition","rear brake disc scored","brake disc below minimum thickness"], "item": "Brake disc worn / scored", "severity": "high", "urgency": "soon", "cost_min": 100, "cost_max": 250, "labour_hours": 1.5, "notes": "Replace with pads.", "parts_included": False},
    {"keywords": ["abs sensor defective","abs sensor not working","abs warning light","anti-lock brake system warning"], "item": "ABS sensor defective", "severity": "medium", "urgency": "when_due", "cost_min": 100, "cost_max": 250, "labour_hours": 1.0, "notes": "Safety-critical.", "parts_included": False},
    {"keywords": ["steering rack gaiter damaged","steering rack gaiter split","rack gaiter perished","steering rack boot split"], "item": "Steering rack gaiter split", "severity": "high", "urgency": "soon", "cost_min": 100, "cost_max": 250, "labour_hours": 1.5, "notes": "If ignored -> rack replacement.", "parts_included": False},
    {"keywords": ["track rod end worn","track rod end excessive play","tie rod end worn","steering linkage worn","steering ball joint worn"], "item": "Steering ball joint / track rod end worn", "severity": "critical", "urgency": "immediate", "cost_min": 100, "cost_max": 250, "labour_hours": 1.5, "notes": "Steering could fail.", "parts_included": False},
    {"keywords": ["exhaust emitting excessive smoke","exhaust smokes on tickover","excessive smoke from exhaust","engine emitting blue smoke","engine emitting white smoke"], "item": "Engine smoking (blue/white)", "severity": "high", "urgency": "soon", "cost_min": 200, "cost_max": 1200, "labour_hours": 4.0, "notes": "Blue = oil burn. White = coolant/head gasket.", "parts_included": False},
    {"keywords": ["catalytic converter defective","catalytic converter missing","cat removed","exhaust catalytic converter below threshold"], "item": "Catalytic converter defective", "severity": "high", "urgency": "soon", "cost_min": 300, "cost_max": 1200, "labour_hours": 2.0, "notes": "MOT fail for emissions.", "parts_included": False},
    {"keywords": ["dpf warning light","dpf blocked","dpf regeneration required","dpf fault","diesel particulate filter warning"], "item": "DPF warning / blocked", "severity": "high", "urgency": "soon", "cost_min": 200, "cost_max": 1500, "labour_hours": 3.0, "notes": "Forced regen or replacement.", "parts_included": False},
    {"keywords": ["emissions exceed limit","lambda sensor defective","lambda sensor malfunction","air fuel ratio sensor defective","o2 sensor defective","sensor for emissions defective"], "item": "Emissions sensor / lambda defective", "severity": "medium", "urgency": "when_due", "cost_min": 150, "cost_max": 400, "labour_hours": 1.5, "notes": "MOT fail risk.", "parts_included": False},
    {"keywords": ["engine oil level low","engine oil warning","oil warning light","oil consumption excessive"], "item": "Engine oil level low / consuming", "severity": "high", "urgency": "soon", "cost_min": 50, "cost_max": 300, "labour_hours": 0.5, "notes": "Could indicate ring wear or gasket leak.", "parts_included": True},
    {"keywords": ["sub-frame corroded","subframe corroded","sub frame corroded","underbody corroded","chassis corroded","floor pan corroded"], "item": "Sub-frame / chassis corroded", "severity": "high", "urgency": "when_due", "cost_min": 200, "cost_max": 1000, "labour_hours": 4.0, "notes": "Structural -- MOT fail if serious.", "parts_included": False},
    {"keywords": ["corrosion to underside","surface corrosion to underside","corrosion to suspension","corrosion to body","corrosion to structure"], "item": "Generalised corrosion / rust", "severity": "medium", "urgency": "when_due", "cost_min": 50, "cost_max": 500, "labour_hours": 2.0, "notes": "Monitor for spread.", "parts_included": True},
    {"keywords": ["headlamp lens slightly defective","headlamp lens cracked","headlamp lens deteriorated","headlight lens cracked","dipped beam headlamp defective","main beam headlamp defective"], "item": "Headlamp lens defective", "severity": "low", "urgency": "advisory", "cost_min": 0, "cost_max": 60, "labour_hours": 0.25, "notes": "MOT fail if affecting light output.", "parts_included": False},
    {"keywords": ["rear registration plate lamp defective","number plate lamp not working","license plate lamp defective"], "item": "Number plate lamp defective", "severity": "low", "urgency": "advisory", "cost_min": 0, "cost_max": 30, "labour_hours": 0.25, "notes": "MOT fail item.", "parts_included": True},
    {"keywords": ["stop lamp defective","brake light not working","stop light defective","rear lamp not working"], "item": "Brake / stop lamp defective", "severity": "high", "urgency": "soon", "cost_min": 0, "cost_max": 60, "labour_hours": 0.25, "notes": "Safety hazard.", "parts_included": True},
    {"keywords": ["wheel bearing noisy","wheel bearing excessive play","wheel bearing worn","front wheel bearing noisy","rear wheel bearing noisy"], "item": "Wheel bearing worn / noisy", "severity": "medium", "urgency": "when_due", "cost_min": 80, "cost_max": 250, "labour_hours": 1.5, "notes": "MOT advisory if noisy.", "parts_included": False},
    {"keywords": ["alloy wheel damaged","alloy wheel cracked","wheel damaged not allowing bead","tyre not seating","wheel rim cracked"], "item": "Wheel / alloy rim damaged", "severity": "low", "urgency": "advisory", "cost_min": 0, "cost_max": 200, "labour_hours": 0.5, "notes": "MOT advisory.", "parts_included": True},
    {"keywords": ["wiper blade deteriorated","wiper blade not cleaning","windscreen wiper deteriorated","wiper rubber perished"], "item": "Wiper blade(s) deteriorated", "severity": "low", "urgency": "advisory", "cost_min": 10, "cost_max": 40, "labour_hours": 0.1, "notes": "DIY: under £5.", "parts_included": True},
    {"keywords": ["windscreen chipped","windscreen cracked","screen cracked","windscreen stone chip cracked"], "item": "Windscreen cracked / chipped", "severity": "medium", "urgency": "when_due", "cost_min": 0, "cost_max": 300, "labour_hours": 1.0, "notes": "Chip repair ~£40-60. Full replacement £200-300.", "parts_included": False},
    {"keywords": ["seat belt damaged","seat belt not working correctly","seat belt tensioner defective","seat belt webbing frayed"], "item": "Seat belt defective", "severity": "critical", "urgency": "immediate", "cost_min": 100, "cost_max": 500, "labour_hours": 2.0, "notes": "Life-threatening.", "parts_included": False},
    {"keywords": ["anti-roll bar linkage ball joint excessively worn","drop link worn","anti roll bar link worn","sway bar link worn"], "item": "Anti-roll bar link / drop link worn", "severity": "high", "urgency": "soon", "cost_min": 50, "cost_max": 150, "labour_hours": 1.0, "notes": "Affects handling.", "parts_included": False},
    {"keywords": ["engine mount deteriorated","engine mount broken","torque mount broken","engine support mount failed"], "item": "Engine mount / torque arm deteriorated", "severity": "medium", "urgency": "when_due", "cost_min": 100, "cost_max": 350, "labour_hours": 2.0, "notes": "Vibrations if ignored.", "parts_included": False},
    {"keywords": ["clutch slipping","clutch wear","clutch judder","clutch biting point high","clutch replacement recommended"], "item": "Clutch slipping / worn", "severity": "high", "urgency": "when_due", "cost_min": 400, "cost_max": 900, "labour_hours": 4.0, "notes": "DMF may double cost.", "parts_included": False},
    {"keywords": ["gearbox oil leaking","gearbox leak","transmission housing leak","gearbox oil level low"], "item": "Gearbox / transmission leak", "severity": "medium", "urgency": "when_due", "cost_min": 50, "cost_max": 400, "labour_hours": 2.0, "notes": "Can escalate to gearbox failure.", "parts_included": False},
    {"keywords": ["driveshaft gaiter split","driveshaft boot split","cv boot split","constant velocity joint boot split"], "item": "CV / driveshaft boot split", "severity": "high", "urgency": "soon", "cost_min": 80, "cost_max": 300, "labour_hours": 2.0, "notes": "Joint fails without grease.", "parts_included": False},
    {"keywords": ["water pump leaking","water pump seal leaking","coolant leak from water pump","engine cooling system leak"], "item": "Coolant / water pump leak", "severity": "high", "urgency": "soon", "cost_min": 100, "cost_max": 500, "labour_hours": 2.5, "notes": "Overheating = engine death.", "parts_included": False},
    {"keywords": ["radiator leaking","radiator core leaking","cooling fan not working","thermostat not working","thermostat stuck open"], "item": "Cooling system fault", "severity": "high", "urgency": "soon", "cost_min": 80, "cost_max": 400, "labour_hours": 1.5, "notes": "Thermostat or radiator.", "parts_included": False},
    {"keywords": ["steering column lock engaged","steering lock malfunction","steering lock not releasing","steering lock fault"], "item": "Steering lock fault", "severity": "critical", "urgency": "immediate", "cost_min": 100, "cost_max": 400, "labour_hours": 1.0, "notes": "Car may not start.", "parts_included": False},
    {"keywords": ["inhibitor switch defective","gear selector not working","automatic transmission fault","gear position switch defective"], "item": "Gear selector / inhibitor switch", "severity": "medium", "urgency": "when_due", "cost_min": 80, "cost_max": 300, "labour_hours": 1.5, "notes": "Car may not go into gear.", "parts_included": False},
    {"keywords": ["high mileage indicator","mileage discrepancy","mileage inconsistent","odometer reading unreliable"], "item": "Mileage discrepancy / clock concern", "severity": "critical", "urgency": "immediate", "cost_min": 0, "cost_max": 0, "labour_hours": 0, "notes": "Potential clocking -- walk away or heavily discount.", "parts_included": False},
    {"keywords": ["hybrid system warning","high voltage system fault","hybrid battery degraded","hybrid battery fault"], "item": "Hybrid battery / system fault", "severity": "critical", "urgency": "when_due", "cost_min": 500, "cost_max": 4000, "labour_hours": 4.0, "notes": "Hybrid battery replacement £1500-4000.", "parts_included": False},
    {"keywords": ["advisory ","minor deterioration","slight wear","nearest to limit","slight roughness","slight play","signs of wear","wear in bush"], "item": "General wear -- monitoring advised", "severity": "low", "urgency": "advisory", "cost_min": 0, "cost_max": 200, "labour_hours": 0, "notes": "Not a failure.", "parts_included": False},
]


# ═══════════════════════════════════════════════════════════════════════════════
# VALUATION ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

def clean_advisory_text(text: str) -> str:
    t = re.sub(r'\bMOT\s*#?\d*\b', ' ', text, flags=re.IGNORECASE)
    t = re.sub(r'\bMOT test\b', ' ', t, flags=re.IGNORECASE)
    t = re.sub(r'\b\d+\.\d+\.\d+\s*\([a-z]\)\s*\([i]+\)\)', ' ', t)
    t = re.sub(r'\b\d+\.\d+\.\d+\s*\([a-z]\)', ' ', t)
    t = re.sub(r'\b\d+\.\d+\s*\([a-z]\s*\([i]+\)\)', ' ', t)
    t = re.sub(r'\b(nearside|offside|both|front|rear|ns|os)\b', ' ', t, flags=re.IGNORECASE)
    t = re.sub(r'\b\d+(?:\.\d+)?\s*(?:mm|cm|mph|bhp|cc|rpm|mpg|km|l|kg)\b', ' ', t)
    t = re.sub(r'\b\d{3}\/\d{2}[R\-]\d{2}\b', ' ', t)
    t = re.sub(r',', ' ', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t


def match_advisories(cleaned_text: str) -> list:
    lower = cleaned_text.lower()
    matched = []
    for entry in ADVISORY_DATABASE:
        for kw in entry["keywords"]:
            if kw.lower() in lower:
                matched.append(dict(entry))
                break
    return matched


def estimate_advisories(advisory_notes: list, mot_failures: int, mot_total: int, year: int, engine_cc: int, fuel_type: str) -> list:
    cleaned = clean_advisory_text(" ".join(advisory_notes))
    matched = match_advisories(cleaned)
    if not matched and advisory_notes:
        matched.append({
            "item": "Miscellaneous advisory (see notes)",
            "severity": "medium", "urgency": "when_due",
            "cost_min": 50, "cost_max": 500, "labour_hours": 1.0,
            "notes": f'Could not classify: "{advisory_notes[0][:80]}". Assessment recommended.',
            "parts_included": False
        })
    return matched


def estimate_value(make: str, model: str, year: int, mileage: int | None, condition: str) -> dict:
    age = datetime.now().year - year
    make_upper = make.upper()

    def depreciated_base(base: float) -> float:
        if age <= 5: return base * (0.80 ** age)
        if age <= 10: return base * (0.80 ** 5) * (0.85 ** (age - 5))
        if age <= 15: return base * (0.80 ** 5) * (0.85 ** 5) * (0.88 ** (age - 10))
        return base * (0.80 ** 5) * (0.85 ** 5) * (0.88 ** 5) * (0.93 ** (age - 15))

    cond_mult = {"poor": 0.50, "fair": 0.70, "good": 1.0}
    cond = cond_mult.get(condition, 0.70)

    mileage_adj = 0
    if mileage is not None:
        avg_miles = 10000
        expected = age * avg_miles
        diff = mileage - expected
        age_mult = min(2.0, 1 + age * 0.04)
        if diff > 30000: mileage_adj = round(-400 * age_mult)
        elif diff > 15000: mileage_adj = round(-200 * age_mult)
        elif diff > 0: mileage_adj = round(-100 * age_mult)
        elif diff < -15000: mileage_adj = round(250 * age_mult)
        elif diff < 0: mileage_adj = round(100 * age_mult)

    base_retail = 5000
    brand_note = ""
    if re.search(r'VAUXHALL|OPEL', make_upper):
        base_retail, brand_note = 6000, " (Vauxhall/Opel)"
    elif re.search(r'FORD', make_upper):
        base_retail, brand_note = 6500, " (Ford)"
    elif re.search(r'TOYOTA|HONDA|MAZDA|SUBARU', make_upper):
        base_retail, brand_note = 8000, " (Japanese -- holds value)"
    elif re.search(r'BMW|AUDI|MERCEDES', make_upper):
        base_retail, brand_note = 10000, " (Premium German)"
    elif re.search(r'VW|VOLKSWAGEN', make_upper):
        base_retail, brand_note = 7500, " (VW)"
    elif re.search(r'JAGUAR|LAND ROVER|RANGE ROVER', make_upper):
        base_retail, brand_note = 12000, " (Premium/Luxury)"
    elif re.search(r'PEUGEOT|CITROEN|RENAULT|NISSAN|SEAT|SKODA', make_upper):
        base_retail, brand_note = 5500, " (Mass-market European)"

    raw_min = depreciated_base(base_retail) * cond * 0.75
    raw_max = depreciated_base(base_retail) * cond
    base_floor = 700 if age >= 15 else 500 if age >= 10 else 400
    val_min = max(round(raw_min + mileage_adj), base_floor)
    val_max = max(round(raw_max + mileage_adj), val_min)
    if age >= 15:
        val_min = max(val_min, 700)
        val_max = max(val_max, 1200)

    notes = f"{brand_note} Age: {age}yr{'; Mileage: ' + f'{mileage:,} mi' if mileage else ''}; Condition: {condition}."
    return {"min": val_min, "max": val_max, "notes": notes}


def generate_vehicle_valuation(make: str, model: str, year: int, mileage: int | None, fuel_type: str, advisories: list, mot_failures: int, mot_total: int) -> dict:
    has_critical = any(a["severity"] == "critical" for a in advisories)
    has_high = any(a["severity"] == "high" for a in advisories)
    serious_count = sum(1 for a in advisories if a["severity"] in ("critical", "high"))

    condition = "poor" if has_critical else "fair" if has_high else "good" if len(advisories) <= 2 else "fair"
    value = estimate_value(make, model, year, mileage, condition)
    age = datetime.now().year - year
    diesel = bool(re.search(r'diesel|cdti|tdi|dti', fuel_type, re.I))

    if serious_count >= 2:
        months, lifespan_assessment = 3, f"{serious_count} serious critical/high-severity advisories. Dangerous -- do not rely on this car without immediate repairs."
    elif serious_count >= 1:
        months, lifespan_assessment = 6, f"{serious_count} serious advisory present -- likely MOT fail next time. Budget for retest + repairs within 6 months."
    elif len(advisories) >= 8:
        months, lifespan_assessment = 12, f"Many advisories ({len(advisories)}) -- mostly wear items but accumulating. Budget for tyres, brakes, suspension in next 12 months."
    elif diesel and age >= 15:
        months, lifespan_assessment = 18, f"Diesel at {age} years -- DPF, turbo, and clutch are the main risks."
    elif age >= 15:
        months, lifespan_assessment = 18, f"{age}-year-old car in reasonable condition. Standard wear items in the next 12-18 months."
    else:
        months, lifespan_assessment = 24, f"Car in reasonable condition. Standard wear items in 1-2 years."

    total_adv_min = sum(a["cost_min"] for a in advisories)
    total_adv_max = sum(a["cost_max"] for a in advisories)
    repair_penalty_min = round(total_adv_min * 0.7)
    repair_penalty_max = round(total_adv_max * 0.7)
    val_adv_min = max(300, value["min"] - repair_penalty_max)
    val_adv_max = max(400, value["max"] - repair_penalty_min)
    mot_fail_risk = "high" if serious_count >= 3 else "medium" if serious_count >= 1 else "low"

    if has_critical:
        recommendation = f"Critical issues found -- do not buy at asking price. Either walk away or negotiate minimum £{total_adv_min:,} off. Serious safety concerns."
    elif total_adv_max > value["max"] * 0.5:
        recommendation = f"Repair costs (up to £{total_adv_max:,}) exceed half the car's value. Negotiate hard or avoid."
    elif serious_count >= 1:
        recommendation = f"High-severity advisories present. Negotiate at least £{total_adv_min:,} off asking price. Budget total £{total_adv_min+200:,}-£{total_adv_max+400:,} including retest."
    else:
        recommendation = f"Advisories are manageable wear items. Price accordingly -- aim to save at least the advisory cost in negotiation."

    return {
        "make": make, "model": model, "year": year,
        "current_value_min": value["min"], "current_value_max": value["max"],
        "value_with_advisories_min": val_adv_min, "value_with_advisories_max": val_adv_max,
        "expected_months_remaining": months,
        "mot_fail_risk": mot_fail_risk,
        "total_advisory_cost_min": total_adv_min, "total_advisory_cost_max": total_adv_max,
        "lifespan_assessment": lifespan_assessment,
        "recommendation": recommendation,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# HTTP HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def http_get(url: str, timeout: int = 15000) -> str:
    req = Request(url, headers=HEADERS)
    try:
        resp = urlopen(req, timeout=timeout / 1000)
        return resp.read().decode("utf-8", errors="replace")
    except (URLError, HTTPError, TimeoutError) as e:
        raise Exception(f"HTTP error for {url}: {e}")


def delay(seconds: float):
    time.sleep(seconds)


# ═══════════════════════════════════════════════════════════════════════════════
# PLATE TYPE DETECTION
# ═══════════════════════════════════════════════════════════════════════════════

def detect_plate_type(plate: str) -> str:
    clean = re.sub(r'\s', '', plate).upper()
    if re.match(r'^[A-HJ-NPR-Z0-9]{17}$', clean, re.I): return 'VIN'
    if re.match(r'^[A-Z]{2}\d{2}[A-Z]{3}$', clean): return 'UK'
    if re.match(r'^[A-Z]\d{1,3}[A-Z]{2,3}$', clean): return 'UK'
    if re.match(r'^[A-Z]{3}\d{1,3}[A-Z]{2}$', clean): return 'UK'
    if re.match(r'^[A-Z]{2}\d{2} [A-Z]{3}$', clean): return 'UK'
    if re.match(r'^[A-Z]{3} ?\d{3}$', clean): return 'UK'
    if re.match(r'^[A-Z0-9]{3,8}$', clean, re.I): return 'US'
    return 'UNKNOWN'


# ═══════════════════════════════════════════════════════════════════════════════
# COLLECTORS
# ═══════════════════════════════════════════════════════════════════════════════

def collect_dvla(plate: str, pw) -> dict:
    result = {"findings": [], "errors": [], "raw_data": {}}
    browser = None
    try:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME_PATH)
        page = browser.new_page()
        page.goto("https://vehicleenquiry.service.gov.uk/", wait_until="networkidle", timeout=20000)
        page.locator("button", has_text=re.compile(r"Reject", re.I)).first.click()
        page.wait_for_load_state("networkidle", timeout=10000)
        page.locator("#wizard_vehicle_enquiry_capture_vrn_vrn").fill(plate)
        page.get_by_role("button", name="Continue").click()
        page.wait_for_load_state("networkidle", timeout=20000)

        rows = page.locator(".govuk-summary-list__row")
        for i in range(rows.count()):
            row = rows.nth(i)
            key_el = row.locator(".govuk-summary-list__key")
            val_el = row.locator(".govuk-summary-list__value")
            if key_el.count() > 0 and val_el.count() > 0:
                key = key_el.text_content().strip()
                val = val_el.text_content().strip()
                if key and val:
                    result["raw_data"][key] = val

        make_key = next((k for k in result["raw_data"] if re.search(r'make', k, re.I)), None)
        colour_key = next((k for k in result["raw_data"] if re.search(r'colour', k, re.I)), None)
        if make_key: result["findings"].append({"source": "GovUK-DVLA", "field": "make", "value": result["raw_data"][make_key], "confidence": 95})
        if colour_key: result["findings"].append({"source": "GovUK-DVLA", "field": "colour", "value": result["raw_data"][colour_key], "confidence": 95})
        tax_key = next((k for k in result["raw_data"] if re.search(r'tax\s*status', k, re.I)), None)
        if tax_key: result["findings"].append({"source": "GovUK-DVLA", "field": "tax_status", "value": result["raw_data"][tax_key], "confidence": 95})
        mot_key = next((k for k in result["raw_data"] if re.search(r'MOT\s*status', k, re.I)), None)
        if mot_key: result["findings"].append({"source": "GovUK-DVLA", "field": "mot_status", "value": result["raw_data"][mot_key], "confidence": 95})
        reg_key = next((k for k in result["raw_data"] if re.search(r'first\s*registered', k, re.I)), None)
        if reg_key: result["findings"].append({"source": "GovUK-DVLA", "field": "first_reg_date", "value": result["raw_data"][reg_key], "confidence": 90})
        if not result["raw_data"]: result["errors"].append("DVLA returned empty result")
    except Exception as e:
        result["errors"].append(f"DVLA lookup failed: {e}")
    finally:
        if browser: browser.close()
    return result


def collect_car_check(plate: str, pw) -> dict:
    result = {"findings": [], "errors": [], "raw_data": {}}
    browser = None
    try:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME_PATH)
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            extra_http_headers={"Accept-Language": "en-GB,en;q=0.9"}
        )
        page = ctx.new_page()
        page.on("dialog", lambda d: d.accept())
        page.goto("https://www.car-checking.com/", wait_until="domcontentloaded", timeout=20000)
        page.wait_for_selector("#subForm1, form", timeout=15000)
        page.wait_for_timeout(2000)
        reg_input = page.locator("#subForm1")
        if reg_input.count() == 0:
            result["errors"].append("car-checking.com: reg input not found")
            return result
        reg_input.fill(plate)
        page.locator("button[type='submit']").first.click()
        page.wait_for_timeout(5000)
        body_text = page.text_content("body") or ""
        if len(body_text.strip()) < 50:
            page.wait_for_timeout(5000)
            body_text = page.text_content("body") or ""
        raw_text = body_text[:5000]
        result["raw_data"]["raw_text"] = raw_text
        if len(body_text.strip()) < 50:
            result["errors"].append("car-checking.com: no report data returned")
            return result

        spec_pairs = [
            ("Make","make"),("Model","model"),("Colour","colour"),
            ("Year of manufacture","year"),("Gearbox","gearbox"),
            ("Engine capacity","engine_capacity"),("Fuel type","fuel_type"),
        ]
        for label, field in spec_pairs:
            m = re.search(rf'{re.escape(label)}\s*\n\s*([\S ]{2,80})', body_text, re.I)
            if m:
                snippet = m.group(1).strip().replace(' ', ' ')
                if 1 < len(snippet) < 100:
                    result["raw_data"][field] = snippet

        expiry_m = re.search(r'MOT expiry date[\s\n]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', body_text, re.I)
        if expiry_m:
            result["findings"].append({"source": "car-checking.com", "field": "mot_expiry", "value": expiry_m.group(1), "confidence": 95})
            result["raw_data"]["mot_expiry"] = expiry_m.group(1)
        pass_rate_m = re.search(r'MOT pass rate[\s\n]+(\d+)\s*%', body_text, re.I)
        if pass_rate_m:
            result["findings"].append({"source": "car-checking.com", "field": "mot_pass_rate", "value": pass_rate_m.group(1) + "%", "confidence": 90})
        passed_m = re.search(r'MOT passed[\s\n]+(\d+)', body_text, re.I)
        if passed_m:
            result["findings"].append({"source": "car-checking.com", "field": "mot_passed", "value": passed_m.group(1), "confidence": 90})
        failed_m = re.search(r'Failed MOT tests[\s\n]+(\d+)', body_text, re.I)
        if failed_m:
            result["findings"].append({"source": "car-checking.com", "field": "mot_failed", "value": failed_m.group(1), "confidence": 90})
        mileage_timeline = []
        mot_block_re = re.compile(r'MOT #\d+[\s\S]*?(?=MOT #\d+|$)', re.I)
        for block in mot_block_re.finditer(body_text):
            m = re.search(r'(\d{5,6})\s*(?:mi\.?|miles\b|mileage)', block.group(), re.I)
            if m: mileage_timeline.append(int(m.group(1)))
        if mileage_timeline:
            mileage_timeline.sort(reverse=True)
            result["raw_data"]["mileage_timeline"] = mileage_timeline
            result["findings"].append({"source": "car-checking.com", "field": "current_mileage", "value": f"{mileage_timeline[0]:,} mi", "confidence": 85})
        vin_m = re.search(r'[A-HJ-NPR-Z0-9]{17}', raw_text, re.I)
        if vin_m:
            result["raw_data"]["vin"] = vin_m.group(0).upper()
            result["findings"].append({"source": "car-checking.com", "field": "vin", "value": vin_m.group(0).upper(), "confidence": 80})
        advisory_notes = []
        for m in re.finditer(r'(?:^|\s)(Advice|Advisory)\s+([^\n]{10,200})', body_text, re.I | re.M):
            item = m.group(2).strip()
            if len(item) > 5: advisory_notes.append(item)
        if advisory_notes: result["raw_data"]["advisory_notes"] = advisory_notes

    except Exception as e:
        result["errors"].append(f"car-checking.com failed: {e}")
    finally:
        if browser: browser.close()
    delay(0.5)
    return result


def collect_gov_uk_mot(plate: str, pw) -> dict:
    result = {"findings": [], "errors": [], "raw_data": {}}
    scraper = cloudscraper.create_scraper()
    try:
        resp = scraper.get("https://www.gov.uk/check-mot-history", timeout=15)
        if resp.status_code != 200: raise Exception(f"HTTP {resp.status_code}")
        body_text = resp.text
        token_m = re.search(r'<input[^>]+name=["\']csrf-token["\'][^>]+value=["\']([^"\']+)["\']', body_text, re.I)
        token_m2 = re.search(r'<meta[^>]+name=["\']csrf-token["\'][^>]+content=["\']([^"\']+)["\']', body_text, re.I)
        token = (token_m.group(1) if token_m else (token_m2.group(1) if token_m2 else ""))
        post_data = {"vrm": plate}
        if token: post_data["csrf-token"] = token
        resp = scraper.post("https://www.gov.uk/check-mot-history", data=post_data, timeout=15, allow_redirects=True)
        body_text = resp.text
        result["raw_data"]["raw_text"] = body_text[:4000]
        expiry_m = re.search(r'expiry date[\s\n]*</dt[^>]*>[\s\S]{0,200}?<dd[^>]*>([\d\/\-]+)', body_text, re.I)
        if not expiry_m: expiry_m = re.search(r'expiry date[\s\n]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', body_text, re.I)
        if expiry_m:
            result["findings"].append({"source": "GovUK-MOT", "field": "mot_expiry", "value": expiry_m.group(1), "confidence": 95})
            result["raw_data"]["mot_expiry"] = expiry_m.group(1)
        test_date_m = re.search(r'test date[\s\n]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', body_text, re.I)
        if test_date_m: result["findings"].append({"source": "GovUK-MOT", "field": "last_mot_date", "value": test_date_m.group(1), "confidence": 95})
        mileage_m = re.search(r'(\d{5,6})\s*(?:miles|mi)', body_text, re.I)
        if mileage_m: result["findings"].append({"source": "GovUK-MOT", "field": "last_odometer", "value": mileage_m.group(1) + " miles", "confidence": 90})
        if re.search(r'MOT pass|PASSED|<dt[^>]*>Result[^<]*</dt[^>]*>[\s\S]{0,50}?PASS', body_text, re.I):
            result["findings"].append({"source": "GovUK-MOT", "field": "mot_result", "value": "PASS", "confidence": 95})
        elif re.search(r'MOT fail|FAILED', body_text, re.I):
            result["findings"].append({"source": "GovUK-MOT", "field": "mot_result", "value": "FAIL", "confidence": 95})
    except Exception as e:
        try:
            browser = pw.chromium.launch(headless=True, executable_path=CHROME_PATH)
            page = browser.new_page()
            page.goto("https://www.gov.uk/check-mot-history", wait_until="domcontentloaded", timeout=20000)
            page.wait_for_timeout(3000)
            body_text = page.text_content("body") or ""
            if re.search(r'cloudflare|checking your browser', body_text, re.I): raise Exception("CloudFlare challenge")
            page.locator("#vrm").wait_for(state="visible", timeout=10000)
            page.locator("#vrm").fill(plate)
            page.locator("button[type=submit]").filter(has_text=re.compile(r"check|find", re.I)).first.click()
            page.wait_for_load_state("networkidle", timeout=30000)
            page.wait_for_timeout(2000)
            body_text = page.text_content("body") or ""
            result["raw_data"]["raw_text"] = body_text[:4000]
            expiry_m = re.search(r'expiry date[\s\n]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', body_text, re.I)
            if expiry_m:
                result["findings"].append({"source": "GovUK-MOT", "field": "mot_expiry", "value": expiry_m.group(1), "confidence": 95})
                result["raw_data"]["mot_expiry"] = expiry_m.group(1)
            if re.search(r'MOT pass|PASSED', body_text): result["findings"].append({"source": "GovUK-MOT", "field": "mot_result", "value": "PASS", "confidence": 95})
            elif re.search(r'MOT fail|FAILED', body_text): result["findings"].append({"source": "GovUK-MOT", "field": "mot_result", "value": "FAIL", "confidence": 95})
        except Exception as e2:
            result["errors"].append(f"Gov.uk MOT (cloudscraper): {e} | Playwright fallback: {e2}")
        finally:
            if browser: browser.close()
            return result
    delay(0.3)
    return result


def collect_nhtsa_vin(vin: str) -> dict:
    result = {"findings": [], "errors": [], "raw_data": {}}
    try:
        url = f"https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/{vin}?format=json"
        text = http_get(url, timeout=15000)
        data = json.loads(text)
        if not data.get("Results"):
            result["errors"].append("NHTSA: empty response"); return result
        r = data["Results"][0]
        fields = [
            ("Make","make"),("Model","model"),("Model Year","year"),
            ("Body Class","body_type"),("Engine Displacement (CC)","engine_cc"),
            ("Fuel Type - Primary","fuel_type"),("Transmission","transmission"),
        ]
        for nhtsa_key, field_name in fields:
            val = r.get(nhtsa_key, "")
            if val and val.strip() not in ("", "Not Applicable", "0"):
                val = val.strip()
                result["raw_data"][field_name] = val
                result["findings"].append({"source": "NHTSA-vPIC", "field": field_name, "value": val, "confidence": 90})
        if not result["findings"]: result["errors"].append("NHTSA: VIN decoded but no usable data")
    except Exception as e:
        result["errors"].append(f"NHTSA vPIC lookup failed: {e}")
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# REPORT GENERATOR
# ═══════════════════════════════════════════════════════════════════════════════

def sev_emoji(severity: str) -> str:
    return {"critical": "[CRIT]", "high": "[HIGH]", "medium": "[MED]", "low": "[LOW]"}.get(severity, "[?]")
def sev_char(severity: str) -> str:
    return {"critical": "X", "high": "!", "medium": "~", "low": "-"}.get(severity, "?")


def generate_markdown_report(plate: str, dvla_data: dict, carcheck_data: dict, govuk_data: dict, valuation: dict, errors: list) -> str:
    lines = []
    today = datetime.now().strftime("%Y-%m-%d")
    now = datetime.now().isoformat()

    cc_raw = carcheck_data.get("raw_data", {})
    dvla_raw = dvla_data.get("raw_data", {})

    model_raw = cc_raw.get("model", "")
    noise_prefixes = ["Colour","Year of manufacture","Top speed","0 to ","Gearbox","Engine & fuel consumption","Power","Torque","Engine capacity","Cylinders","Fuel type","Consumption","CO2"]
    model_clean = model_raw
    for prefix in noise_prefixes:
        idx = model_clean.find(prefix)
        if idx > 2: model_clean = model_clean[:idx].strip()
    model_clean = re.sub(r'\s+\d+\s*$', '', model_clean).replace('  ', ' ').strip()[:60]

    make = cc_raw.get("make", "") or dvla_raw.get("Make", "")
    year_str = cc_raw.get("year", "0")
    year = int(re.sub(r'\D', '', year_str)) if re.sub(r'\D', '', year_str) else 0
    colour = cc_raw.get("colour", "") or dvla_raw.get("Colour", "")
    fuel_type = cc_raw.get("fuel_type", "")
    engine_cc_str = cc_raw.get("engine_capacity", "0")
    engine_cc = int(re.sub(r'\D', '', engine_cc_str)) if re.sub(r'\D', '', engine_cc_str) else 0
    gearbox = cc_raw.get("gearbox", "")
    mot_expiry = cc_raw.get("mot_expiry", "") or govuk_data.get("raw_data", {}).get("mot_expiry", "")

    mot_passed = 0
    for f in carcheck_data.get("findings", []):
        if f["field"] == "mot_passed": mot_passed = int(f["value"]); break
    mot_failed = 0
    for f in carcheck_data.get("findings", []):
        if f["field"] == "mot_failed": mot_failed = int(f["value"]); break

    advisory_notes = cc_raw.get("advisory_notes", [])
    mileage_timeline = cc_raw.get("mileage_timeline", [])
    current_mileage = mileage_timeline[0] if mileage_timeline else None
    mot_total = mot_passed + mot_failed
    mot_status = "Valid" if mot_expiry else "No MOT data"

    advisories = []
    if advisory_notes:
        advisories = estimate_advisories(advisory_notes, mot_failed, mot_total, year or 2005, engine_cc, fuel_type or "DIESEL")

    crit = sum(1 for a in advisories if a["severity"] == "critical")
    high = sum(1 for a in advisories if a["severity"] == "high")
    med = sum(1 for a in advisories if a["severity"] == "medium")
    low_s = sum(1 for a in advisories if a["severity"] == "low")

    risk_rating = "HIGH" if crit > 0 or high > 2 else "MODERATE" if high > 0 or med >= 3 else "LOW"
    val_min = valuation.get("current_value_min", 0)
    val_max = valuation.get("current_value_max", 0)
    val_adv_min = valuation.get("value_with_advisories_min", 0)
    val_adv_max = valuation.get("value_with_advisories_max", 0)

    lines.append(f"# OSINT Report -- Vehicle: {plate}\n")
    lines.append(f"**Generated:** {now}  \n")
    lines.append(f"**Type:** UK Registration  \n\n## 1. Vehicle Header Card\n```")
    lines.append(f"  Registration: {plate}")
    lines.append(f"  Make: {make or 'Unknown'}")
    lines.append(f"  Model: {model_clean or 'Unknown'}")
    lines.append(f"  Year: {year or '?'}")
    lines.append(f"  Colour: {colour or 'Unknown'}")
    lines.append(f"  Fuel Type: {fuel_type or 'Unknown'}")
    lines.append(f"  Engine: {engine_cc_str} cc" if engine_cc_str != "0" else "  Engine: N/A")
    lines.append(f"  Gearbox: {gearbox or 'Unknown'}")
    if current_mileage: lines.append(f"  Current Mileage: {current_mileage:,} mi")
    lines.append("```\n")

    lines.append("## 2. Vehicle Status\n```")
    lines.append(f"  DVLA: {'Registered' if dvla_raw else 'No data'}")
    lines.append(f"  MOT status: {mot_status}" + (f" (expires {mot_expiry})" if mot_expiry else ""))
    lines.append(f"  MOT: {mot_passed} pass / {mot_failed} fail out of {mot_total} tests")
    lines.append("```\n")

    cond_label = "Neglect indicators" if crit > 0 or high >= 2 else "Average condition" if high > 0 or med >= 3 else "Well maintained"
    lines.append(f"## 3. Risk Indicators\n\n**Overall Condition:** {cond_label}\n")
    lines.append(f"| Severity | Count |")
    lines.append("| --- | --- |")
    if crit > 0: lines.append(f"| CRITICAL | {crit} |")
    if high > 0: lines.append(f"| HIGH | {high} |")
    if med > 0: lines.append(f"| MEDIUM | {med} |")
    if low_s > 0: lines.append(f"| LOW | {low_s} |")
    if not advisories: lines.append("| None | 0 |")
    lines.append("\n")

    if advisories:
        lines.append("## 4. Advisory Items & Estimated Repair Costs\n")
        lines.append("| Item | Severity | Urgency | Est. Cost |")
        lines.append("| --- | --- | --- | --- |")
        for a in advisories[:15]:
            cost = f"£{a['cost_min']}-£{a['cost_max']}" if a["cost_max"] > 0 else "See notes"
            lines.append(f"| {sev_emoji(a['severity'])} {a['item']} | {a['severity']} | {a['urgency']} | {cost} |")
        lines.append("\n")
        lines.append(f"**Total estimated repair costs:** £{valuation.get('total_advisory_cost_min', 0):,}-£{valuation.get('total_advisory_cost_max', 0):,}\n")
        lines.append(f"**MOT fail risk:** {valuation.get('mot_fail_risk', 'unknown').upper()}\n")
        lines.append(f"**Recommendation:** {valuation.get('recommendation', 'N/A')}\n")
    else:
        lines.append("## 4. Advisory Items  \nNo advisories recorded on last MOT.\n")

    lines.append("## 5. Market Valuation\n")
    if val_min and val_max:
        lines.append(f"**Estimated market value:** £{val_min:,}-£{val_max:,}")
        if val_adv_min and val_adv_max:
            lines.append(f"**As-is value (with advisories):** £{val_adv_min:,}-£{val_adv_max:,}")
        lines.append(f"\n**Expected months remaining:** {valuation.get('expected_months_remaining', '?')} -- {valuation.get('lifespan_assessment', '')}\n")
    else:
        lines.append("Market valuation not available.\n")

    if errors:
        lines.append("## 6. Errors\n")
        for e in errors: lines.append(f"- {e}")
        lines.append("\n")

    lines.append(f"\n*Report generated by Vehicle OSINT CLI v{__version__} on {today}*")
    return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN SCAN LOGIC
# ═══════════════════════════════════════════════════════════════════════════════

def run_vehicle_osint(plate: str, output_path: str | None) -> dict:
    plate_clean = re.sub(r'\s', '', plate).upper()
    plate_type = detect_plate_type(plate_clean)

    _print(f"  [*] Detected type: {plate_type}")

    errors = []
    dvla_data = {"findings": [], "errors": [], "raw_data": {}}
    carcheck_data = {"findings": [], "errors": [], "raw_data": {}}
    govuk_data = {"findings": [], "errors": [], "raw_data": {}}
    valuation = {}

    with sync_playwright() as pw:
        if plate_type == "VIN":
            _print("  [*] Querying NHTSA vPIC API...")
            nhtsa = collect_nhtsa_vin(plate_clean)
            errors.extend(nhtsa["errors"])

        elif plate_type == "UK":
            _print("  [*] Querying DVLA (gov.uk)...")
            dvla_data = collect_dvla(plate_clean, pw)
            if dvla_data["errors"]: errors.extend([f"DVLA: {e}" for e in dvla_data["errors"]])

            _print("  [*] Querying car-checking.com (MOT + specs)...")
            carcheck_data = collect_car_check(plate_clean, pw)
            if carcheck_data["errors"]: errors.extend([f"car-checking.com: {e}" for e in carcheck_data["errors"]])

            _print("  [*] Querying gov.uk MOT history (cloudscraper)...")
            govuk_data = collect_gov_uk_mot(plate_clean, pw)
            if govuk_data["errors"]: errors.extend([f"Gov.uk MOT: {e}" for e in govuk_data["errors"]])

            # Valuation
            cc_raw = carcheck_data.get("raw_data", {})
            dvla_raw = dvla_data.get("raw_data", {})
            model_raw = cc_raw.get("model", "")
            noise_prefixes = ["Colour","Year of manufacture","Top speed","0 to ","Gearbox","Engine & fuel consumption","Power","Torque","Engine capacity","Cylinders","Fuel type","Consumption","CO2"]
            model_clean = model_raw
            for prefix in noise_prefixes:
                idx = model_clean.find(prefix)
                if idx > 2: model_clean = model_clean[:idx].strip()
            model_clean = re.sub(r'\s+\d+\s*$', '', model_clean).replace('  ', ' ').strip()[:60]

            make = cc_raw.get("make", "") or dvla_raw.get("Make", "")
            year_str = cc_raw.get("year", "0")
            year = int(re.sub(r'\D', '', year_str)) if re.sub(r'\D', '', year_str) else 0
            fuel_type = cc_raw.get("fuel_type", "DIESEL")
            engine_cc_str = cc_raw.get("engine_capacity", "0")
            engine_cc = int(re.sub(r'\D', '', engine_cc_str)) if re.sub(r'\D', '', engine_cc_str) else 0
            advisory_notes = cc_raw.get("advisory_notes", [])
            mileage_timeline = cc_raw.get("mileage_timeline", [])
            current_mileage = mileage_timeline[0] if mileage_timeline else None

            mot_failed = 0
            for f in carcheck_data.get("findings", []):
                if f["field"] == "mot_failed": mot_failed = int(f["value"]); break
            mot_passed = 0
            for f in carcheck_data.get("findings", []):
                if f["field"] == "mot_passed": mot_passed = int(f["value"]); break

            advisories = estimate_advisories(advisory_notes, mot_failed, mot_passed, year or 2005, engine_cc, fuel_type or "DIESEL")
            valuation = generate_vehicle_valuation(make or "Unknown", model_clean, year or 2005, current_mileage, fuel_type or "DIESEL", advisories, mot_failed, mot_passed)

        else:
            errors.append(f"Unrecognised plate format: {plate_clean}. Supported: UK reg, VIN (17 chars).")

    # Result summary
    val_min = valuation.get("current_value_min", 0)
    val_max = valuation.get("current_value_max", 0)
    cc_raw = carcheck_data.get("raw_data", {})
    colour = cc_raw.get("colour", "")
    mot_expiry = cc_raw.get("mot_expiry", "")
    mot_pass_rate = ""
    for f in carcheck_data.get("findings", []):
        if f["field"] == "mot_pass_rate": mot_pass_rate = f["value"]; break

    risk = "UNKNOWN"
    if valuation:
        risk = valuation.get("mot_fail_risk", "unknown").upper()
        if risk == "UNKNOWN": risk = "LOW"

    _print("")
    _print(f"  {FGREEN}--- Result ---{RESET_ALL}")
    _print(f"  Registration : {plate_clean}")
    _print(f"  Make/Model  : {valuation.get('make', 'Unknown')} {valuation.get('model', '')}".rstrip())
    if colour: _print(f"  Colour      : {colour}")
    _print(f"  MOT Expiry  : {mot_expiry or 'N/A'}" + (f"  | Pass Rate: {mot_pass_rate}" if mot_pass_rate else ""))
    if val_min and val_max:
        risk_color = FRED if risk == "HIGH" else (FYELLOW if risk == "MEDIUM" else FGREEN)
        _print(f"  Value       : {FGREEN}£{val_min:,} - £{val_max:,}{RESET_ALL}")
        _print(f"  Risk        : {risk_color}{risk}{RESET_ALL}")
    if errors:
        _print(f"  {FYELLOW}Errors ({len(errors)}):{RESET_ALL}")
        for e in errors: _print(f"    - {e}")

    # Save report
    md = generate_markdown_report(plate_clean, dvla_data, carcheck_data, govuk_data, valuation, errors)
    if output_path:
        out = Path(output_path)
    else:
        today_str = datetime.now().strftime("%Y-%m-%d")
        report_dir = Path("reports") / "osint" / today_str
        report_dir.mkdir(parents=True, exist_ok=True)
        out = report_dir / f"vehicle-{plate_clean}.md"
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    Path(out).write_text(md, encoding="utf-8")
    _print(f"  {FCYAN}Report saved: {out}{RESET_ALL}")

    return {"plate": plate_clean, "valuation": valuation, "errors": errors, "report_path": str(out)}


# ═══════════════════════════════════════════════════════════════════════════════
# INTERACTIVE UI
# ═══════════════════════════════════════════════════════════════════════════════

def _print(msg: str = ""):
    try: print(msg)
    except Exception:
        try: sys.stdout.write(str(msg) + "\n")
        except Exception: pass


def _input(prompt: str) -> str:
    try: return input(prompt)
    except (EOFError, OSError): return ""


def banner():
    _print(f"""
================================================================================
                   Vehicle OSINT Pipeline  v{__version__}
                  UK Registration Plate Lookup
================================================================================

  Enter a UK registration plate to scan. Results are printed
  to screen and saved as a markdown report.
  Reports saved to:  reports/osint/YYYY-MM-DD/vehicle-<PLATE>.md
  Type 'q' to quit at any prompt.
""")


def menu_loop():
    while True:
        banner()
        plate = _input(f"  {BRIGHT}Enter registration{RESET_ALL} (e.g. KY05YTJ) [{FYELLOW}q{RESET_ALL} to quit]: ").strip()

        if plate.lower() in ("q", "quit", "exit"):
            _print(f"\n  {FCYAN}Goodbye!{RESET_ALL}\n")
            break

        if not plate:
            _print(f"  {FRED}Error: Enter a registration plate{RESET_ALL}\n")
            time.sleep(1.5)
            continue

        _print(f"\n  Scanning {BRIGHT}{plate}{RESET_ALL} ...\n")

        try:
            result = run_vehicle_osint(plate, None)
            errors = result.get("errors", [])
            _print("")
            if not errors:
                _print(f"  {FGREEN}{BRIGHT}Scan complete!{RESET_ALL}  {FCYAN}Full report saved.{RESET_ALL}")
            else:
                _print(f"  {FYELLOW}{BRIGHT}Scan complete with {len(errors)} error(s).{RESET_ALL}")
        except Exception as e:
            log_path = Path(tempfile.gettempdir()) / "vehicle-osint_crash.log"
            try:
                import traceback
                log_path.write_text(f"[{datetime.now().isoformat()}] FATAL: {e}\n{traceback.format_exc()}", encoding="utf-8")
            except Exception:
                pass
            _print(f"\n  {FRED}{BRIGHT}FATAL ERROR: {e}{RESET_ALL}")
            _print(f"  {FYELLOW}Crash log written to: {log_path}{RESET_ALL}")

        _input(f"\n  {FYELLOW}Press Enter to continue...{RESET_ALL}")


# ═══════════════════════════════════════════════════════════════════════════════
# CLI ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    log_path = Path(tempfile.gettempdir()) / "vehicle-osint_crash.log"
    try:
        menu_loop()
    except KeyboardInterrupt:
        _print(f"\n\n  {FCYAN}Interrupted. Goodbye!{RESET_ALL}\n")
    except Exception as e:
        try:
            import traceback
            log_path.write_text(f"[{datetime.now().isoformat()}] FATAL: {e}\n{traceback.format_exc()}", encoding="utf-8")
        except Exception:
            pass
        _print(f"\n  {FRED}FATAL ERROR: {e}{RESET_ALL}")
        sys.exit(1)


if __name__ == "__main__":
    main()
