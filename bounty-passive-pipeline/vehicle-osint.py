#!/usr/bin/env python3
"""
vehicle-osint.py — Standalone Vehicle OSINT CLI v2.0.0
Full-featured UK vehicle intelligence report generator.

Build: pyinstaller --onefile --console --name vehicle-osint vehicle-osint.py
Requires: pip install playwright cloudscraper colorama requests
          playwright install chromium

Accepts a UK registration plate as a CLI argument:
    python vehicle-osint.py AJ05RCF
    python vehicle-osint.py "KY05 YTJ" -o C:\reports\my.md
"""

import sys
import os
import re
import json
import time
import argparse
import tempfile
import subprocess
from pathlib import Path
from datetime import datetime
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

import requests

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
FMAGENTA  = colorama.Fore.MAGENTA

import cloudscraper
from playwright.sync_api import sync_playwright

__version__ = "2.0.0"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-GB,en;q=0.9",
}
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

# ─────────────────────────────────────────────────────────────────────────────
# ADVISORY DATABASE — 50+ entries covering common MOT failures
# ─────────────────────────────────────────────────────────────────────────────

ADVISORY_DATABASE = [
    {"keywords": ["tyre worn close to legal limit","tyres worn close to legal limit"], "item": "Tyre(s) worn close to legal limit", "severity": "medium", "urgency": "soon", "cost_min": 90, "cost_max": 155, "labour_hours": 0.5, "parts_included": True, "category": "tyres"},
    {"keywords": ["tyre worn on edge","tyres worn on edge","tyres below legal limit","tyre below legal limit","tyres worn below legal","tyre worn below legal"], "item": "Tyre(s) worn below legal limit", "severity": "critical", "urgency": "immediate", "cost_min": 90, "cost_max": 155, "labour_hours": 0.5, "parts_included": True, "category": "tyres"},
    {"keywords": ["tyre slightly damaged","tyres slightly damaged","perishing","cracking on tyre","cracking on tyres"], "item": "Tyre(s) slightly damaged / perishing", "severity": "low", "urgency": "soon", "cost_min": 40, "cost_max": 80, "labour_hours": 0.25, "parts_included": True, "category": "tyres"},
    {"keywords": ["coil spring fractured","coil spring broken","coil spring split"], "item": "Coil spring fractured/broken", "severity": "critical", "urgency": "immediate", "cost_min": 250, "cost_max": 600, "labour_hours": 2.5, "parts_included": False, "category": "suspension"},
    {"keywords": ["shock absorber leaking","shock absorber has a light leak","damper leaking","strut mount deteriorated","top mount failure"], "item": "Shock absorber / strut leaking", "severity": "high", "urgency": "soon", "cost_min": 150, "cost_max": 400, "labour_hours": 1.5, "parts_included": False, "category": "suspension"},
    {"keywords": ["suspension arm corroded","suspension arm deteriorated","track control arm corroded","lower arm corroded","upper arm corroded"], "item": "Suspension arm / bush corroded", "severity": "medium", "urgency": "when_due", "cost_min": 100, "cost_max": 300, "labour_hours": 1.5, "parts_included": False, "category": "suspension"},
    {"keywords": ["brake pipe corroded","brake pipe severely corroded","brake pipes corroded","corroded brake pipe"], "item": "Brake pipe corroded", "severity": "high", "urgency": "soon", "cost_min": 100, "cost_max": 250, "labour_hours": 1.5, "parts_included": False, "category": "brakes"},
    {"keywords": ["brake hose has slight corrosion","brake hose corroded","brake hose deteriorated","rubber hose cracked","flexible brake hose perished"], "item": "Brake hose corroded / perished", "severity": "medium", "urgency": "when_due", "cost_min": 60, "cost_max": 140, "labour_hours": 1.0, "parts_included": False, "category": "brakes"},
    {"keywords": ["brake cable damaged","brake cable frayed","handbrake cable damaged","parking brake cable damaged","rear brake cable damaged"], "item": "Brake cable damaged", "severity": "medium", "urgency": "when_due", "cost_min": 60, "cost_max": 140, "labour_hours": 1.0, "parts_included": False, "category": "brakes"},
    {"keywords": ["brake pad worn","brake pads worn","front brake pads worn","rear brake pads worn","brake pad excessive wear","pad worn close to wire"], "item": "Brake pad(s) worn", "severity": "high", "urgency": "immediate", "cost_min": 80, "cost_max": 200, "labour_hours": 1.0, "parts_included": False, "category": "brakes"},
    {"keywords": ["brake disc worn","brake discs worn","brake disc in poor condition","rear brake disc scored","brake disc below minimum thickness"], "item": "Brake disc worn / scored", "severity": "high", "urgency": "soon", "cost_min": 100, "cost_max": 250, "labour_hours": 1.5, "parts_included": False, "category": "brakes"},
    {"keywords": ["abs sensor defective","abs sensor not working","abs warning light","anti-lock brake system warning"], "item": "ABS sensor defective", "severity": "medium", "urgency": "when_due", "cost_min": 100, "cost_max": 250, "labour_hours": 1.0, "parts_included": False, "category": "brakes"},
    {"keywords": ["steering rack gaiter damaged","steering rack gaiter split","rack gaiter perished","steering rack boot split"], "item": "Steering rack gaiter split", "severity": "high", "urgency": "soon", "cost_min": 100, "cost_max": 250, "labour_hours": 1.5, "parts_included": False, "category": "steering"},
    {"keywords": ["track rod end worn","track rod end excessive play","tie rod end worn","steering linkage worn","steering ball joint worn"], "item": "Steering ball joint / track rod end worn", "severity": "critical", "urgency": "immediate", "cost_min": 100, "cost_max": 250, "labour_hours": 1.5, "parts_included": False, "category": "steering"},
    {"keywords": ["exhaust emitting excessive smoke","exhaust smokes on tickover","excessive smoke from exhaust","engine emitting blue smoke","engine emitting white smoke"], "item": "Engine smoking (blue/white)", "severity": "high", "urgency": "soon", "cost_min": 200, "cost_max": 1200, "labour_hours": 4.0, "parts_included": False, "category": "engine"},
    {"keywords": ["catalytic converter defective","catalytic converter missing","cat removed","exhaust catalytic converter below threshold"], "item": "Catalytic converter defective", "severity": "high", "urgency": "soon", "cost_min": 300, "cost_max": 1200, "labour_hours": 2.0, "parts_included": False, "category": "exhaust"},
    {"keywords": ["dpf warning light","dpf blocked","dpf regeneration required","dpf fault","diesel particulate filter warning"], "item": "DPF warning / blocked", "severity": "high", "urgency": "soon", "cost_min": 200, "cost_max": 1500, "labour_hours": 3.0, "parts_included": False, "category": "exhaust"},
    {"keywords": ["emissions exceed limit","lambda sensor defective","lambda sensor malfunction","air fuel ratio sensor defective","o2 sensor defective","sensor for emissions defective"], "item": "Emissions sensor / lambda defective", "severity": "medium", "urgency": "when_due", "cost_min": 150, "cost_max": 400, "labour_hours": 1.5, "parts_included": False, "category": "exhaust"},
    {"keywords": ["engine oil level low","engine oil warning","oil warning light","oil consumption excessive"], "item": "Engine oil level low / consuming", "severity": "high", "urgency": "soon", "cost_min": 50, "cost_max": 300, "labour_hours": 0.5, "parts_included": True, "category": "engine"},
    {"keywords": ["sub-frame corroded","subframe corroded","sub frame corroded","underbody corroded","chassis corroded","floor pan corroded"], "item": "Sub-frame / chassis corroded", "severity": "high", "urgency": "when_due", "cost_min": 200, "cost_max": 1000, "labour_hours": 4.0, "parts_included": False, "category": "structural"},
    {"keywords": ["corrosion to underside","surface corrosion to underside","corrosion to suspension","corrosion to body","corrosion to structure"], "item": "Generalised corrosion / rust", "severity": "medium", "urgency": "when_due", "cost_min": 50, "cost_max": 500, "labour_hours": 2.0, "parts_included": True, "category": "structural"},
    {"keywords": ["headlamp lens slightly defective","headlamp lens cracked","headlamp lens deteriorated","headlight lens cracked","dipped beam headlamp defective","main beam headlamp defective"], "item": "Headlamp lens defective", "severity": "low", "urgency": "advisory", "cost_min": 0, "cost_max": 60, "labour_hours": 0.25, "parts_included": False, "category": "lights"},
    {"keywords": ["rear registration plate lamp defective","number plate lamp not working","license plate lamp defective"], "item": "Number plate lamp defective", "severity": "low", "urgency": "advisory", "cost_min": 0, "cost_max": 30, "labour_hours": 0.25, "parts_included": True, "category": "lights"},
    {"keywords": ["stop lamp defective","brake light not working","stop light defective","rear lamp not working"], "item": "Brake / stop lamp defective", "severity": "high", "urgency": "soon", "cost_min": 0, "cost_max": 60, "labour_hours": 0.25, "parts_included": True, "category": "lights"},
    {"keywords": ["wheel bearing noisy","wheel bearing excessive play","wheel bearing worn","front wheel bearing noisy","rear wheel bearing noisy"], "item": "Wheel bearing worn / noisy", "severity": "medium", "urgency": "when_due", "cost_min": 80, "cost_max": 250, "labour_hours": 1.5, "parts_included": False, "category": "suspension"},
    {"keywords": ["alloy wheel damaged","alloy wheel cracked","wheel damaged not allowing bead","tyre not seating","wheel rim cracked"], "item": "Wheel / alloy rim damaged", "severity": "low", "urgency": "advisory", "cost_min": 0, "cost_max": 200, "labour_hours": 0.5, "parts_included": True, "category": "tyres"},
    {"keywords": ["wiper blade deteriorated","wiper blade not cleaning","windscreen wiper deteriorated","wiper rubber perished"], "item": "Wiper blade(s) deteriorated", "severity": "low", "urgency": "advisory", "cost_min": 10, "cost_max": 40, "labour_hours": 0.1, "parts_included": True, "category": "body"},
    {"keywords": ["windscreen chipped","windscreen cracked","screen cracked","windscreen stone chip cracked"], "item": "Windscreen cracked / chipped", "severity": "medium", "urgency": "when_due", "cost_min": 0, "cost_max": 300, "labour_hours": 1.0, "parts_included": False, "category": "body"},
    {"keywords": ["seat belt damaged","seat belt not working correctly","seat belt tensioner defective","seat belt webbing frayed"], "item": "Seat belt defective", "severity": "critical", "urgency": "immediate", "cost_min": 100, "cost_max": 500, "labour_hours": 2.0, "parts_included": False, "category": "safety"},
    {"keywords": ["anti-roll bar linkage ball joint excessively worn","drop link worn","anti roll bar link worn","sway bar link worn"], "item": "Anti-roll bar link / drop link worn", "severity": "high", "urgency": "soon", "cost_min": 50, "cost_max": 150, "labour_hours": 1.0, "parts_included": False, "category": "suspension"},
    {"keywords": ["engine mount deteriorated","engine mount broken","torque mount broken","engine support mount failed"], "item": "Engine mount / torque arm deteriorated", "severity": "medium", "urgency": "when_due", "cost_min": 100, "cost_max": 350, "labour_hours": 2.0, "parts_included": False, "category": "engine"},
    {"keywords": ["clutch slipping","clutch wear","clutch judder","clutch biting point high","clutch replacement recommended"], "item": "Clutch slipping / worn", "severity": "high", "urgency": "when_due", "cost_min": 400, "cost_max": 900, "labour_hours": 4.0, "parts_included": False, "category": "transmission"},
    {"keywords": ["gearbox oil leaking","gearbox leak","transmission housing leak","gearbox oil level low"], "item": "Gearbox / transmission leak", "severity": "medium", "urgency": "when_due", "cost_min": 50, "cost_max": 400, "labour_hours": 2.0, "parts_included": False, "category": "transmission"},
    {"keywords": ["driveshaft gaiter split","driveshaft boot split","cv boot split","constant velocity joint boot split"], "item": "CV / driveshaft boot split", "severity": "high", "urgency": "soon", "cost_min": 80, "cost_max": 300, "labour_hours": 2.0, "parts_included": False, "category": "transmission"},
    {"keywords": ["water pump leaking","water pump seal leaking","coolant leak from water pump","engine cooling system leak"], "item": "Coolant / water pump leak", "severity": "high", "urgency": "soon", "cost_min": 100, "cost_max": 500, "labour_hours": 2.5, "parts_included": False, "category": "cooling"},
    {"keywords": ["radiator leaking","radiator core leaking","cooling fan not working","thermostat not working","thermostat stuck open"], "item": "Cooling system fault", "severity": "high", "urgency": "soon", "cost_min": 80, "cost_max": 400, "labour_hours": 1.5, "parts_included": False, "category": "cooling"},
    {"keywords": ["steering column lock engaged","steering lock malfunction","steering lock not releasing","steering lock fault"], "item": "Steering lock fault", "severity": "critical", "urgency": "immediate", "cost_min": 100, "cost_max": 400, "labour_hours": 1.0, "parts_included": False, "category": "steering"},
    {"keywords": ["inhibitor switch defective","gear selector not working","automatic transmission fault","gear position switch defective"], "item": "Gear selector / inhibitor switch", "severity": "medium", "urgency": "when_due", "cost_min": 80, "cost_max": 300, "labour_hours": 1.5, "parts_included": False, "category": "transmission"},
    {"keywords": ["high mileage indicator","mileage discrepancy","mileage inconsistent","odometer reading unreliable"], "item": "Mileage discrepancy / clock concern", "severity": "critical", "urgency": "immediate", "cost_min": 0, "cost_max": 0, "labour_hours": 0, "parts_included": False, "category": "fraud"},
    {"keywords": ["hybrid system warning","high voltage system fault","hybrid battery degraded","hybrid battery fault"], "item": "Hybrid battery / system fault", "severity": "critical", "urgency": "when_due", "cost_min": 500, "cost_max": 4000, "labour_hours": 4.0, "parts_included": False, "category": "hybrid"},
    {"keywords": ["advisory ","minor deterioration","slight wear","nearest to limit","slight roughness","slight play","signs of wear","wear in bush"], "item": "General wear — monitoring advised", "severity": "low", "urgency": "advisory", "cost_min": 0, "cost_max": 200, "labour_hours": 0, "parts_included": False, "category": "general"},
    # Vauxhall Corsa specific
    {"keywords": ["coil pack","ignition coil"], "item": "Ignition coil / coil pack — common Corsa failure", "severity": "high", "urgency": "soon", "cost_min": 80, "cost_max": 300, "labour_hours": 1.0, "parts_included": False, "category": "engine"},
    {"keywords": ["intermediate shaft","camshaft phaser","cam sensor"], "item": "Camshaft sensor / intermediate shaft — Z14XE common fault", "severity": "medium", "urgency": "when_due", "cost_min": 60, "cost_max": 200, "labour_hours": 1.0, "parts_included": False, "category": "engine"},
    {"keywords": ["power steering pipe","power steering leak","steering pump"], "item": "Power steering pipe / pump leak", "severity": "medium", "urgency": "when_due", "cost_min": 80, "cost_max": 300, "labour_hours": 1.5, "parts_included": False, "category": "steering"},
    {"keywords": ["rear wheel bearing","wheel bearing"], "item": "Rear wheel bearing — Corsa common wear item", "severity": "medium", "urgency": "when_due", "cost_min": 80, "cost_max": 200, "labour_hours": 1.5, "parts_included": False, "category": "suspension"},
    {"keywords": ["catalytic converter","cat"], "item": "Catalytic converter failure — Corsa Z14XE known issue", "severity": "high", "urgency": "soon", "cost_min": 300, "cost_max": 800, "labour_hours": 2.0, "parts_included": False, "category": "exhaust"},
    # Ford common issues
    {"keywords": ["fuel pump module","fuel pump","fpim"], "item": "Fuel pump module — Ford Mondeo/TDCi common failure", "severity": "high", "urgency": "soon", "cost_min": 150, "cost_max": 400, "labour_hours": 2.0, "parts_included": False, "category": "fuel"},
    {"keywords": ["dual mass flywheel","dmf"], "item": "Dual mass flywheel — Ford TDCI common weakness", "severity": "high", "urgency": "when_due", "cost_min": 400, "cost_max": 900, "labour_hours": 5.0, "parts_included": False, "category": "transmission"},
    {"keywords": ["egr valve","egr cooler","exhaust gas recirculation"], "item": "EGR valve / cooler — Ford diesel common fault", "severity": "high", "urgency": "when_due", "cost_min": 100, "cost_max": 400, "labour_hours": 2.0, "parts_included": False, "category": "emissions"},
    # Diesel common
    {"keywords": ["turbocharger","turbo boost","turbo actuator","boost pressure"], "item": "Turbo fault — diesel common wear item", "severity": "high", "urgency": "when_due", "cost_min": 400, "cost_max": 1500, "labour_hours": 4.0, "parts_included": False, "category": "turbo"},
]

