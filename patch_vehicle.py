"""Patch vehicle-osint.py — proper field extraction + fixed depreciation."""
import re

with open(r"C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\vehicle-osint.py", "r", encoding="utf-8") as f:
    src = f.read()

# ── 1. Replace the greedy extract() function with a smart multi-label extractor ──
OLD_EXTRACT = '''        def extract(pattern, field, default=None):
            m = re.search(pattern, body, re.I)
            val = m.group(1).strip() if m else default
            if val:
                result["raw_data"][field] = val
                result["findings"].append({"source": "car-checking.com", "field": field, "value": val, "confidence": 95})
            return val or ""

        extract(r'Make\s+([A-Z0-9 ]+)', "make")
        m = re.search(r'Model\s+([A-Za-z0-9 ]+)', body)
        result["raw_data"]["model"] = m.group(1).strip() if m else ""
        extract(r'Colour\s+([A-Za-z ]+)', "colour")
        extract(r'Year of manufacture\s+(\d{4})', "year")
        extract(r'Gearbox\s+([A-Za-z0-9/ ]+)', "gearbox")
        extract(r'Engine capacity\s+(\d+)\s*cc', "engine_capacity")
        extract(r'Fuel type\s+([A-Za-z/ ]+)', "fuel_type")
        extract(r'Power\s+([\d.]+)\s*BHP', "power_bhp")
        extract(r'CO2 emission\s+(\d+)\s*g', "co2_gkm")
        extract(r'Consumption combined\s+([\d.]+)\s*mpg', "combined_mpg")'''

NEW_EXTRACT = '''        # ── Extract all spec fields at once using label→next-label zones ──
        spec_fields = [
            "Make", "Model", "Colour", "Year of manufacture",
            "Top speed", "0 to 60", "Gearbox", "Engine & fuel consumption",
            "Fuel type", "Consumption city", "Consumption extra urban",
            "Consumption combined", "CO2 emission", "Power", "Torque",
            "Engine capacity", "Cylinders",
        ]
        found = {}
        for i, label in enumerate(spec_fields):
            # Find the label
            m = re.search(rf'{re.escape(label)}[\s:]+', body, re.I)
            if not m:
                continue
            start = m.end()
            # Next label (or end)
            next_label = spec_fields[i+1] if i+1 < len(spec_fields) else None
            if next_label:
                nm = re.search(rf'{re.escape(next_label)}[\s:]', body[start:], re.I)
                end = start + nm.start() if nm else len(body)
            else:
                end = len(body)
            val = body[start:end].strip()[:100].replace('\\n', ' ').replace('  ', ' ')
            if val:
                key = label.lower().replace(' ', '_').replace('&', '')
                found[key] = val

        # Map to result fields
        make_raw = found.get('make', '')
        model_raw = found.get('model', '')
        colour_raw = found.get('colour', '')
        year_raw = found.get('year_of_manufacture', '')
        gearbox_raw = found.get('gearbox', '')
        engine_cap_raw = re.sub(r'\\D', '', found.get('engine_capacity', ''))
        fuel_raw = found.get('fuel_type', '')
        power_raw = found.get('power', '')
        co2_raw = re.sub(r'\\D', '', found.get('co2_emission', ''))
        mpg_raw = re.sub(r'\\D', '', found.get('consumption_combined', ''))

        result["raw_data"]["make"] = make_raw.title()
        result["raw_data"]["model"] = model_raw.title()
        result["raw_data"]["colour"] = colour_raw.title()
        result["raw_data"]["year"] = year_raw
        result["raw_data"]["gearbox"] = gearbox_raw.title()
        result["raw_data"]["engine_capacity"] = engine_cap_raw
        result["raw_data"]["fuel_type"] = fuel_raw.title()
        result["raw_data"]["power_bhp"] = power_raw
        result["raw_data"]["co2_gkm"] = co2_raw
        result["raw_data"]["combined_mpg"] = mpg_raw

        for k, v in result["raw_data"].items():
            if v and k != 'raw_text':
                result["findings"].append({"source": "car-checking.com", "field": k, "value": str(v)[:80], "confidence": 95})'''

src = src.replace(OLD_EXTRACT, NEW_EXTRACT)

