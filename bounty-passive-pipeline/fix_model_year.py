with open('vehicle-osint.py', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Fix 1: Model regex - too greedy, captures too much
old1 = "m = re.search(r'Model\\s+([A-Za-z0-9 ]+)', body)"
new1 = "m = re.search(r'Model\\s+([A-Za-z0-9 ]{2,40})\\b', body)"

# Fix 2: Year regex
old2 = "extract(r'Year of manufacture\\s+(\\d{4})', \"year\")"
new2 = "extract(r'Year of manufacture\\s+(\\d{4})', \"year\")"

# Fix 3: Add .title() to model in report_data assembly
# model = raw.get("model", "") → needs to be stripped of trailing junk
# Also add a cleanup step for model field

# Fix 4: The generate_report model extraction should use car-checking model, not make+model combined
# The issue is at line 237-238 model extraction
# Also year extraction needs to handle the case where year is found

changes = 0
for old, new in [(old1, new1), (old2, new2)]:
    if old in content:
        content = content.replace(old, new)
        print(f"Fixed: {old[:50]}")
        changes += 1
    else:
        print(f"NOT FOUND: {old[:50]}")

# Also fix: model cleanup - strip trailing "Colour BLUE Year of manufacture" etc.
old3 = 'model = raw.get("model", "")'
new3 = 'model = (raw.get("model", "") or "").strip()\n    # Strip any trailing Colour/Year/Yeof Manufacture artifacts\n    for bad in ["Colour", "Year of manufacture", "Colour of vehicle"]:\n        if model.endswith(bad):\n            model = model[:model.rfind(bad)].strip()'

if old3 in content:
    content = content.replace(old3, new3)
    print("Fixed model cleanup")
    changes += 1

# Fix: The collect_car_check also sets raw_data["model"] = m.group(1).strip()
# Let me also add boundary to the model regex to stop at Colour/Years/etc.
# The regex at line 237: r'Model\s+([A-Za-z0-9 ]+)' captures too much
# Better: stop at Colour, Year, Fuel, Engine, etc.
old4 = "m = re.search(r'Model\\s+([A-Za-z0-9 ]{2,40})\\b', body)"
new4 = "m = re.search(r'Model\\s+([A-Za-z0-9 ]{2,40})(?:\\s+(?=Colour|Year|Fuel|Engine|Gearbox|Top speed|0 to 60|CO2)|$)', body)"

if old4 in content:
    content = content.replace(old4, new4)
    print("Fixed model boundary regex")
    changes += 1

print(f"Total changes: {changes}")

with open('vehicle-osint.py', 'w', encoding='utf-8') as f:
    f.write(content)