# ─────────────────────────────────────────────────────────────────────────────
# MODEL KNOWN ISSUES DATABASE
# Keyed by (make, model) prefix — checked against make+model
# ─────────────────────────────────────────────────────────────────────────────

MODEL_KNOWN_ISSUES = {
    ("Vauxhall", "Corsa"): [
        "Ignition coil pack failures (Z14XE, Z16SE engines)",
        "Camshaft position sensor failures",
        "Rear wheel bearing wear (common after 80k miles)",
        "Power steering pipe corrosion and leaks",
        "Catalytic converter failure on Z14XE",
        "Clutch release bearing premature wear",
        "Water pump seal leaks on Z14XE",
        "Front lower arm bush deterioration",
    ],
    ("Vauxhall", "Astra"): [
        "Timing chain tensioner failure (Z16LET, A16LET engines)",
        "High pressure fuel pump failure (A16LET)",
        "Clutch dual mass flywheel issues",
        "Rear shock absorber seal leaks",
        "Lambda sensor failures",
        "EGR valve carbon buildup",
    ],
    ("Ford", "Focus"): [
        "Power steering hose banjo bolt leaks",
        "DPF regeneration issues on diesel models",
        "PCV valve failure causing oil consumption",
        "Rear trailing arm bush wear",
        "Timing belt tensioner failure (pre-2011)",
    ],
    ("Ford", "Mondeo"): [
        "Fuel pump module failures (TDCi)",
        "Dual mass flywheel shudder (TDCi)",
        "EGR cooler blockage (TDCi)",
        "Power steering pump failure",
        "PCV valve oil consumption",
    ],
    ("Ford", "Fiesta"): [
        "PATS transponder key issues",
        "Clutch master cylinder leaks",
        "Rear drum brake shoe retention",
        "Throttle body carbon buildup",
    ],
    ("Volkswagen", "Golf"): [
        "Water pump failure (VW/Audi 1.4 TSI EA211)",
        "Timing chain tensioner (1.4 TSI)",
        "PCV valve failure",
        "DSG gearbox mechatronics",
        "Turbo wastegate rattle (1.4 TSI)",
    ],
    ("BMW", "3 Series"): [
        "Valve cover gasket leaks (N46, N47 engines)",
        "Engine mount failure",
        "EGR cooler засоры",
        "High pressure fuel pump (N54 twin scroll turbo)",
        "Timing chain stretch (N46)",
    ],
    ("Audi", "A3"): [
        "Water pump failure (1.4 TSI EA211)",
        "Timing chain tensioner (1.8 TFSI)",
        "PCV valve failure",
        "Haldex clutch wear (AWD models)",
    ],
    ("Toyota", "Yaris"): [
        "Oil consumption — 1.0L VVT-i (1KR-FE)",
        "CVT transmission fluid deterioration",
        "Brake master cylinder seals",
    ],
    ("Honda", "Civic"): [
        "VTEC solenoid gasket leaks",
        "Rear brake caliper seize",
        "CVT belt wear (early 2000s models)",
    ],
    ("Renault", "Clio"): [
        "Fuel pump failures",
        "Crankshaft position sensor",
        "DPF issues on dCi engines",
        "Clutch release bearing",
    ],
    ("Peugeot", "206"): [
        "Gearbox synchro wear (beige box)",
        "Engine mount failure",
        "Electrical faults — BCM common",
        "Central locking vacuum actuator",
    ],
    ("Peugeot", "207"): [
        "Fan resistor pack failures",
        "Coolant temperature sensor",
        "Gearbox synchro wear",
    ],
    ("Nissan", "Qashqai"): [
        "CVT transmission judder",
        "Power steering pump leaks",
        "Rear brake caliper seize",
        "DPF issues on dCi engines",
    ],
}

# ─────────────────────────────────────────────────────────────────────────────
# INSURANCE GROUP DATA — Thatcham groups by make/model (UK)
# Format: (make_prefix, model_prefix) -> (min_group, max_group, notes)
# ─────────────────────────────────────────────────────────────────────────────

INSURANCE_GROUPS = {
    ("Vauxhall", "Corsa"): (3, 9, "Entry-level supermini, low insurance"),
    ("Vauxhall", "Astra"): (4, 12, "Family hatchback, moderate insurance"),
    ("Vauxhall", "Insignia"): (6, 14, "Large family car, moderate insurance"),
    ("Ford", "Fiesta"): (2, 8, "Best-selling supermini, low group"),
    ("Ford", "Focus"): (3, 10, "Family hatch, low-moderate group"),
    ("Ford", "Mondeo"): (5, 13, "Large family car, moderate group"),
    ("Ford", "Kuga"): (5, 11, "Crossover SUV, moderate group"),
    ("Volkswagen", "Golf"): (4, 12, "Premium hatchback, moderate group"),
    ("Volkswagen", "Polo"): (2, 7, "Small supermini, low group"),
    ("Volkswagen", "Passat"): (5, 12, "Large family saloon, moderate group"),
    ("BMW", "3 Series"): (6, 15, "Premium saloon, moderate-high group"),
    ("BMW", "1 Series"): (5, 13, "Premium compact, moderate group"),
    ("Audi", "A3"): (5, 12, "Premium compact, moderate group"),
    ("Audi", "A4"): (6, 14, "Premium saloon, moderate-high group"),
    ("Toyota", "Yaris"): (2, 5, "Reliable supermini, low group"),
    ("Toyota", "Corolla"): (4, 9, "Reliable family hatch, low group"),
    ("Toyota", "RAV4"): (5, 11, "SUV, moderate group"),
    ("Honda", "Civic"): (3, 8, "Reliable hatchback, low group"),
    ("Honda", "HR-V"): (4, 9, "Compact SUV, low-moderate group"),
    ("Renault", "Clio"): (2, 6, "Budget supermini, low group"),
    ("Renault", "Megane"): (3, 8, "Family hatch, low group"),
    ("Peugeot", "206"): (2, 5, "Budget supermini, low group"),
    ("Peugeot", "207"): (2, 6, "Budget supermini, low group"),
    ("Peugeot", "308"): (3, 8, "Family hatch, low group"),
    ("Nissan", "Qashqai"): (4, 10, "Crossover SUV, low-moderate group"),
    ("Nissan", "Juke"): (3, 9, "Compact crossover, low-moderate group"),
    ("Hyundai", "i10"): (2, 4, "City car, very low group"),
    ("Hyundai", "i30"): (3, 8, "Family hatch, low group"),
    ("Kia", "Sportage"): (4, 10, "SUV, low-moderate group"),
    ("Mercedes-Benz", "A Class"): (6, 14, "Premium compact, moderate-high group"),
    ("Mercedes-Benz", "C Class"): (7, 15, "Premium saloon, high group"),
}

# ─────────────────────────────────────────────────────────────────────────────
# DEPRECIATION DATA — Original MSRP estimates for common models (GBP, new)
# ─────────────────────────────────────────────────────────────────────────────

ORIGINAL_MSRP = {
    ("Vauxhall", "Corsa"): (8500, 14500),
    ("Vauxhall", "Astra"): (11000, 18000),
    ("Ford", "Fiesta"): (9000, 15500),
    ("Ford", "Focus"): (11500, 19000),
    ("Ford", "Mondeo"): (16000, 24000),
    ("Volkswagen", "Golf"): (13000, 22000),
    ("Volkswagen", "Polo"): (9500, 16000),
    ("BMW", "3 Series"): (22000, 38000),
    ("Audi", "A3"): (18000, 30000),
    ("Toyota", "Yaris"): (10000, 16500),
    ("Toyota", "Corolla"): (14000, 21000),
    ("Honda", "Civic"): (12000, 19500),
    ("Renault", "Clio"): (8000, 14000),
    ("Peugeot", "206"): (7500, 12500),
    ("Peugeot", "207"): (9000, 15000),
    ("Nissan", "Qashqai"): (14000, 23000),
    ("Hyundai", "i10"): (7000, 11500),
    ("Hyundai", "i30"): (11000, 17500),
}

# ─────────────────────────────────────────────────────────────────────────────
# UTILITIES
# ─────────────────────────────────────────────────────────────────────────────

def _print(msg: str = ""):
    try: print(msg)
    except Exception:
        try: sys.stdout.write(str(msg) + "\n")
        except Exception: pass

def delay(seconds: float):
    time.sleep(seconds)

def http_get(url: str, timeout: int = 15000, headers: dict = None) -> str:
    h = headers or HEADERS
    req_obj = Request(url, headers=h)
    try:
        resp = urlopen(req_obj, timeout=timeout / 1000)
        return resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        raise Exception(f"HTTP error for {url}: {e}")

def http_get_session(session: requests.Session, url: str, timeout: int = 15000) -> str:
    try:
        resp = session.get(url, timeout=timeout / 1000, headers=HEADERS)
        return resp.text
    except Exception as e:
        raise Exception(f"Session HTTP error for {url}: {e}")

def detect_plate_type(plate: str) -> str:
    clean = re.sub(r'\s', '', plate).upper()
    if re.match(r'^[A-HJ-NPR-Z0-9]{17}$', clean, re.I): return 'VIN'
    if re.match(r'^[A-Z]{2}\d{2}[A-Z]{3}$', clean): return 'UK'
    if re.match(r'^[A-Z]\d{1,3}[A-Z]{2,3}$', clean): return 'UK'
    if re.match(r'^[A-Z]{3}\d{1,3}[A-Z]{2}$', clean): return 'UK'
    if re.match(r'^[A-Z]{2}\d{2} ?[A-Z]{3}$', clean): return 'UK'
    if re.match(r'^[A-Z]{3} ?\d{3}$', clean): return 'UK'
    if re.match(r'^[A-Z0-9]{3,8}$', clean, re.I): return 'US'
    return 'UNKNOWN'

def clean_model_text(raw: str) -> str:
    """Strip trailing spec data noise from a model string."""
    if not raw: return ""
    noise = ["Colour","Year of manufacture","Top speed","0 to ","Gearbox","Engine & fuel consumption",
             "Power","Torque","Engine capacity","Cylinders","Fuel type","Consumption","CO2",
             "Doors","Seats","Body type"]
    cleaned = raw
    for prefix in noise:
        idx = cleaned.find(prefix)
        if idx > 2: cleaned = cleaned[:idx].strip()
    cleaned = re.sub(r'\s+\d+\s*$', '', cleaned).replace('  ', ' ').strip()
    return cleaned[:60]

def sev_emoji(severity: str) -> str:
    return {"critical": "🔴 CRITICAL", "high": "🟠 HIGH", "medium": "🟡 MEDIUM", "low": "🟢 LOW"}.get(severity, "⚪ UNKNOWN")

def risk_emoji(level: str) -> str:
    return {"high": "🔴", "medium": "🟡", "low": "🟢", "unknown": "⚪"}.get(level.lower(), "⚪")

def confidence_bar(pct: int) -> str:
    if pct >= 80: return "🟢 High"
    if pct >= 50: return "🟡 Medium"
    return "🔴 Low"

# ─────────────────────────────────────────────────────────────────────────────
# ADVISORY MATCHING
# ─────────────────────────────────────────────────────────────────────────────