# ── 2. Fix MOT history parsing to properly extract dates and mileage ──
OLD_MOT_BLOCKS = '''        # ── FULL MOT HISTORY — parse each MOT entry ──
        mot_entries = []
        # Find all MOT test blocks: "MOT #N" through to next MOT # or end
        mot_blocks = re.split(r'(?=MOT #\\d)', body)
        for block in mot_blocks:
            if not re.match(r'MOT #\\d', block.strip()):
                continue
            entry = {}
            # Test number
            num_m = re.search(r'MOT #(\\d+)', block)
            entry["test_number"] = num_m.group(1) if num_m else ""
            # Date — look for date pattern near start of block
            date_m = re.search(r'(\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{2,4})', block)
            entry["date"] = date_m.group(1) if date_m else ""
            # Result
            entry["result"] = "Pass" if re.search(r'\\bPass\\b', block) else "Fail"
            # Mileage
            mil_m = re.search(r'(\\d{5,6})\\s*miles', block)
            entry["mileage"] = mil_m.group(1) if mil_m else ""
            # Test centre
            tc_m = re.search(r'(?:Test centre|Centre|Location)[\\s\\:]+([^\\n]{3,50})', block, re.I)
            entry["test_centre"] = tc_m.group(1).strip() if tc_m else ""
            # Advisories
            advs = []
            for am in re.finditer(r'Advice\\s+([^\\n]{5,200})', block, re.I):
                txt = am.group(1).strip()
                if txt:
                    advs.append(txt)
            entry["advisories"] = advs
            # Odometer reading (sometimes shown differently)
            odo_m = re.search(r'Odometer[\\s\\:]+(\\d{5,6})', block, re.I)
            entry["odometer"] = odo_m.group(1) if odo_m else ""
            if entry["test_number"] or entry["date"]:
                mot_entries.append(entry)

        result["raw_data"]["mot_history"] = mot_entries
        if mot_entries:
            result["raw_data"]["mot_history_count"] = len(mot_entries)
            result["findings"].append({"source": "car-checking.com", "field": "mot_history_count", "value": str(len(mot_entries)), "confidence": 95})

        # Build mileage timeline (reverse chronological)
        mileage_timeline = []
        for e in mot_entries:
            if e.get("mileage") and e["mileage"].isdigit():
                mileage_timeline.append(int(e["mileage"]))
        if not mileage_timeline and result["raw_data"].get("current_mileage"):
            mileage_timeline = [result["raw_data"]["current_mileage"]]
        result["raw_data"]["mileage_timeline"] = sorted(set(mileage_timeline), reverse=True)

        # All advisory notes
        all_advisories = []
        for e in mot_entries:
            all_advisories.extend(e.get("advisories", []))
        if all_advisories:
            result["raw_data"]["advisory_notes"] = all_advisories'''

NEW_MOT_BLOCKS = '''        # ── FULL MOT HISTORY — parse each MOT test entry ──
        mot_entries = []
        # Split body by "MOT #N" markers
        mot_blocks = re.split(r'(?=MOT #\\d)', body)
        for block in mot_blocks:
            block = block.strip()
            if not block.startswith('MOT #'):
                continue
            entry = {}
            # Test number
            num_m = re.search(r'^MOT #(\\d+)', block)
            entry["test_number"] = num_m.group(1) if num_m else ""
            # Extract ONLY date fields that are WITHIN this block (not expiry date)
            # Look for date near "Result:" label
            result_area = re.search(r'Result:[^\\n]{0,200}', block, re.I)
            result_text = result_area.group(0) if result_area else ""
            date_m = re.search(r'(\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{2,4})', result_text)
            entry["date"] = date_m.group(1) if date_m else ""
            # Result
            entry["result"] = "Pass" if re.search(r'\\bPass\\b', block) else "Fail"
            # Mileage — look for 5-digit number near "miles" anywhere in block
            mil_m = re.search(r'(\\d{5,6})\\s*miles?', block)
            entry["mileage"] = mil_m.group(1) if mil_m else ""
            # Test centre
            tc_m = re.search(r'(?:Test centre|Centre|Location)[\\s\\:]+([^\\n<]{3,50})', block, re.I)
            entry["test_centre"] = tc_m.group(1).strip() if tc_m else ""
            # Advisories — capture each on its own line
            advs = []
            for am in re.finditer(r'Advice\\s+([\\w\\s\\(\\)\\[\\]\\.,\\-]{10,150})', block, re.I):
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
            gen_miles = re.findall(r'(\\d{5,6})\\s*miles?', body)
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
                key = re.sub(r'\\s+', ' ', a.lower().strip())[:80]
                if key and key not in seen:
                    seen.add(key)
                    all_advisories.append(a[:150])
        result["raw_data"]["advisory_notes"] = all_advisories'''