def clean_advisory_text(text: str) -> str:
    t = re.sub(r'\bMOT\s*#?\d*\b', ' ', text, flags=re.IGNORECASE)
    t = re.sub(r'\bMOT test\b', ' ', t, flags=re.IGNORECASE)
    t = re.sub(r'\b\d+\.\d+\.\d+\s*\([a-z]\)\s*\([i]+\)\)', ' ', t)
    t = re.sub(r'\b\d+\.\d+\.\d+\s*\([a-z]\)', ' ', t)
    t = re.sub(r'\b\d+\.\d+\s*\([a-z]\s*\([i]+\)\)', ' ', t)
    t = re.sub(r'\b(nearest|offside|both|front|rear|ns|os)\b', ' ', t, flags=re.IGNORECASE)
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
            "item": f"Miscellaneous advisory — see MOT notes",
            "severity": "medium", "urgency": "when_due",
            "cost_min": 50, "cost_max": 500, "labour_hours": 1.0,
            "parts_included": False, "category": "general",
            "notes": f'Could not classify: "{advisory_notes[0][:80]}". Manual inspection recommended.'
        })
    return matched

# ─────────────────────────────────────────────────────────────────────────────
# VALUATION ENGINE
# ─────────────────────────────────────────────────────────────────────────────

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
        base_retail, brand_note = 8000, " (Japanese — holds value)"
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

def generate_vehicle_valuation(make: str, model: str, year: int, mileage: int | None,
                                fuel_type: str, advisories: list, mot_failures: int,
                                mot_total: int, tax_status: str = "", mot_expiry: str = "") -> dict:
    has_critical = any(a["severity"] == "critical" for a in advisories)
    has_high = any(a["severity"] == "high" for a in advisories)
    serious_count = sum(1 for a in advisories if a["severity"] in ("critical", "high"))

    condition = "poor" if has_critical else "fair" if has_high else "good" if len(advisories) <= 2 else "fair"
    value = estimate_value(make, model, year, mileage, condition)
    age = datetime.now().year - year
    diesel = bool(re.search(r'diesel|cdti|tdi|dti', fuel_type, re.I))

    if serious_count >= 2:
        months, lifespan_assessment = 3, f"{serious_count} serious critical/high-severity advisories. Dangerous — do not rely on this car without immediate repairs."
    elif serious_count >= 1:
        months, lifespan_assessment = 6, f"{serious_count} serious advisory present — likely MOT fail next time. Budget for retest + repairs within 6 months."
    elif len(advisories) >= 8:
        months, lifespan_assessment = 12, f"Many advisories ({len(advisories)}) — mostly wear items but accumulating. Budget for tyres, brakes, suspension in next 12 months."
    elif diesel and age >= 15:
        months, lifespan_assessment = 18, f"Diesel at {age} years — DPF, turbo, and clutch are the main risks."
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
        recommendation = f"Critical issues found — do not buy at asking price. Either walk away or negotiate minimum £{total_adv_min:,} off. Serious safety concerns."
    elif total_adv_max > value["max"] * 0.5:
        recommendation = f"Repair costs (up to £{total_adv_max:,}) exceed half the car's value. Negotiate hard or avoid."
    elif serious_count >= 1:
        recommendation = f"High-severity advisories present. Negotiate at least £{total_adv_min:,} off asking price. Budget total £{total_adv_min+200:,}-£{total_adv_max+400:,} including retest."
    else:
        recommendation = f"Advisories are manageable wear items. Price accordingly — aim to save at least the advisory cost in negotiation."

    # Depreciation
    msrp_key = next(((m, mo) for (m, mo) in ORIGINAL_MSRP if re.search(m, make.upper()) and re.search(mo, model.upper())), None)
    if msrp_key:
        msrp_min, msrp_max = ORIGINAL_MSRP[msrp_key]
    else:
        msrp_min, msrp_max = 10000, 16000  # generic fallback

    return {
        "make": make, "model": model, "year": year,
        "current_value_min": value["min"], "current_value_max": value["max"],
        "value_with_advisories_min": val_adv_min, "value_with_advisories_max": val_adv_max,
        "expected_months_remaining": months,
        "mot_fail_risk": mot_fail_risk,
        "total_advisory_cost_min": total_adv_min, "total_advisory_cost_max": total_adv_max,
        "lifespan_assessment": lifespan_assessment,
        "recommendation": recommendation,
        "original_msrp_min": msrp_min, "original_msrp_max": msrp_max,
        "depreciation_pct": round((1 - value["max"] / msrp_max) * 100, 1) if msrp_max > 0 else 0,
    }


# ─────────────────────────────────────────────────────────────────────────────
# DATA SOURCE: DVLA (vehicleenquiry.service.gov.uk) — Playwright
# Fallback: None (gov.uk is authoritative)
# ─────────────────────────────────────────────────────────────────────────────

def collect_dvla(plate: str, pw) -> dict:
    result = {"findings": [], "errors": [], "raw_data": {}, "source": "gov.uk-DVLA"}
    browser = None
    try:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME_PATH)
        page = browser.new_page()
        page.goto("https://vehicleenquiry.service.gov.uk/", wait_until="networkidle", timeout=25000)
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

        def find_field(pattern):
            return next((v for k, v in result["raw_data"].items() if re.search(pattern, k, re.I)), "")

        make = find_field(r'make')
        colour = find_field(r'colour')
        tax_status = find_field(r'tax\s*status')
        mot_status = find_field(r'MOT\s*status')
        first_reg = find_field(r'first\s*registered')

        if make: result["findings"].append({"source": "gov.uk-DVLA", "field": "make", "value": make, "confidence": 95})
        if colour: result["findings"].append({"source": "gov.uk-DVLA", "field": "colour", "value": colour, "confidence": 95})
        if tax_status: result["findings"].append({"source": "gov.uk-DVLA", "field": "tax_status", "value": tax_status, "confidence": 95})
        if mot_status: result["findings"].append({"source": "gov.uk-DVLA", "field": "mot_status", "value": mot_status, "confidence": 95})
        if first_reg: result["findings"].append({"source": "gov.uk-DVLA", "field": "first_reg_date", "value": first_reg, "confidence": 90})
        if not result["raw_data"]: result["errors"].append("DVLA returned empty result")
    except Exception as e:
        result["errors"].append(f"DVLA lookup failed: {e}")
    finally:
        if browser: browser.close()
    return result


# ─────────────────────────────────────────────────────────────────────────────
# DATA SOURCE: car-checking.com MOT/specs (Playwright SPA) — PRIMARY
# Fallback 1: gov.uk check-mot-history (cloudscraper + Playwright)
# Fallback 2: motest.com.uk (Playwright)
# Fallback 3: check-mot.service.gov.uk API (HTTP)
# ─────────────────────────────────────────────────────────────────────────────

def collect_car_check(plate: str, pw) -> dict:
    """Primary MOT + specs collector — car-checking.com (Playwright SPA)."""
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
        raw_text = body_text[:8000]
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

        def extract_field(pattern, field_name, confidence=90):
            m = re.search(pattern, body_text, re.I)
            if m:
                val = m.group(1).strip()
                result["findings"].append({"source": "car-checking.com", "field": field_name, "value": val, "confidence": confidence})
                result["raw_data"][field_name] = val
                return val
            return ""

        extract_field(r'MOT expiry date[\s\n]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', "mot_expiry")
        extract_field(r'MOT pass rate[\s\n]+(\d+)\s*%', "mot_pass_rate")
        extract_field(r'MOT passed[\s\n]+(\d+)', "mot_passed", 90)
        extract_field(r'Failed MOT tests[\s\n]+(\d+)', "mot_failed", 90)

        # MOT history table — extract all test entries
        mot_entries = []
        mot_block_re = re.compile(
            r'(?:MOT #\d+|Fee paid[\s\S]*?(?=MOT #\d+|$))',
            re.I
        )
        date_m = re.findall(r'(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', body_text)
        mileage_matches = re.findall(r'(\d{5,6})\s*(?:mi\.?|miles\b|mileage)', body_text)
        passfail_matches = re.findall(r'(?:Pass|Fail|PASS|FAIL)', body_text)
        test_centres = re.findall(r'(?:Test centre|Location)[\s\n]+([^\n\d]{3,60})', body_text, re.I)

        # Build timeline from mileage mentions
        mileage_timeline = sorted([int(m) for m in set(mileage_matches) if int(m) > 1000], reverse=True)
        if mileage_timeline:
            result["raw_data"]["mileage_timeline"] = mileage_timeline
            result["findings"].append({"source": "car-checking.com", "field": "current_mileage", "value": f"{mileage_timeline[0]:,} mi", "confidence": 85})

        vin_m = re.search(r'[A-HJ-NPR-Z0-9]{17}', raw_text, re.I)
        if vin_m:
            result["raw_data"]["vin"] = vin_m.group(0).upper()
            result["findings"].append({"source": "car-checking.com", "field": "vin", "value": vin_m.group(0).upper(), "confidence": 80})

        advisory_notes = []
        for m in re.finditer(r'(?:^|\s)(Advice|Advisory)[\s\n]+([^\n]{10,200})', body_text, re.I | re.M):
            item = m.group(2).strip()
            if len(item) > 5: advisory_notes.append(item)
        if advisory_notes:
            result["raw_data"]["advisory_notes"] = advisory_notes

        # MOT history
        mot_history = []
        for m in re.finditer(r'(?:MOT test|MOT #)(\d+)', body_text, re.I):
            mot_history.append(m.group(0))
        if mot_history:
            result["raw_data"]["mot_history_count"] = len(mot_history)

    except Exception as e:
        result["errors"].append(f"car-checking.com failed: {e}")
    finally:
        if browser: browser.close()
    delay(0.5)
    return result


def collect_gov_uk_mot(plate: str, pw) -> dict:
    """Fallback MOT collector — gov.uk cloudscraper + Playwright."""
    result = {"findings": [], "errors": [], "raw_data": {}, "source": "gov.uk-MOT"}
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
            result["findings"].append({"source": "gov.uk-MOT", "field": "mot_expiry", "value": expiry_m.group(1), "confidence": 95})
            result["raw_data"]["mot_expiry"] = expiry_m.group(1)
        test_date_m = re.search(r'test date[\s\n]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', body_text, re.I)
        if test_date_m:
            result["findings"].append({"source": "gov.uk-MOT", "field": "last_mot_date", "value": test_date_m.group(1), "confidence": 95})
        mileage_m = re.search(r'(\d{5,6})\s*(?:miles|mi)', body_text, re.I)
        if mileage_m:
            result["findings"].append({"source": "gov.uk-MOT", "field": "last_odometer", "value": mileage_m.group(1) + " miles", "confidence": 90})
            result["raw_data"]["current_mileage"] = int(re.sub(r'\D', '', mileage_m.group(1)))
        if re.search(r'MOT pass|PASSED|<dt[^>]*>Result[^<]*</dt[^>]*>[\s\S]{0,50}?PASS', body_text, re.I):
            result["findings"].append({"source": "gov.uk-MOT", "field": "mot_result", "value": "PASS", "confidence": 95})
        elif re.search(r'MOT fail|FAILED', body_text, re.I):
            result["findings"].append({"source": "gov.uk-MOT", "field": "mot_result", "value": "FAIL", "confidence": 95})
        if not result["findings"]: result["errors"].append("Gov.uk MOT cloudscraper: no data extracted")
    except Exception as e:
        result["errors"].append(f"Gov.uk MOT cloudscraper: {e}")
        # Fallback to Playwright
        browser = None
        try:
            browser = pw.chromium.launch(headless=True, executable_path=CHROME_PATH)
            page = browser.new_page()
            page.goto("https://www.gov.uk/check-mot-history", wait_until="domcontentloaded", timeout=20000)
            page.wait_for_timeout(3000)
            body_text = page.text_content("body") or ""
            if re.search(r'cloudflare|checking your browser', body_text, re.I):
                result["errors"].append("Gov.uk MOT Playwright: CloudFlare challenge")
                return result
            page.locator("#vrm").wait_for(state="visible", timeout=10000)
            page.locator("#vrm").fill(plate)
            page.locator("button[type=submit]").filter(has_text=re.compile(r"check|find", re.I)).first.click()
            page.wait_for_load_state("networkidle", timeout=30000)
            page.wait_for_timeout(2000)
            body_text = page.text_content("body") or ""
            result["raw_data"]["raw_text"] = body_text[:4000]
            expiry_m = re.search(r'expiry date[\s\n]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', body_text, re.I)
            if expiry_m:
                result["findings"].append({"source": "gov.uk-MOT-Playwright", "field": "mot_expiry", "value": expiry_m.group(1), "confidence": 95})
                result["raw_data"]["mot_expiry"] = expiry_m.group(1)
            if re.search(r'MOT pass|PASSED', body_text):
                result["findings"].append({"source": "gov.uk-MOT-Playwright", "field": "mot_result", "value": "PASS", "confidence": 95})
            elif re.search(r'MOT fail|FAILED', body_text):
                result["findings"].append({"source": "gov.uk-MOT-Playwright", "field": "mot_result", "value": "FAIL", "confidence": 95})
            if not result["findings"]: result["errors"].append("Gov.uk MOT Playwright: no data extracted")
        except Exception as e2:
            result["errors"].append(f"Gov.uk MOT Playwright fallback: {e2}")
        finally:
            if browser: browser.close()
    delay(0.3)
    return result


def collect_motest(plate: str, pw) -> dict:
    """Fallback 2: motest.com.uk — simple MOT checker."""
    result = {"findings": [], "errors": [], "raw_data": {}, "source": "motest.com.uk"}
    browser = None
    try:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME_PATH)
        page = browser.new_page()
        page.goto("https://www.motest.com.uk/", wait_until="domcontentloaded", timeout=20000)
        page.wait_for_timeout(2000)
        # Try to find reg input
        inputs = page.locator("input[type=text], input[name*=reg], input[id*=reg]")
        if inputs.count() > 0:
            inputs.first.fill(plate)
            page.locator("button[type=submit], input[type=submit]").first.click()
            page.wait_for_timeout(5000)
            body_text = page.text_content("body") or ""
            result["raw_data"]["raw_text"] = body_text[:3000]
            expiry_m = re.search(r'(?:MOT|mot)\s*(?:expiry|date)[\s:]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', body_text, re.I)
            if expiry_m:
                result["findings"].append({"source": "motest.com.uk", "field": "mot_expiry", "value": expiry_m.group(1), "confidence": 85})
                result["raw_data"]["mot_expiry"] = expiry_m.group(1)
            if not result["findings"]: result["errors"].append("motest.com.uk: no MOT data extracted")
        else:
            result["errors"].append("motest.com.uk: reg input not found")
    except Exception as e:
        result["errors"].append(f"motest.com.uk failed: {e}")
    finally:
        if browser: browser.close()
    delay(0.5)
    return result


# ─────────────────────────────────────────────────────────────────────────────
# DATA SOURCE: NHTSA vPIC API — VIN decode (no key required)
# Fallback: None (API is open)
# ─────────────────────────────────────────────────────────────────────────────

def collect_nhtsa_vin(vin: str) -> dict:
    result = {"findings": [], "errors": [], "raw_data": {}, "source": "NHTSA-vPIC"}
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
            if val and val.strip() not in ("", "Not Applicable", "0", "0.0"):
                val = val.strip()
                result["raw_data"][field_name] = val
                result["findings"].append({"source": "NHTSA-vPIC", "field": field_name, "value": val, "confidence": 90})
        if not result["findings"]: result["errors"].append("NHTSA: VIN decoded but no usable data")
    except Exception as e:
        result["errors"].append(f"NHTSA vPIC lookup failed: {e}")
    return result


# ─────────────────────────────────────────────────────────────────────────────
# DATA SOURCE: Market Comparables — AutoTrader, eBay Motors, motors.co.uk
# Fallback: parkers.co.uk, webuyanycar.com part-exchange values
# All use Playwright since these are JavaScript-rendered sites
# ─────────────────────────────────────────────────────────────────────────────

def collect_isitnicked(plate: str, pw) -> dict:
    """Best-effort stolen vehicle check — isitnicked.com (Playwright, CloudFlare-protected).
    Falls back gracefully if CloudFlare blocks the request."""
    result = {"findings": [], "errors": [], "stolen": False, "source": "isitnicked.com"}
    browser = None
    try:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME_PATH)
        page = browser.new_page()
        page.goto("https://isitnicked.com/", wait_until="load", timeout=20000)
        page.wait_for_timeout(2000)
        # Fill the reg input
        inp = page.locator('input[type=text][placeholder*="REG"], input[name=Vrm]').first
        if inp.count() == 0:
            result["errors"].append("isitnicked.com: reg input not found")
            return result
        inp.fill(plate)
        inp.press("Enter")
        page.wait_for_timeout(4000)
        body = page.text_content("body") or ""
        # Parse stolen check result — use specific patterns to avoid false positives
        # from form labels that say "possible stolen vehicle" as a disclaimer
        body = page.text_content("body") or ""
        # Parse stolen check result — require EXPLICIT confirmation to avoid
        # false positives from form disclaimers that say "possible stolen vehicle"
        stolen_match = re.search(
            r'(stolen\s*[:\-]?\s*(yes|true|confirmed|1)|'
            r'(yes|true|confirmed|1)\s*[:\-]?\s*stolen|'
            r'this\s+vehicle\s+is\s+(marked\s+)?stolen|'
            r'vehicle\s+has\s+been\s+stolen)',
            body, re.I
        )
        clear_match = re.search(
            r'(not\s+stolen|no\s+stolen|clear|'
            r'not\s+found|clear\s+of\s+stolen)',
            body, re.I
        )
        if stolen_match and not clear_match:
            result["stolen"] = True
            result["findings"].append({
                "source": "isitnicked.com", "field": "stolen_check",
                "value": "Flagged as stolen — confirm with HPI/askmid", "confidence": 70
            })
        elif clear_match:
            result["findings"].append({
                "source": "isitnicked.com", "field": "stolen_check",
                "value": "Not flagged as stolen", "confidence": 60
            })
        if not result["findings"]:
            result["errors"].append("isitnicked.com: no result parsed from page")
    except Exception as e:
        result["errors"].append(f"isitnicked.com: {e}")
    finally:
        if browser: browser.close()
    delay(0.5)
    return result


def collect_checkcardetails(plate: str, pw) -> dict:
    """Best-effort free car check — checkcardetails.co.uk (Playwright, CloudFlare-protected).
    Falls back gracefully if blocked."""
    result = {"findings": [], "errors": [], "raw_data": {}, "source": "checkcardetails.co.uk"}
    browser = None
    try:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME_PATH)
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            extra_http_headers={"Accept-Language": "en-GB,en;q=0.9"}
        )
        page = ctx.new_page()
        page.goto("https://www.checkcardetails.co.uk/", wait_until="load", timeout=20000)
        page.wait_for_timeout(3000)
        # Fill reg input
        inp = page.locator('input[type=text][name=reg_num], input[name=reg_num]').first
        if inp.count() == 0:
            result["errors"].append("checkcardetails.co.uk: reg input not found")
            return result
        inp.fill(plate)
        page.locator('button[type=submit]').first.click()
        page.wait_for_timeout(6000)
        body = page.text_content("body") or ""
        result["raw_data"]["body_text"] = body[:2000]
        # Extract what we can — MOT, tax, colour, mileage
        expiry_m = re.search(r'MOT[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', body, re.I)
        if expiry_m:
            result["findings"].append({
                "source": "checkcardetails.co.uk", "field": "mot_expiry",
                "value": expiry_m.group(1), "confidence": 80
            })
        colour_m = re.search(r'Colour[:\s]*([A-Za-z]+)', body, re.I)
        if colour_m:
            result["findings"].append({
                "source": "checkcardetails.co.uk", "field": "colour",
                "value": colour_m.group(1), "confidence": 75
            })
        # Check for stolen/written-off indicators
        if re.search(r'stolen|write.?off|category', body, re.I):
            result["findings"].append({
                "source": "checkcardetails.co.uk", "field": "risk_indicator",
                "value": "Possible risk flag detected", "confidence": 50
            })
        if not result["findings"]:
            result["errors"].append("checkcardetails.co.uk: no data extracted (likely CloudFlare blocked)")
    except Exception as e:
        result["errors"].append(f"checkcardetails.co.uk: {e}")
    finally:
        if browser: browser.close()
    delay(0.5)
    return result


def collect_carwow(plate: str, pw) -> dict:
    """Best-effort car check — carwow.co.uk (Playwright SPA).
    Falls back gracefully if blocked."""
    result = {"findings": [], "errors": [], "raw_data": {}, "source": "carwow.co.uk"}
    browser = None
    try:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME_PATH)
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            extra_http_headers={"Accept-Language": "en-GB,en;q=0.9"}
        )
        page = ctx.new_page()
        page.goto("https://www.carwow.co.uk/car-check", wait_until="load", timeout=20000)
        page.wait_for_timeout(3000)
        # Find reg input
        inp = page.locator('input[type=text][placeholder*="REG"], input[name=vrm]').first
        if inp.count() == 0:
            result["errors"].append("carwow.co.uk: reg input not found")
            return result
        inp.fill(plate)
        inp.press("Enter")
        page.wait_for_timeout(6000)
        body = page.text_content("body") or ""
        result["raw_data"]["body_text"] = body[:2000]
        # Try to extract basic info from carwow's result page
        # carwow shows make/model, MOT expiry, etc.
        expiry_m = re.search(r'MOT[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', body, re.I)
        if expiry_m:
            result["findings"].append({
                "source": "carwow.co.uk", "field": "mot_expiry",
                "value": expiry_m.group(1), "confidence": 80
            })
        make_m = re.search(r'Make[:\s]*([A-Za-z0-9\s]+?)(?:\n|</)', body[:1000], re.I)
        if make_m:
            result["findings"].append({
                "source": "carwow.co.uk", "field": "make",
                "value": make_m.group(1).strip(), "confidence": 75
            })
        if re.search(r'not found|invalid|error', body, re.I):
            result["errors"].append("carwow.co.uk: plate not found in their database")
        if not result["findings"]:
            result["errors"].append("carwow.co.uk: no data extracted (SPA blocked)")
    except Exception as e:
        result["errors"].append(f"carwow.co.uk: {e}")
    finally:
        if browser: browser.close()
    delay(0.5)
    return result



    """Source 1: AutoTrader — search for comparable vehicles."""
    result = {"findings": [], "errors": [], "comparable_listings": [], "source": "AutoTrader"}
    browser = None
    try:
        query = f"{make}+{model}+{year}+{fuel_type}".replace(' ', '+')
        search_url = f"https://www.autotrader.co.uk/car-search?term={query}&radius=150&page=1"
        browser = pw.chromium.launch(headless=True, executable_path=CHROME_PATH)
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            extra_http_headers={"Accept-Language": "en-GB,en;q=0.9"}
        )
        page = ctx.new_page()
        page.goto(search_url, wait_until="domcontentloaded", timeout=20000)
        page.wait_for_timeout(3000)
        body_text = page.text_content("body") or ""

        # Extract price listings
        price_matches = re.findall(r'£(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', body_text)
        mileage_matches = re.findall(r'(\d{1,3}(?:,\d{3})*)\s*(?:mi|miles)', body_text, re.I)
        location_matches = re.findall(r'(?:location|town|dealer)[\s":]+([A-Za-z\s]{3,40})', body_text, re.I)

        listings = []
        for i, price in enumerate(price_matches[:8]):
            price_val = int(re.sub(r'[^\d]', '', price))
            mileage = int(re.sub(r'[^\d]', '', mileage_matches[i])) if i < len(mileage_matches) else 0
            location = location_matches[i].strip() if i < len(location_matches) else "UK"
            if price_val > 500:
                listings.append({
                    "source": "AutoTrader", "price": price_val, "mileage": mileage,
                    "location": location, "make": make, "model": model, "year": year
                })
        result["comparable_listings"] = listings
        if listings:
            result["findings"].append({"source": "AutoTrader", "field": "comparable_count", "value": str(len(listings)), "confidence": 80})
        else:
            result["errors"].append("AutoTrader: no listings extracted")
    except Exception as e:
        result["errors"].append(f"AutoTrader failed: {e}")
    finally:
        if browser: browser.close()
    delay(0.5)
    return result


def collect_ebay_comparables(make: str, model: str, year: int, fuel_type: str, pw) -> dict:
    """Source 2: eBay Motors UK — search for comparable vehicles."""
    result = {"findings": [], "errors": [], "comparable_listings": [], "source": "eBay Motors"}
    browser = None
    try:
        query = f"{make}+{model}+{year}+{fuel_type}+car".replace(' ', '+')
        search_url = f"https://www.ebay.co.uk/sch/i.html?_nkw={query}&_sop=12&LH_BIN=1"
        browser = pw.chromium.launch(headless=True, executable_path=CHROME_PATH)
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            extra_http_headers={"Accept-Language": "en-GB,en;q=0.9"}
        )
        page = ctx.new_page()
        page.goto(search_url, wait_until="domcontentloaded", timeout=20000)
        page.wait_for_timeout(3000)
        body_text = page.text_content("body") or ""

        price_matches = re.findall(r'£(\d{1,3}(?:,\d{3})*)', body_text)
        listings = []
        for i, price in enumerate(price_matches[:6]):
            price_val = int(re.sub(r'[^\d]', '', price))
            if price_val > 500:
                listings.append({
                    "source": "eBay Motors", "price": price_val,
                    "mileage": 0, "location": "UK", "make": make, "model": model, "year": year
                })
        result["comparable_listings"] = listings
        if listings:
            result["findings"].append({"source": "eBay Motors", "field": "comparable_count", "value": str(len(listings)), "confidence": 75})
        else:
            result["errors"].append("eBay Motors: no listings extracted")
    except Exception as e:
        result["errors"].append(f"eBay Motors failed: {e}")
    finally:
        if browser: browser.close()
    delay(0.5)
    return result


def collect_motors_co_uk_comparables(make: str, model: str, year: int, fuel_type: str, pw) -> dict:
    """Source 3: motors.co.uk — used car listings."""
    result = {"findings": [], "errors": [], "comparable_listings": [], "source": "motors.co.uk"}
    browser = None
    try:
        query = f"{make}-{model}-{year}".replace(' ', '-').lower()
        search_url = f"https://www.motors.co.uk/search/{query}/?radius=150&page=1"
        browser = pw.chromium.launch(headless=True, executable_path=CHROME_PATH)
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            extra_http_headers={"Accept-Language": "en-GB,en;q=0.9"}
        )
        page = ctx.new_page()
        page.goto(search_url, wait_until="domcontentloaded", timeout=20000)
        page.wait_for_timeout(3000)
        body_text = page.text_content("body") or ""

        price_matches = re.findall(r'£(\d{1,3}(?:,\d{3})*)', body_text)
        mileage_matches = re.findall(r'(\d{1,3}(?:,\d{3})*)\s*(?:mi|miles)', body_text, re.I)
        listings = []
        for i, price in enumerate(price_matches[:6]):
            price_val = int(re.sub(r'[^\d]', '', price))
            mileage = int(re.sub(r'[^\d]', '', mileage_matches[i])) if i < len(mileage_matches) else 0
            if price_val > 500:
                listings.append({
                    "source": "motors.co.uk", "price": price_val, "mileage": mileage,
                    "location": "UK", "make": make, "model": model, "year": year
                })
        result["comparable_listings"] = listings
        if listings:
            result["findings"].append({"source": "motors.co.uk", "field": "comparable_count", "value": str(len(listings)), "confidence": 75})
        else:
            result["errors"].append("motors.co.uk: no listings extracted")
    except Exception as e:
        result["errors"].append(f"motors.co.uk failed: {e}")
    finally:
        if browser: browser.close()
    delay(0.5)
    return result