src = src.replace(OLD_MOT_BLOCKS, NEW_MOT_BLOCKS)

# ── 3. Fix depreciation: linear 10% per year, floor 30% ──
OLD_AGE_DEPR = '''    age = max(0, datetime.now().year - (year or 2005))
    # Linear depreciation: ~15% per year, floor at 20% of base
    depr_rate = max(0.20, 1.0 - (age * 0.10))'''
NEW_AGE_DEPR = '''    age = max(0, datetime.now().year - (year or 2005))
    # Linear depreciation: ~10% per year, floor at 30% of base
    depr_rate = max(0.30, 1.0 - (age * 0.10))'''
src = src.replace(OLD_AGE_DEPR, NEW_AGE_DEPR)

# ── 4. Fix MSRP lookup to use title-case keys ──
OLD_MSRP = '''    msrp_key = next(((m, mo) for (m, mo) in ORIGINAL_MSRP if re.search(m, make.lower() or "") and re.search(mo, model.lower() or "")), None)
    msrp_min, msrp_max = ORIGINAL_MSRP.get(msrp_key, (8000, 18000)) if msrp_key else (8000, 18000)'''
NEW_MSRP = '''    make_l = make.lower() if make else ""
    model_l = model.lower() if model else ""
    msrp_key = next(((m, mo) for (m, mo) in ORIGINAL_MSRP if re.search(m, make_l) and re.search(mo, model_l)), None)
    msrp_min, msrp_max = ORIGINAL_MSRP.get(msrp_key, (10000, 20000)) if msrp_key else (10000, 20000)'''
src = src.replace(OLD_MSRP, NEW_MSRP)

# ── 5. Fix MSRP database to use title-case keys ──
OLD_MSRP_DB = '''ORIGINAL_MSRP = {
    ("Ford", "Mondeo"): (18000, 25000),
    ("Ford", "Focus"): (14000, 20000),
    ("Ford", "Fiesta"): (8000, 14000),
    ("Vauxhall", "Corsa"): (8000, 14000),
    ("Vauxhall", "Astra"): (12000, 18000),
    ("VW", "Golf"): (15000, 22000),
    ("VW", "Polo"): (10000, 16000),
    ("BMW", "3 Series"): (22000, 35000),
    ("Audi", "A3"): (20000, 30000),
}'''
NEW_MSRP_DB = '''ORIGINAL_MSRP = {
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
}'''
src = src.replace(OLD_MSRP_DB, NEW_MSRP_DB)

# ── 6. Fix advisory parsing to deduplicate and limit ──
OLD_ADVISORIES = '''    for note in advisory_notes:
        sev = "low"
        cost = (30, 150)
        note_lower = note.lower()
        if re.search(r'tyre|wheel|tire', note_lower):
            sev, cost = "low", (40, 200)
        elif re.search(r'brake|brake.?pad|disc|rotor', note_lower):
            sev, cost = "medium", (80, 350)
        elif re.search(r'suspension|shock|spring|coil', note_lower):
            sev, cost = "medium", (100, 500)
        elif re.search(r'corrosion|rust|exhaust|catalyst|dpf', note_lower):
            sev, cost = "medium", (150, 800)
        elif re.search(r'seatbelt|airbag|brake.?light', note_lower):
            sev, cost = "high", (100, 600)
        advisories.append({"issue": note[:120], "severity": sev, "cost_min": cost[0], "cost_max": cost[1]})'''

NEW_ADVISORIES = '''    seen_issues = set()
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
        if re.search(r'tyre|wheel\\b|tire| tread |perishing', note_lower):
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
        advisories.append({"issue": note_clean, "severity": sev, "cost_min": cost[0], "cost_max": cost[1]})'''

src = src.replace(OLD_ADVISORIES, NEW_ADVISORIES)

with open(r"C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\vehicle-osint.py", "w", encoding="utf-8") as f:
    f.write(src)
print("Patch applied OK")
import ast
ast.parse(open(r"C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\vehicle-osint.py", encoding="utf-8").read())
print("Syntax OK")