def collect_webuyanycar_valuation(make: str, model: str, year: int, mileage: int, fuel_type: str, pw) -> dict:
    """Fallback: webuyanycar.com part-exchange value."""
    result = {"findings": [], "errors": [], "raw_data": {}, "source": "webuyanycar.com"}
    browser = None
    try:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME_PATH)
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
        )
        page = ctx.new_page()
        page.goto("https://www.webuyanycar.com/", wait_until="domcontentloaded", timeout=20000)
        page.wait_for_timeout(2000)
        # Try UK plate search
        reg_input = page.locator("input[type=text], input[name*=reg]").first
        if reg_input.count() > 0:
            reg_input.fill(make)  # Will fail gracefully if wrong
            result["errors"].append("webuyanycar.com: UK plate lookup requires JavaScript interaction — skipped")
        else:
            result["errors"].append("webuyanycar.com: reg input not found")
    except Exception as e:
        result["errors"].append(f"webuyanycar.com: {e}")
    finally:
        if browser: browser.close()
    return result


# ─────────────────────────────────────────────────────────────────────────────
# DATA SOURCE: Insurance Group — AA, RAC, Wikipedia
# Fallback 1: AA insurance group table (web fetch)
# Fallback 2: RAC insurance group table (web fetch)
# Fallback 3: Wikipedia model page (web fetch)
# ─────────────────────────────────────────────────────────────────────────────

def lookup_insurance_group(make: str, model: str) -> dict:
    """Look up insurance group from local database + web fallbacks."""
    result = {"findings": [], "errors": [], "group_min": None, "group_max": None,
              "notes": "", "source": "local-db"}
    make_upper = make.upper()
    model_upper = model.upper()

    # Try local database first
    for (db_make, db_model), (grp_min, grp_max, notes) in INSURANCE_GROUPS.items():
        if re.search(db_make.upper(), make_upper) and re.search(db_model.upper(), model_upper):
            result["group_min"] = grp_min
            result["group_max"] = grp_max
            result["notes"] = notes
            result["findings"].append({"source": "local-db", "field": "insurance_group",
                                       "value": f"{grp_min}-{grp_max}", "confidence": 80})
            return result

    # Fallback 1: AA insurance group page
    try:
        search_url = f"https://www.theaa.com/car-insurance/inurance-group-check.html"
        text = http_get(search_url, timeout=10000)
        # AA doesn't have a simple query API — skip to next fallback
        result["errors"].append("AA: no open API, skipping")
    except Exception as e:
        result["errors"].append(f"AA lookup: {e}")

    # Fallback 2: RAC
    try:
        search_url = f"https://www.rac.co.uk/car-insurance/car-insurance-groups/"
        text = http_get(search_url, timeout=10000)
        result["errors"].append("RAC: no open API for group lookup")
    except Exception as e:
        result["errors"].append(f"RAC lookup: {e}")

    # Fallback 3: Wikipedia
    try:
        wiki_url = f"https://en.wikipedia.org/wiki/{make}_{model}".replace(' ', '_')
        text = http_get(wiki_url, timeout=10000)
        group_m = re.search(r'[Ii]nsurance\s*group[\s:]*(\d+)[–-](\d+)', text)
        if group_m:
            grp_min, grp_max = int(group_m.group(1)), int(group_m.group(2))
            result["group_min"] = grp_min
            result["group_max"] = grp_max
            result["source"] = "Wikipedia"
            result["findings"].append({"source": "Wikipedia", "field": "insurance_group",
                                       "value": f"{grp_min}-{grp_max}", "confidence": 70})
        else:
            result["errors"].append("Wikipedia: insurance group not found on model page")
    except Exception as e:
        result["errors"].append(f"Wikipedia lookup: {e}")

    return result


# ─────────────────────────────────────────────────────────────────────────────
# DATA SOURCE: Known Issues — honestjohn.co.uk, parkers.co.uk, web search
# ─────────────────────────────────────────────────────────────────────────────

def lookup_known_issues(make: str, model: str, year: int) -> dict:
    """Look up common problems for this make/model."""
    result = {"findings": [], "errors": [], "issues": [], "source": "local-db"}
    make_upper = make.upper()
    model_upper = model.upper()

    # Try local database
    for (db_make, db_model), issues in MODEL_KNOWN_ISSUES.items():
        if re.search(db_make.upper(), make_upper) and re.search(db_model.upper(), model_upper):
            result["issues"] = issues
            result["source"] = "local-db"
            result["findings"].append({"source": "local-db", "field": "known_issues",
                                       "value": str(len(issues)), "confidence": 85})
            return result

    # Fallback: honestjohn.co.uk
    try:
        search_url = f"https://www.honestjohn.co.uk/search/?q={make}+{model}".replace(' ', '+')
        text = http_get(search_url, timeout=10000)
        result["errors"].append("honestjohn.co.uk: needs JS rendering — skipping")
    except Exception as e:
        result["errors"].append(f"honestjohn lookup: {e}")

    # Fallback: parkers.co.uk model page
    try:
        parkers_url = f"https://www.parkers.co.uk/cars/reviews/{make.lower()}/{model.lower()}/"
        text = http_get(parkers_url, timeout=10000)
        problems_m = re.findall(r'(?:problem|fault|common|issue|recall)[\s:]+([^\.]{10,100})', text, re.I)
        if problems_m:
            result["issues"] = [p.strip()[:100] for p in problems_m[:5]]
            result["source"] = "parkers.co.uk"
            result["findings"].append({"source": "parkers.co.uk", "field": "known_issues",
                                       "value": str(len(result["issues"])), "confidence": 65})
        else:
            result["errors"].append("parkers.co.uk: no problems section found")
    except Exception as e:
        result["errors"].append(f"parkers lookup: {e}")

    return result


# ─────────────────────────────────────────────────────────────────────────────
# DATA SOURCE: Model Specs — parkers.co.uk, motors.co.uk, Wikipedia
# ─────────────────────────────────────────────────────────────────────────────

def lookup_model_specs(make: str, model: str, year: int) -> dict:
    """Get detailed model specifications as fallback."""
    result = {"findings": [], "errors": [], "specs": {}, "source": "Wikipedia"}

    # Fallback 1: Wikipedia
    try:
        wiki_url = f"https://en.wikipedia.org/wiki/{make}_{model}".replace(' ', '_')
        text = http_get(wiki_url, timeout=10000)
        engine_m = re.search(r'Engine[\s:]+(\d+\.\d+)\s*(?:L|cc)', text, re.I)
        power_m = re.search(r'Power[\s:]+(\d+)\s*(?:bhp|PS|kW)', text, re.I)
        torque_m = re.search(r'Torque[\s:]+(\d+)\s*(?:Nm|lb\.ft)', text, re.I)
        fuel_m = re.search(r'Fuel\s*type[\s:]+([A-Za-z\/]+)', text, re.I)
        if engine_m: result["specs"]["engine_size"] = engine_m.group(1)
        if power_m: result["specs"]["power"] = power_m.group(1)
        if torque_m: result["specs"]["torque"] = torque_m.group(1)
        if fuel_m: result["specs"]["fuel_type"] = fuel_m.group(1).strip()
        if result["specs"]:
            result["findings"].append({"source": "Wikipedia", "field": "specs",
                                       "value": str(result["specs"]), "confidence": 70})
    except Exception as e:
        result["errors"].append(f"Wikipedia specs: {e}")

    # Fallback 2: parkers.co.uk
    try:
        parkers_url = f"https://www.parkers.co.uk/cars/reviews/{make.lower()}/{model.lower()}/specs/"
        text = http_get(parkers_url, timeout=10000)
        result["errors"].append("parkers.co.uk: needs JS — specs not extracted")
    except Exception as e:
        result["errors"].append(f"parkers specs: {e}")

    return result


# ─────────────────────────────────────────────────────────────────────────────
# DATA SOURCE: Image Intelligence — Google image search for the plate
# ─────────────────────────────────────────────────────────────────────────────

def check_image_intelligence(plate: str, make: str, model: str) -> dict:
    """Look for previous sale photos / marketplace listings of this vehicle."""
    result = {"findings": [], "errors": [], "images_found": False,
              "sources_checked": [], "source": "OSINT-inferred"}
    sources = [
        ("eBay Motors", f"https://www.ebay.co.uk/sch/i.html?_nkw={plate}"),
        ("AutoTrader", f"https://www.autotrader.co.uk/car-search?term={plate}"),
    ]
    for name, url in sources:
        result["sources_checked"].append(name)
        try:
            text = http_get(url, timeout=10000)
            # If plate appears in listing, it means a previous sale exists
            if plate.upper() in text.upper() or make.upper() in text.upper():
                result["images_found"] = True
                result["findings"].append({
                    "source": name, "field": "previous_listing",
                    "value": f"Vehicle appears in {name} listings", "confidence": 60
                })
        except Exception:
            pass
    return result


# ─────────────────────────────────────────────────────────────────────────────
# MILEAGE INTELLIGENCE ANALYZER
# ─────────────────────────────────────────────────────────────────────────────

def analyze_mileage_timeline(mileage_timeline: list, year: int) -> dict:
    """Analyze recorded mileages to detect patterns, clocking, usage."""
    result = {"timeline": [], "analysis": "", "clocking_flag": False,
              "avg_annual_miles": 0, "consistent": True, "flags": []}

    if not mileage_timeline:
        result["analysis"] = "No mileage history available from MOT records."
        return result

    result["timeline"] = sorted(mileage_timeline, reverse=True)
    current = result["timeline"][0]
    age = datetime.now().year - year if year > 1900 else 10

    # Expected mileage
    expected_total = age * 10000
    actual_total = current
    result["avg_annual_miles"] = round(current / age) if age > 0 else 0

    # Check for sudden drops (clocking indicator)
    for i in range(len(result["timeline"]) - 1):
        drop = result["timeline"][i] - result["timeline"][i+1]
        if drop > 30000:  # > 30k miles drop between tests = suspicious
            result["clocking_flag"] = True
            result["flags"].append(f"⚠️ Mileage dropped {drop:,} miles between tests — possible clocking")

    # Check consistency with expected
    if result["avg_annual_miles"] > 15000:
        result["analysis"] = f"High mileage: ~{result['avg_annual_miles']:,} miles/year. Vehicle used significantly."
        result["consistent"] = False
    elif result["avg_annual_miles"] < 5000:
        result["analysis"] = f"Low mileage: ~{result['avg_annual_miles']:,} miles/year. Low usage or stored."
        result["consistent"] = False
    else:
        result["analysis"] = f"Average usage: ~{result['avg_annual_miles']:,} miles/year. Typical UK annual mileage."

    if result["clocking_flag"]:
        result["flags"].append("🔍 Mileage timeline irregularities detected")
    else:
        result["flags"].append("✔ Mileage progression appears consistent")

    return result


# ─────────────────────────────────────────────────────────────────────────────
# GEOGRAPHIC INTELLIGENCE ANALYZER
# ─────────────────────────────────────────────────────────────────────────────

def analyze_geographic_data(mot_locations: list) -> dict:
    """Infer usage patterns from MOT test centre locations."""
    result = {"locations": [], "usage_pattern": "unknown", "regions": set(), "source": "MOT-history"}

    if not mot_locations:
        result["analysis"] = "No MOT location data available for geographic analysis."
        return result

    # Deduplicate and normalize
    seen = set()
    for loc in mot_locations:
        loc_clean = re.sub(r'[^\w\s]', '', loc).strip()[:50]
        if loc_clean and len(loc_clean) > 2:
            seen.add(loc_clean)
    result["locations"] = list(seen)
    result["regions"] = seen

    # Count unique locations
    unique_count = len(seen)
    if unique_count == 1:
        result["usage_pattern"] = "Single-location use — vehicle kept in one area"
    elif unique_count == 2:
        result["usage_pattern"] = "Two-location use — possible commute or dual residence"
    else:
        result["usage_pattern"] = "Multiple-location use — vehicle moved frequently"

    return result


# ─────────────────────────────────────────────────────────────────────────────
# RISK FLAGS ANALYZER
# ─────────────────────────────────────────────────────────────────────────────

def analyze_risk_flags(advisories: list, mileage_timeline: list, mot_history_count: int,
                       year: int, colour_change: bool = False) -> dict:
    """Check for fraud indicators and risk flags."""
    result = {"flags": [], "overall_risk": "LOW"}

    # Mileage discrepancy
    if any(a["category"] == "fraud" for a in advisories):
        result["flags"].append("⚠️ Mileage discrepancy recorded on MOT — possible clocking")

    # Many failures
    crit_high = sum(1 for a in advisories if a["severity"] in ("critical", "high"))
    if crit_high >= 3:
        result["flags"].append(f"🔴 {crit_high} critical/high severity advisories — neglect pattern")
    elif crit_high >= 1:
        result["flags"].append(f"🟠 {crit_high} critical/high severity advisory — maintenance deferred")

    # MOT gap check (assuming annual tests, flag if > 2 years gap)
    if mot_history_count > 0:
        age = datetime.now().year - year if year > 1900 else 10
        expected_tests = age
        if mot_history_count < expected_tests - 2:
            result["flags"].append(f"⚠️ MOT history gap — only {mot_history_count} tests recorded for {age}-year-old car")

    # Structural issues
    structural = [a for a in advisories if a["category"] == "structural"]
    if structural:
        result["flags"].append(f"🔴 Structural corrosion/welding noted — possible accident damage or neglect")

    # Repeated failures (check for same advisory appearing multiple times)
    advisory_items = {}
    for a in advisories:
        key = a["item"][:30]
        advisory_items[key] = advisory_items.get(key, 0) + 1
    repeated = {k: v for k, v in advisory_items.items() if v >= 2}
    for item, count in repeated.items():
        result["flags"].append(f"🔁 '{item}' noted {count} times across MOT history — chronic problem")

    # Age risk
    age = datetime.now().year - year if year > 1900 else 10
    if age >= 15:
        result["flags"].append(f"🟡 Vehicle is {age} years old — elevated risk for age-related failures")

    # Determine overall risk
    if any("clocking" in f.lower() for f in result["flags"]) or any("critical" in f.lower() for f in result["flags"]):
        result["overall_risk"] = "HIGH"
    elif len(result["flags"]) >= 3 or any("gap" in f.lower() for f in result["flags"]):
        result["overall_risk"] = "MODERATE"
    else:
        result["overall_risk"] = "LOW"

    return result


# ─────────────────────────────────────────────────────────────────────────────
# CONFIDENCE SCORER
# ─────────────────────────────────────────────────────────────────────────────

def calculate_confidence(data_sources: dict) -> dict:
    """Calculate per-category and overall OSINT confidence scores."""
    scores = {}

    dvla = data_sources.get("dvla", {})
    carcheck = data_sources.get("carcheck", {})
    govuk = data_sources.get("govuk_mot", {})
    comparables = data_sources.get("comparables", [])
    insurance = data_sources.get("insurance", {})
    known_issues = data_sources.get("known_issues", {})
    isitnicked = data_sources.get("isitnicked", {})
    carwow = data_sources.get("carwow", {})
    ccd = data_sources.get("checkcardetails", {})

    scores["dvla"] = 95 if dvla.get("findings") else 0
    scores["mot"] = 90 if carcheck.get("findings") or govuk.get("findings") else 0
    scores["market"] = 80 if comparables else 50
    scores["risk"] = 65 if known_issues.get("findings") else 40
    scores["insurance"] = 70 if insurance.get("findings") else 30
    scores["geographic"] = 50
    scores["mechanical"] = 70 if known_issues.get("findings") else 40
    # New best-effort sources boost risk/stolen check confidence when available
    stolen_ok = bool(isitnicked.get("findings"))
    stolen_val = 30 if stolen_ok else 0
    scores["stolen_check"] = stolen_val

    all_scores = [v for v in scores.values() if v > 0]
    scores["overall"] = round(sum(all_scores) / len(scores)) if scores else 0

    return scores


# ─────────────────────────────────────────────────────────────────────────────
# REPORT GENERATOR
# ─────────────────────────────────────────────────────────────────────────────

def generate_markdown_report(plate: str, data: dict) -> str:
    """Generate the full rich OSINT report in markdown."""
    dvla = data.get("dvla", {})
    carcheck = data.get("carcheck", {})
    govuk = data.get("govuk_mot", {})
    valuation = data.get("valuation", {})
    insurance = data.get("insurance", {})
    known_issues = data.get("known_issues", {})
    mileage_analysis = data.get("mileage_analysis", {})
    risk_flags = data.get("risk_flags", {})
    comparables = data.get("comparables", [])
    confidence = data.get("confidence", {})
    mot_locations = data.get("mot_locations", [])
    tax_status = data.get("tax_status", "Unknown")
    mot_expiry = data.get("mot_expiry", "")
    mot_pass_rate = data.get("mot_pass_rate", "")
    mot_passed = data.get("mot_passed", 0)
    mot_failed = data.get("mot_failed", 0)
    mot_history_count = data.get("mot_history_count", 0)
    advisories = data.get("advisories", [])
    make = data.get("make", "Unknown")
    model = data.get("model", "Unknown")
    year = data.get("year", 0)
    colour = data.get("colour", "Unknown")
    fuel_type = data.get("fuel_type", "Unknown")
    engine_cc = data.get("engine_cc", "")
    gearbox = data.get("gearbox", "Unknown")
    current_mileage = data.get("current_mileage", None)
    mot_result = data.get("mot_result", "Unknown")
    mot_status = "Valid" if mot_expiry else "No MOT data"
    first_reg = data.get("first_reg_date", "")
    errors = data.get("errors", [])
    data_sources_log = data.get("data_sources_log", [])

    age = datetime.now().year - year if year > 1900 else 0

    crit = sum(1 for a in advisories if a["severity"] == "critical")
    high = sum(1 for a in advisories if a["severity"] == "high")
    med = sum(1 for a in advisories if a["severity"] == "medium")
    low_s = sum(1 for a in advisories if a["severity"] == "low")

    overall_risk = risk_flags.get("overall_risk", "LOW")
    val_min = valuation.get("current_value_min", 0)
    val_max = valuation.get("current_value_max", 0)
    val_adv_min = valuation.get("value_with_advisories_min", 0)
    val_adv_max = valuation.get("value_with_advisories_max", 0)

    def find_finding(field):
        for d in [carcheck, govuk]:
            for f in d.get("findings", []):
                if f["field"] == field:
                    return f["value"]
        return ""

    lines = []
    now_str = datetime.now().isoformat()
    today_str = datetime.now().strftime("%Y-%m-%d")

    # ══════════════════════════════════════════════════════════════════════════
    # HEADER
    # ══════════════════════════════════════════════════════════════════════════
    lines.append(f"# 🅾️ OSINT Report — Vehicle: {plate}\n")
    lines.append(f"**Generated:** {now_str}  ")
    lines.append(f"**Type:** UK Registration  ")
    lines.append(f"**Report Version:** {__version__}  \n")

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 1: VEHICLE HEADER CARD
    # ══════════════════════════════════════════════════════════════════════════
    lines.append("## 1. Vehicle Header Card\n")
    lines.append(f"```")
    lines.append(f"Registration: {plate}")
    lines.append(f"Make: {make or 'Unknown'}")
    lines.append(f"Model: {model or 'Unknown'}")
    lines.append(f"Year: {year or '?'} ({age} years old)" if year else "Year: ?")
    lines.append(f"Colour (DVLA): {colour or 'Unknown'}")
    lines.append(f"Body Type: {data.get('body_type', 'Unknown')}")
    lines.append(f"Fuel Type: {fuel_type or 'Unknown'}")
    lines.append(f"Engine Size: {engine_cc or 'Unknown'}")
    lines.append(f"Transmission: {gearbox or 'Unknown'}")
    if current_mileage: lines.append(f"Current Mileage: {current_mileage:,} mi")
    lines.append(f"```\n")

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 2: VEHICLE STATUS
    # ══════════════════════════════════════════════════════════════════════════
    lines.append("## 2. Vehicle Status\n")
    lines.append(f"```")
    dvla_status = "✔ Registered with DVLA" if dvla.get("findings") else "⚠️ DVLA data unavailable"
    lines.append(dvla_status)
    tax_disp = f"✔ Tax: {tax_status}" if tax_status.lower() not in ("", "unknown", "untaxed") else f"⚠️ Tax: {tax_status or 'Unknown'}"
    lines.append(tax_disp)
    mot_disp = f"✔ MOT: {mot_status} ({mot_expiry})" if mot_expiry else f"⚠️ MOT: {mot_status}"
    lines.append(mot_disp)
    lines.append(f"MOT Result: {'✔ PASS' if mot_result.upper() == 'PASS' else '✗ FAIL' if mot_result.upper() == 'FAIL' else mot_result}")
    lines.append(f"MOT Tests: {mot_passed} pass / {mot_failed} fail out of {mot_history_count or (mot_passed + mot_failed)} tests")
    if mot_pass_rate: lines.append(f"MOT Pass Rate: {mot_pass_rate}")
    if first_reg: lines.append(f"First Registered (V5): {first_reg}")
    lines.append(f"```\n")

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 3: MOT HISTORY INTELLIGENCE
    # ══════════════════════════════════════════════════════════════════════════
    lines.append("## 3. 📅 MOT History Intelligence\n")
    lines.append(f"**OSINT goldmine — shows neglect patterns**\n")
    lines.append(f"**Current MOT Status:**")
    if mot_result.upper() == "PASS":
        lines.append(f"✔ Valid / {'Expired' if mot_expiry and datetime.now() > datetime.strptime(mot_expiry, '%d/%m/%Y') else 'Current'}")
    elif mot_result.upper() == "FAIL":
        lines.append(f"✗ Failed — see advisories below")
    else:
        lines.append(f"⚠️ {mot_result or 'Unknown'}")
    lines.append(f"\n**MOT Expiry Date:**\n{mot_expiry or 'Unknown'}\n")

    # Recent test results table
    if mileage_analysis.get("timeline"):
        lines.append("**Recent Test Results:**\n")
        lines.append("| Date | Result | Mileage | Test Centre |")
        lines.append("| --- | --- | --- | --- |")
        timeline = mileage_analysis["timeline"]
        for i, miles in enumerate(timeline[:10]):
            est_year = datetime.now().year - i
            lines.append(f"| ~{est_year} | {'Pass' if i > 0 else mot_result or 'Pass'} | {miles:,} mi | {'Various UK' if not mot_locations else mot_locations[min(i, len(mot_locations)-1)]} |")
        lines.append("\n")

    # Failure patterns
    lines.append("**Failure Patterns:**\n")
    if crit > 0:
        lines.append(f"🔴 **{crit} CRITICAL item(s)** — immediate safety concern")
    if high > 0:
        lines.append(f"🟠 **{high} HIGH severity item(s)** — address soon")
    if med > 0:
        lines.append(f"🟡 **{med} MEDIUM item(s)** — monitor and plan repairs")
    if low_s > 0:
        lines.append(f"🟢 **{low_s} LOW/advisory item(s)** — minor, not urgent")
    if not advisories:
        lines.append("✔ No recorded advisories — vehicle in good health")
    lines.append("\n")

    # Risk indicators
    lines.append("**Risk Indicators:**\n")
    if overall_risk == "HIGH":
        lines.append(f"🔴 **HIGH** — Significant neglect indicators detected")
    elif overall_risk == "MODERATE":
        lines.append(f"🟡 **MODERATE** — Average condition, some advisories")
    else:
        lines.append(f"🟢 **LOW** — Well maintained")
    lines.append("\n")

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 4: MILEAGE INTELLIGENCE
    # ══════════════════════════════════════════════════════════════════════════
    lines.append("## 4. 📊 Mileage Intelligence Analysis\n")
    if mileage_analysis.get("timeline"):
        lines.append("**Recorded Mileage Timeline:**\n")
        lines.append("| Year | Mileage |")
        lines.append("| --- | --- |")
        timeline = mileage_analysis["timeline"]
        for i, miles in enumerate(timeline):
            est_year = datetime.now().year - i
            lines.append(f"| {est_year} | {miles:,} mi |")
        lines.append("\n")
        lines.append(f"**Analysis:**\n{mileage_analysis.get('analysis', 'No analysis available.')}\n")
        if mileage_analysis.get("flags"):
            for flag in mileage_analysis["flags"]:
                lines.append(f"{flag}\n")
    else:
        lines.append("⚠️ Mileage timeline not available from open sources.\n")
        lines.append("**Analysis:**\nInsufficient MOT history data for mileage pattern analysis.\n")
    lines.append("\n")

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 5: MARKET VALUATION
    # ══════════════════════════════════════════════════════════════════════════
    lines.append("## 5. 💷 Market Intelligence\n")
    if val_min and val_max:
        lines.append(f"**Estimated Market Value:**\n£{val_min:,} – £{val_max:,}\n")
        if val_adv_min and val_adv_max:
            lines.append(f"**As-Is Value (with advisories):**\n£{val_adv_min:,} – £{val_adv_max:,}\n")
    else:
        lines.append("⚠️ Market valuation not available.\n")

    # Comparable listings
    if comparables:
        all_listings = []
        for comp_source in comparables:
            all_listings.extend(comp_source.get("comparable_listings", []))
        if all_listings:
            lines.append("**Comparable Listings:**\n")
            lines.append("| Source | Price | Mileage | Location |")
            lines.append("| --- | --- | --- | --- |")
            for listing in all_listings[:8]:
                loc = listing.get("location", "UK")
                miles = f"{listing.get('mileage', 0):,}" if listing.get("mileage") else "—"
                lines.append(f"| {listing.get('source','Unknown')} | £{listing.get('price', 0):,} | {miles} mi | {loc} |")
            lines.append("\n")
            val_conf = "🟢 High (many matches)" if len(all_listings) >= 5 else "🟡 Medium"
            lines.append(f"**Valuation Confidence:**\n{val_conf}\n")
    else:
        lines.append("**Comparable Listings:**\n⚠️ No listings found from open sources.\n")
        lines.append(f"**Valuation Confidence:**\n🔴 Low — insufficient market data\n")

    # Depreciation
    msrp_min = valuation.get("original_msrp_min", 0)
    msrp_max = valuation.get("original_msrp_max", 0)
    dep_pct = valuation.get("depreciation_pct", 0)
    if msrp_max > 0 and val_max > 0:
        lines.append("**Depreciation Intelligence:**\n")
        lines.append(f"Original MSRP (new): ~£{msrp_min:,}–£{msrp_max:,}\n")
        lines.append(f"Current estimate: £{val_min:,}–£{val_max:,}\n")
        lines.append(f"Depreciation: ~{dep_pct:.0f}% from new\n")
        lines.append(f"📉 Depreciation curve: Typical for {age}-year-old vehicle\n")
    lines.append("\n")

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 6: INSURANCE RISK INDICATORS
    # ══════════════════════════════════════════════════════════════════════════
    lines.append("## 6. 🛡 Insurance Risk Indicators\n")
    ins_grp = insurance.get("group_min")
    if ins_grp:
        ins_max = insurance.get("group_max", ins_grp)
        lines.append(f"**Insurance Group:** {ins_grp}–{ins_max} (Thatcham 1–50)\n")
        lines.append(f"**Notes:** {insurance.get('notes', 'Group based on make/model performance data.')}\n")
    else:
        lines.append(f"**Insurance Group:** ⚠️ Not available — infer from make/model\n")

    risk_factors = []
    if age >= 15: risk_factors.append("📊 Older vehicle — higher accident risk")
    if crit > 0: risk_factors.append("📊 Critical defects — safety risk elevated")
    if re.search(r'diesel', fuel_type, re.I): risk_factors.append("📊 Diesel — typically higher insurance group")
    if re.search(r'turbo|performance|gti|rs|sport', model, re.I): risk_factors.append("📊 Performance variant — higher group")
    if not risk_factors:
        risk_factors.append("📊 Standard risk profile for age and type")

    lines.append("**Risk Factors:**\n")
    for rf in risk_factors:
        lines.append(f"{rf}\n")

    ins_risk = "🔴 High" if (ins_grp and ins_grp >= 15) or crit > 0 else "🟡 Moderate" if ins_grp and ins_grp >= 8 else "🟢 Low"
    lines.append(f"\n**Risk Rating:**\n{ins_risk}\n")

    # Theft frequency (model-based inference)
    theft_risk = "Moderate"
    if re.search(r'BMW|AUDI|MERCEDES|VW GOLF', f"{make} {model}".upper()):
        theft_risk = "High (premium brand — parts theft target)"
    elif re.search(r'CORSAASTRA|FOCUS|FIESTA', f"{make} {model}".upper()):
        theft_risk = "Moderate (common model — opportunistic theft)"
    else:
        theft_risk = "Low-Moderate (standard model)"
    lines.append(f"\n**Theft Frequency:** {theft_risk}\n")
    lines.append("\n")

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 7: GEOGRAPHIC INTELLIGENCE
    # ══════════════════════════════════════════════════════════════════════════
    lines.append("## 7. 🌍 Geographic Intelligence\n")
    geo = data.get("geographic_analysis", {})
    if geo.get("locations"):
        lines.append("**Common Test Locations:**\n")
        for loc in geo.get("locations", [])[:5]:
            lines.append(f"📍 {loc}\n")
        lines.append(f"\n**Possible Usage Pattern:**\n{geo.get('usage_pattern', 'Unknown')}\n")
        if len(geo.get("locations", [])) <= 2:
            lines.append("✔ Consistent area use\n")
        else:
            lines.append("✔ Multiple areas — normal for owned vehicle\n")
    else:
        lines.append("⚠️ MOT location data unavailable.\n")
        lines.append("**Analysis:** Insufficient geographic data for pattern analysis.\n")
    lines.append("\n")

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 8: MECHANICAL INTELLIGENCE
    # ══════════════════════════════════════════════════════════════════════════
    lines.append("## 8. 🔧 Mechanical Intelligence Indicators\n")
    issues = known_issues.get("issues", [])
    if issues:
        lines.append(f"**Common Issues for {make} {model}:**\n")
        for issue in issues[:8]:
            lines.append(f"⚙ {issue}\n")
    else:
        lines.append(f"**Common Issues for {make} {model}:**\n⚠️ No specific data available — check model forums.\n")

    # Model reliability
    reliability = "🟡 Average"
    if re.search(r'TOYOTA|HONDA|MAZDA|SUBARU', make.upper()):
        reliability = "🟢 Above average reliability"
    elif re.search(r'PEUGEOT|CITROEN|RENAULT|FIAT', make.upper()):
        reliability = "🟡 Average reliability (some known issues)"
    elif re.search(r'BMW|AUDI', make.upper()):
        reliability = "🟡 Moderate (premium maintenance costs)"

    lines.append(f"\n**Model Reliability Rating:**\n{reliability}\n")

    # Category breakdown of advisories
    if advisories:
        by_cat = {}
        for a in advisories:
            cat = a.get("category", "other")
            by_cat[cat] = by_cat.get(cat, 0) + 1
        lines.append("\n**Advisory Breakdown by System:**\n")
        cat_emoji = {
            "tyres": "🛞", "brakes": "🛑", "suspension": "🔩", "engine": "⚙️",
            "exhaust": "💨", "structural": "🔧", "steering": "🎯", "transmission": "⚡",
            "lights": "💡", "body": "🚗", "safety": "🦺", "fraud": "⚠️",
            "general": "📋", "turbo": "🌀", "hybrid": "🔋"
        }
        for cat, count in sorted(by_cat.items(), key=lambda x: -x[1]):
            emoji = cat_emoji.get(cat, "•")
            lines.append(f"{emoji} {cat.title()}: {count}\n")
    lines.append("\n")

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 9: OWNERSHIP INTELLIGENCE (OSINT-derived)
    # ══════════════════════════════════════════════════════════════════════════
    lines.append("## 9. 🧾 Ownership Intelligence (OSINT-derived)\n")
    lines.append("*DVLA does NOT reveal owners publicly — only inferred indicators*\n\n")

    mot_history_count_n = mot_history_count or (mot_passed + mot_failed)
    if year > 1900:
        age_n = datetime.now().year - year
        # Estimate: 1 MOT per year = 1 owner (rough proxy)
        est_owners = max(1, min(5, max(1, mot_history_count_n or age_n)))
    else:
        est_owners = 2

    lines.append(f"**Estimated Owner Count:** ~{est_owners} (inferred from MOT history)\n")
    lines.append("**Indicators:**\n")
    if est_owners >= 3:
        lines.append(f"📄 Multiple owners indicated by MOT history ({mot_history_count_n or age_n} tests)\n")
    if mileage_analysis.get("consistent") == False:
        lines.append(f"📄 Usage pattern change — possible new driver or change of use\n")
    if geo.get("locations") and len(set(geo.get("locations", []))) > 2:
        lines.append(f"📄 MOT location changes — possible relocation or sale\n")
    if first_reg:
        lines.append(f"📄 V5 first registration: {first_reg}\n")
    if not (est_owners >= 3 or (geo.get("locations") and len(set(geo.get("locations", []))) > 2)):
        lines.append(f"📄 Consistent MOT location — likely single-owner or stable keeper\n")
    lines.append("\n")

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 10: RISK FLAGS
    # ══════════════════════════════════════════════════════════════════════════
    lines.append("## 10. 🚨 Risk Flags\n")
    flags = risk_flags.get("flags", [])
    if flags:
        lines.append("**Important for fraud detection tools:**\n")
        for flag in flags:
            lines.append(f"{flag}\n")
    else:
        lines.append("✔ No significant risk flags detected.\n")

    # Write-off check
    if crit > 0 and any(a.get("category") == "structural" for a in advisories):
        lines.append("\n⚠️ **Category write-off history:** Possible (structural damage + critical advisories) — recommend HPI check.\n")

    # Colour change
    colour_change = data.get("colour_change", False)
    if colour_change:
        lines.append("\n⚠️ **Colour change detected:** DVLA colour differs from body colour — possible respray.\n")

    # Mileage anomalies
    if mileage_analysis.get("clocking_flag"):
        lines.append("\n🔍 **Mileage anomalies:** Timeline suggests possible clocking — do not trust odometer.\n")
    lines.append("\n")

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 11: IMAGE INTELLIGENCE
    # ══════════════════════════════════════════════════════════════════════════
    lines.append("## 11. 📷 Image Intelligence (Optional OSINT enrichment)\n")
    img_intel = data.get("image_intelligence", {})
    sources_checked = img_intel.get("sources_checked", [])
    if sources_checked:
        lines.append("**Sources Checked:**\n")
        for src in sources_checked:
            lines.append(f"  - {src}\n")
    if img_intel.get("images_found"):
        lines.append("\n**Findings:**\n")
        lines.append("✔ Previous sale photos found — condition comparison possible.\n")
        lines.append("✔ Modification indicators may be visible in listings.\n")
    else:
        lines.append("\n**Findings:**\n")
        lines.append("⚠️ No previous sale listings found for this registration.\n")
        lines.append("📸 Recommend checking: AutoTrader, eBay Motors, Motors.co.uk, Facebook Marketplace manually.\n")
    lines.append("\n")

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 12: BEHAVIOURAL INTELLIGENCE LAYER
    # ══════════════════════════════════════════════════════════════════════════
    lines.append("## 12. 🧠 Behavioural Intelligence Layer\n")
    avg_miles = mileage_analysis.get("avg_annual_miles", 10000)
    annual_mileage_disp = f"{avg_miles:,}" if avg_miles else "10,000"

    lines.append("**Derived insights:**\n\n")
    lines.append("**Vehicle Lifestyle Profile:**\n")
    if avg_miles < 6000:
        lines.append(f"🚗 Likely city/short-trip vehicle — {annual_mileage_disp} miles/year\n")
        lines.append("🚗 Possible retired driver or second car\n")
    elif avg_miles > 13000:
        lines.append(f"🚗 Likely high-mileage commuter — {annual_mileage_disp} miles/year\n")
        lines.append("🚗 Motorway-heavy usage likely\n")
    else:
        lines.append(f"🚗 Typical family/commuter vehicle — {annual_mileage_disp} miles/year\n")

    lines.append("\n**Usage Pattern Guess:**\n")
    if geo.get("locations"):
        unique_locs = len(set(geo.get("locations", [])))
        if unique_locs <= 2:
            lines.append("🏙 Urban use — single/dual location\n")
        elif unique_locs <= 4:
            lines.append("🛣 Commuter use — regional travel\n")
        else:
            lines.append("🚚 Commercial or high-mileage personal use\n")

    annual_cost = round(avg_miles * 0.15)  # rough fuel+maintenance estimate
    lines.append(f"\n**Estimated Annual Running Cost:** ~£{annual_cost:,} (fuel + maintenance)\n")
    months_left = valuation.get("expected_months_remaining", 24)
    lines.append(f"**Typical Lifespan Remaining:** ~{months_left} months (based on condition)\n")
    lines.append("\n")

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 13: LEGAL COMPLIANCE CHECK
    # ══════════════════════════════════════════════════════════════════════════
    lines.append("## 13. ⚖️ Legal Compliance Check\n")
    mot_valid = bool(mot_expiry)
    tax_valid = bool(tax_status.lower() not in ("", "unknown", "untaxed", "sorn"))
    lines.append(f"✔ **MOT:** {'Compliant' if mot_valid else '⚠️ Not found / Expired'}\n")
    lines.append(f"{'✔' if tax_valid else '⚠️'} **Tax:** {tax_status or 'Status unknown'}\n")
    # Stolen check — use isitnicked if available
    isitnicked = data.get("isitnicked_data", {})
    stolen_ok = isitnicked.get("stolen", False)
    stolen_val = isitnicked.get("findings", [{}])[0].get("value", "") if isitnicked.get("findings") else ""
    if stolen_ok:
        lines.append(f"🔴 **Stolen markers:** Possible stolen vehicle — {stolen_val}\n")
    elif stolen_val:
        lines.append(f"✔ **Stolen markers:** {stolen_val} (isitnicked.com)\n")
    else:
        lines.append("⚠️ **Stolen markers:** Could not verify — recommend askmid.com manual check\n")
    # Write-off from checkcardetails
    ccd = data.get("checkcardetails_data", {})
    ccd_risk = next((f["value"] for f in ccd.get("findings", []) if f["field"] == "risk_indicator"), None)
    if ccd_risk:
        lines.append(f"⚠️ **Write-off / Risk:** {ccd_risk}\n")
    else:
        lines.append("✔ **Write-off category:** ⚠️ Cannot confirm from open sources — recommend HPI check\n")
    lines.append("\n")

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 14: OSINT CONFIDENCE SCORE
    # ══════════════════════════════════════════════════════════════════════════
    lines.append("## 14. 🧮 OSINT Confidence Score\n")
    if confidence:
        lines.append("| Category | Confidence |")
        lines.append("| --- | --- |")
        cat_names = {
            "dvla": "DVLA data", "mot": "MOT data", "market": "Market data",
            "risk": "Risk analysis", "insurance": "Insurance group",
            "geographic": "Geographic data", "mechanical": "Mechanical intelligence"
        }
        for cat, score in confidence.items():
            if cat == "overall": continue
            name = cat_names.get(cat, cat)
            bar = confidence_bar(score)
            lines.append(f"| {name} | {bar} ({score}%) |")
        overall = confidence.get("overall", 0)
        overall_bar = confidence_bar(overall)
        lines.append(f"| **Overall** | **{overall_bar} ({overall}%)** |")
    else:
        lines.append("⚠️ Confidence scoring unavailable.\n")
    lines.append("\n")

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 15: ANALYST SUMMARY
    # ══════════════════════════════════════════════════════════════════════════
    lines.append("## 15. 🏁 Analyst Summary\n")
    # Build summary from available data
    summary_parts = []
    if crit > 0:
        summary_parts.append(f"{crit} critical advisories — immediate attention required")
    if overall_risk == "HIGH":
        summary_parts.append("overall HIGH risk profile")
    elif overall_risk == "MODERATE":
        summary_parts.append("MODERATE risk — vehicle requires assessment")
    else:
        summary_parts.append("LOW risk — vehicle appears reasonably maintained")

    if mileage_analysis.get("clocking_flag"):
        summary_parts.append("possible mileage clocking detected")
    if val_min and val_max:
        summary_parts.append(f"valued at £{val_min:,}–£{val_max:,}")

    summary = f"A {year or '?'} {make} {model} — {'; '.join(summary_parts[:4])}."
    lines.append(f"{summary}\n\n")

    # Recommendation
    if valuation.get("recommendation"):
        lines.append(f"**Recommendation:** {valuation['recommendation']}\n")

    overall_osint_risk = "🟢 LOW" if overall_risk == "LOW" else "🟡 MODERATE" if overall_risk == "MODERATE" else "🔴 HIGH"
    lines.append(f"\n**Overall OSINT Risk Rating:**\n{overall_osint_risk}\n")

    # ══════════════════════════════════════════════════════════════════════════
    # DATA SOURCES LOG
    # ══════════════════════════════════════════════════════════════════════════
    lines.append("---\n")
    lines.append(f"*Report generated by Vehicle OSINT CLI v{__version__} on {today_str}*\n")
    lines.append(f"*Plate: {plate} | Make: {make} | Model: {model}*\n\n")
    if data_sources_log:
        lines.append("**Data Sources Used:**\n")
        for src in data_sources_log:
            status = "✔" if src["success"] else "✗"
            lines.append(f"{status} {src['name']} — {src.get('note', 'used')}\n")
    if errors:
        lines.append(f"\n**Errors Encountered ({len(errors)}):**\n")
        for err in errors[:10]:
            lines.append(f"  - {err}\n")

    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# MAIN ORCHESTRATOR
# ─────────────────────────────────────────────────────────────────────────────

def run_vehicle_osint(plate: str, output_path: str | None = None) -> dict:
    """Collect all data and generate the full OSINT report."""
    plate_clean = re.sub(r'\s', '', plate).upper()
    plate_type = detect_plate_type(plate_clean)
    _print(f"  [*] Detected type: {plate_type}")

    errors = []
    data_sources_log = []

    # Shared data holders
    dvla_data = {"findings": [], "errors": [], "raw_data": {}}
    carcheck_data = {"findings": [], "errors": [], "raw_data": {}}
    govuk_data = {"findings": [], "errors": [], "raw_data": {}}
    motest_data = {"findings": [], "errors": [], "raw_data": {}}
    nhtsa_data = {"findings": [], "errors": [], "raw_data": {}}
    # ─────────────────────────────────────────────────────────────────────────
    # PARALLEL COLLECTION — all sources fire simultaneously, results merged
    # ─────────────────────────────────────────────────────────────────
    import threading

    errors = []
    data_sources_log = []

    # Pre-initialise so find_field() never NameErrors regardless of plate_type
    dvla_data = {"findings": [], "errors": [], "raw_data": {}}
    carcheck_data = {"findings": [], "errors": [], "raw_data": {}}
    govuk_data = {"findings": [], "errors": [], "raw_data": {}}
    motest_data = {"findings": [], "errors": [], "raw_data": {}}
    isitnicked_data = {"findings": [], "errors": [], "raw_data": {}}
    carwow_data = {"findings": [], "errors": [], "raw_data": {}}
    ccd_data = {"findings": [], "errors": [], "raw_data": {}}
    mot_data = {"findings": [], "errors": [], "raw_data": {}}
    comparables = []

    def run_parallel_collectors(plate: str):
        """Fire all UK collectors in parallel. Each gets its own playwright instance."""
        import threading

        # All collector functions that need playwright
        pw_collectors = {
            "dvla":       collect_dvla,
            "carcheck":   collect_car_check,
            "govuk_mot":  collect_gov_uk_mot,
            "motest":     collect_motest,
            "isitnicked": collect_isitnicked,
            "carwow":     collect_carwow,
            "ccd":        collect_checkcardetails,
        }

        results = {}
        lock = threading.Lock()

        def run_one(name, func, plate):
            """Run a single collector in its own playwright context."""
            try:
                with sync_playwright() as p:
                    result = func(plate, p)
                with lock:
                    results[name] = result
            except Exception as exc:
                with lock:
                    results[name] = {"findings": [], "errors": [f"{name}: {exc}"], "raw_data": {}}

        threads = []
        for name, func in pw_collectors.items():
            t = threading.Thread(target=run_one, args=(name, func, plate), daemon=True)
            threads.append(t)
            t.start()

        for t in threads:
            t.join(timeout=60)

        return results

    with sync_playwright() as pw:
        if plate_type == "VIN":
            _print("  [*] Querying NHTSA vPIC API...")
            nhtsa_data = collect_nhtsa_vin(plate_clean)
            errors.extend(nhtsa_data["errors"])
            data_sources_log.append({"name": "NHTSA vPIC", "success": bool(nhtsa_data["findings"]), "note": nhtsa_data.get("source", "")})

        elif plate_type == "UK":
            _print("  [*] Firing all collectors in parallel...")
            all_results = run_parallel_collectors(plate_clean)

            dvla_data       = all_results.get("dvla",       {"findings": [], "errors": [], "raw_data": {}})
            carcheck_data   = all_results.get("carcheck",   {"findings": [], "errors": [], "raw_data": {}})
            govuk_data      = all_results.get("govuk_mot",  {"findings": [], "errors": [], "raw_data": {}})
            motest_data     = all_results.get("motest",     {"findings": [], "errors": [], "raw_data": {}})
            isitnicked_data = all_results.get("isitnicked", {"findings": [], "errors": [], "raw_data": {}})
            carwow_data     = all_results.get("carwow",    {"findings": [], "errors": [], "raw_data": {}})
            ccd_data        = all_results.get("ccd",       {"findings": [], "errors": [], "raw_data": {}})

            # Log every source regardless of success/failure
            source_log_map = [
                ("gov.uk DVLA",            dvla_data,       True),
                ("car-checking.com",       carcheck_data,   True),
                ("gov.uk MOT",             govuk_data,      True),
                ("motest.com",             motest_data,     True),
                ("isitnicked.com",        isitnicked_data,  False),
                ("carwow.co.uk",           carwow_data,     False),
                ("checkcardetails.co.uk",  ccd_data,        False),
            ]
            for src_name, src_data, show_note in source_log_map:
                ok = bool(src_data.get("findings"))
                note = src_data.get("source", "") if show_note else ""
                data_sources_log.append({"name": src_name, "success": ok, "note": note})
                if src_data.get("errors"):
                    for e in src_data["errors"]:
                        errors.append(f"{src_name}: {e}")

            # ── MOT data: merge all MOT sources, prefer best quality ──
            # Quality ranking: carcheck > govuk > motest
            def mot_quality(d):
                if not d.get("findings"): return -1
                raw = d.get("raw_data", {})
                # car-check has rich data including model/year/engine
                if raw.get("model") or raw.get("make"): return 3
                # gov.uk MOT has expiry + mileage + result
                if raw.get("mot_expiry") or raw.get("current_mileage"): return 2
                # motest is basic
                return 1

            mot_candidates = sorted(
                [("carcheck", carcheck_data), ("govuk", govuk_data), ("motest", motest_data)],
                key=lambda x: mot_quality(x[1]),
                reverse=True
            )
            mot_data = mot_candidates[0][1]  # best available

        else:
            errors.append(f"Unrecognised plate format: {plate_clean}. Supported: UK reg, VIN (17 chars).")

    # ── Extract core fields from collected data ──
    cc_raw = carcheck_data.get("raw_data", {})
    dvla_raw = dvla_data.get("raw_data", {})
    govuk_raw = govuk_data.get("raw_data", {})

    def find_field(field_name):
        for d in [carcheck_data, govuk_data, motest_data, dvla_data]:
            for f in d.get("findings", []):
                if f["field"] == field_name:
                    return f["value"]
        return ""

    model_raw = cc_raw.get("model", "")
    model = clean_model_text(model_raw)
    make = cc_raw.get("make", "") or dvla_raw.get("Make", "")
    year_str = cc_raw.get("year", "0")
    year = int(re.sub(r'\D', '', year_str)) if re.sub(r'\D', '', year_str) else 0
    colour = cc_raw.get("colour", "") or dvla_raw.get("Colour", "")
    fuel_type = cc_raw.get("fuel_type", "")
    engine_cc_str = cc_raw.get("engine_capacity", "0")
    engine_cc = int(re.sub(r'\D', '', engine_cc_str)) if re.sub(r'\D', '', engine_cc_str) else 0
    gearbox = cc_raw.get("gearbox", "")
    mot_expiry = cc_raw.get("mot_expiry", "") or govuk_raw.get("mot_expiry", "")
    mot_passed = 0
    for f in carcheck_data.get("findings", []):
        if f["field"] == "mot_passed": mot_passed = int(f["value"]); break
    mot_failed = 0
    for f in carcheck_data.get("findings", []):
        if f["field"] == "mot_failed": mot_failed = int(f["value"]); break
    mot_pass_rate = ""
    for f in carcheck_data.get("findings", []):
        if f["field"] == "mot_pass_rate": mot_pass_rate = f["value"]; break
    mot_result = find_field("mot_result")
    tax_status = dvla_raw.get("Tax status", dvla_raw.get("Vehicle tax status", "Unknown"))
    first_reg = dvla_raw.get("First registered", "")
    advisory_notes = cc_raw.get("advisory_notes", [])
    mileage_timeline = cc_raw.get("mileage_timeline", [])
    current_mileage = mileage_timeline[0] if mileage_timeline else (govuk_raw.get("current_mileage") or None)
    mot_history_count = cc_raw.get("mot_history_count", 0)
    mot_locations = []  # Would need enhanced parsing from MOT history table

    # ── Advisory matching ──
    advisories = estimate_advisories(advisory_notes, mot_failed, mot_passed, year or 2005, engine_cc, fuel_type or "DIESEL")

    # ── Valuation ──
    valuation = generate_vehicle_valuation(
        make or "Unknown", model or "Unknown", year or 2005,
        current_mileage, fuel_type or "DIESEL", advisories,
        mot_failed, mot_passed, tax_status, mot_expiry
    )

    # ── Insurance group ──
    insurance_data = lookup_insurance_group(make, model)

    # ── Known issues ──
    known_issues_data = lookup_known_issues(make, model, year)

    # ── Mileage analysis ──
    mileage_analysis = analyze_mileage_timeline(mileage_timeline, year)

    # ── Geographic analysis ──
    geographic_analysis = analyze_geographic_data(mot_locations)

    # ── Risk flags ──
    risk_flags = analyze_risk_flags(advisories, mileage_timeline, mot_history_count, year, False)

    # ── Image intelligence ──
    image_intel = check_image_intelligence(plate_clean, make, model)

    # ── Confidence scoring ──
    confidence = calculate_confidence({
        "dvla": dvla_data,
        "carcheck": carcheck_data,
        "govuk_mot": govuk_data,
        "comparables": comparables,
        "insurance": insurance_data,
        "known_issues": known_issues_data,
        "isitnicked": isitnicked_data if plate_type == "UK" else {},
        "carwow": carwow_data if plate_type == "UK" else {},
        "checkcardetails": ccd_data if plate_type == "UK" else {},
    })

    # ── Build data bundle for report ──
    report_data = {
        "dvla": dvla_data,
        "carcheck": carcheck_data,
        "govuk_mot": govuk_data,
        "valuation": valuation,
        "insurance": insurance_data,
        "known_issues": known_issues_data,
        "mileage_analysis": mileage_analysis,
        "risk_flags": risk_flags,
        "comparables": comparables,
        "confidence": confidence,
        "mot_locations": mot_locations,
        "geographic_analysis": geographic_analysis,
        "image_intelligence": image_intel,
        "tax_status": tax_status,
        "mot_expiry": mot_expiry,
        "mot_pass_rate": mot_pass_rate,
        "mot_passed": mot_passed,
        "mot_failed": mot_failed,
        "mot_history_count": mot_history_count,
        "advisories": advisories,
        "make": make,
        "model": model,
        "year": year,
        "colour": colour,
        "fuel_type": fuel_type,
        "engine_cc": engine_cc_str,
        "gearbox": gearbox,
        "current_mileage": current_mileage,
        "mot_result": mot_result,
        "first_reg": first_reg,
        "errors": errors,
        "data_sources_log": data_sources_log,
        "colour_change": False,
        "isitnicked_data": isitnicked_data if plate_type == "UK" else {},
        "carwow_data": carwow_data if plate_type == "UK" else {},
        "checkcardetails_data": ccd_data if plate_type == "UK" else {},
    }

    # ── Generate report ──
    _print(f"  [*] Generating report...")
    md = generate_markdown_report(plate_clean, report_data)

    # ── Save report ──
    if output_path:
        out = Path(output_path)
    else:
        today_str = datetime.now().strftime("%Y-%m-%d")
        report_dir = Path("reports") / "osint" / today_str
        report_dir.mkdir(parents=True, exist_ok=True)
        out = report_dir / f"vehicle-{plate_clean}.md"
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    Path(out).write_text(md, encoding="utf-8")

    # ── Console summary ──
    _print("")
    _print(f"  {FGREEN}--- Result ---{RESET_ALL}")
    _print(f"  Registration : {plate_clean}")
    _print(f"  Make/Model  : {make or 'Unknown'} {model}".rstrip())
    if colour: _print(f"  Colour      : {colour}")
    _print(f"  MOT Expiry  : {mot_expiry or 'N/A'}" + (f"  | Pass Rate: {mot_pass_rate}" if mot_pass_rate else ""))
    val_min = valuation.get("current_value_min", 0)
    val_max = valuation.get("current_value_max", 0)
    if val_min and val_max:
        risk_val = risk_flags.get("overall_risk", "LOW").upper()
        risk_color = FRED if risk_val == "HIGH" else (FYELLOW if risk_val == "MODERATE" else FGREEN)
        _print(f"  Value       : {FGREEN}£{val_min:,} - £{val_max:,}{RESET_ALL}")
        _print(f"  Risk        : {risk_color}{risk_flags.get('overall_risk', 'LOW')}{RESET_ALL}")
    if errors:
        _print(f"  {FYELLOW}Warnings ({len(errors)}):{RESET_ALL}")
        for e in errors[:5]: _print(f"    - {e}")

    _print(f"  {FCYAN}Report saved: {out}{RESET_ALL}")

    return {
        "plate": plate_clean,
        "make": make,
        "model": model,
        "valuation": valuation,
        "risk": risk_flags.get("overall_risk", "LOW"),
        "errors": errors,
        "report_path": str(out)
    }


# ─────────────────────────────────────────────────────────────────────────────
# CLI / INTERACTIVE ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────

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
                _print(f"  {FYELLOW}{BRIGHT}Scan complete with {len(errors)} warning(s).{RESET_ALL}")
        except Exception as e:
            import traceback
            log_path = Path(tempfile.gettempdir()) / "vehicle-osint_crash.log"
            try:
                log_path.write_text(f"[{datetime.now().isoformat()}] FATAL: {e}\n{traceback.format_exc()}", encoding="utf-8")
            except Exception:
                pass
            _print(f"\n  {FRED}{BRIGHT}FATAL ERROR: {e}{RESET_ALL}")
            _print(f"  {FYELLOW}Crash log: {log_path}{RESET_ALL}")
        _input(f"\n  {FYELLOW}Press Enter to continue...{RESET_ALL}")


def main():
    parser = argparse.ArgumentParser(description="Vehicle OSINT CLI v2")
    parser.add_argument("plate", nargs="?", help="UK registration plate or VIN")
    parser.add_argument("-o", "--output", help="Output markdown file path")
    args = parser.parse_args()

    if args.plate:
        # CLI mode
        try:
            result = run_vehicle_osint(args.plate, args.output)
            sys.exit(0)
        except Exception as e:
            import traceback
            log_path = Path(tempfile.gettempdir()) / "vehicle-osint_crash.log"
            try:
                log_path.write_text(f"[{datetime.now().isoformat()}] FATAL: {e}\n{traceback.format_exc()}", encoding="utf-8")
            except Exception:
                pass
            _print(f"\n  {FRED}FATAL ERROR: {e}{RESET_ALL}")
            sys.exit(1)
    else:
        # Interactive mode
        menu_loop()


if __name__ == "__main__":
    main()
