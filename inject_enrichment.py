"""Inject cross-reference enrichment into vehicle-osint.py."""
path = r"C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\vehicle-osint.py"
with open(path, 'rb') as f:
    content = f.read()

lines = content.split(b'\r\n')

# Find the insertion point: after known_issues_data line
insert_after = None
for i, line in enumerate(lines):
    if b'known_issues_data = lookup_known_issues' in line:
        insert_after = i
        break

print(f"Insert after line {insert_after+1}")

# Build the new function as a string (not bytes)
new_function = '''
# -- Cross-reference enrichment -- fill gaps using local databases
# Cross-references make/model/year against known databases to fill
# insurance group, engine CC, body type, gearbox, fuel type, and issues.

ENGINE_CC_DB = {
    ("ford", "mondeo"): (1997, 2198),
    ("ford", "focus"): (1560, 2265),
    ("ford", "fiesta"): (1242, 1598),
    ("ford", "kuga"): (1498, 1995),
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
    ("renault", "megane"): (1330, 1998),
    ("peugeot", "208"): (1199, 1598),
    ("peugeot", "308"): (1199, 1997),
    ("nissan", "qashqai"): (1332, 1749),
    ("mercedes", "c class"): (1595, 2996),
    ("skoda", "octavia"): (1197, 1984),
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
    ("audi", "a4"): "Automatic",
    ("toyota", "yaris"): "Manual / Automatic",
    ("toyota", "corolla"): "Manual / Automatic",
    ("honda", "civic"): "Manual / Automatic",
    ("renault", "clio"): "Manual / Automatic",
    ("renault", "megane"): "Manual / Automatic",
    ("nissan", "qashqai"): "Manual / Automatic",
}

BODY_TYPE_DB = {
    ("ford", "mondeo"): "Saloon / Estate",
    ("ford", "focus"): "Hatchback / Estate",
    ("ford", "fiesta"): "Hatchback",
    ("ford", "kuga"): "SUV / Crossover",
    ("vauxhall", "corsa"): "Hatchback",
    ("vauxhall", "astra"): "Hatchback / Estate",
    ("vw", "golf"): "Hatchback",
    ("vw", "polo"): "Hatchback",
    ("vw", "passat"): "Saloon / Estate",
    ("bmw", "3 series"): "Saloon / Estate",
    ("audi", "a3"): "Hatchback / Saloon",
    ("audi", "a4"): "Saloon / Avant",
    ("toyota", "yaris"): "Hatchback",
    ("toyota", "corolla"): "Hatchback / Saloon / Estate",
    ("honda", "civic"): "Hatchback / Saloon",
    ("renault", "clio"): "Hatchback",
    ("renault", "megane"): "Hatchback / Estate",
    ("nissan", "qashqai"): "SUV / Crossover",
}

FUEL_TYPE_DB = {
    ("ford", "mondeo", "diesel"): "Diesel",
    ("ford", "mondeo", "petrol"): "Petrol",
    ("ford", "focus", "diesel"): "Diesel",
    ("ford", "focus", "petrol"): "Petrol",
    ("ford", "fiesta", "petrol"): "Petrol",
    ("ford", "kuga", "diesel"): "Diesel",
    ("vauxhall", "corsa", "diesel"): "Diesel",
    ("vauxhall", "corsa", "petrol"): "Petrol",
    ("vauxhall", "astra", "diesel"): "Diesel",
    ("vauxhall", "astra", "petrol"): "Petrol",
    ("vw", "golf", "diesel"): "Diesel",
    ("vw", "golf", "petrol"): "Petrol / Mild Hybrid",
    ("vw", "polo", "petrol"): "Petrol",
    ("vw", "passat", "diesel"): "Diesel",
    ("vw", "passat", "petrol"): "Petrol / Hybrid",
    ("bmw", "3 series", "diesel"): "Diesel",
    ("bmw", "3 series", "petrol"): "Petrol / Hybrid",
    ("audi", "a3", "diesel"): "Diesel",
    ("audi", "a3", "petrol"): "Petrol",
    ("toyota", "yaris", "hybrid"): "Hybrid / Petrol",
    ("toyota", "corolla", "hybrid"): "Hybrid / Petrol",
    ("honda", "civic", "hybrid"): "Hybrid / Petrol",
    ("renault", "clio", "petrol"): "Petrol / Hybrid",
    ("renault", "megane", "diesel"): "Diesel",
    ("peugeot", "208", "electric"): "Electric / Petrol",
    ("nissan", "qashqai", "diesel"): "Diesel",
    ("nissan", "qashqai", "petrol"): "Petrol / Hybrid",
}

INSURANCE_GROUP_DB = {
    ("ford", "mondeo"): (25, 35),
    ("ford", "focus"): (18, 26),
    ("ford", "fiesta"): (10, 18),
    ("ford", "kuga"): (18, 26),
    ("vauxhall", "corsa"): (8, 16),
    ("vauxhall", "astra"): (14, 22),
    ("vw", "golf"): (18, 28),
    ("vw", "polo"): (12, 20),
    ("vw", "passat"): (22, 32),
    ("bmw", "3 series"): (28, 40),
    ("audi", "a3"): (22, 32),
    ("audi", "a4"): (26, 36),
    ("toyota", "yaris"): (8, 14),
    ("toyota", "corolla"): (12, 20),
    ("honda", "civic"): (14, 22),
    ("renault", "clio"): (8, 14),
    ("renault", "megane"): (14, 22),
    ("peugeot", "208"): (8, 14),
    ("peugeot", "308"): (12, 20),
    ("nissan", "qashqai"): (14, 22),
    ("mercedes", "c class"): (30, 44),
    ("skoda", "octavia"): (16, 26),
}


def cross_reference_enrichment(make: str, model: str, year: int,
                               engine_cc: int, fuel_type: str,
                               insurance_data: dict) -> dict:
    result = {
        "engine_cc_inferred": None,
        "engine_cc_confidence": 0,
        "fuel_type_inferred": "",
        "fuel_type_confidence": 0,
        "gearbox_inferred": "",
        "gearbox_confidence": 0,
        "body_type_inferred": "",
        "body_type_confidence": 0,
        "insurance_group_inferred": None,
        "insurance_group_max_inferred": None,
        "insurance_confidence": 0,
        "enrichments_applied": [],
    }

    if not make:
        return result

    make_l = make.lower()
    model_l = model.lower() if model else ""

    # -- Engine CC --
    for (db_make, db_model), (cc_min, cc_max) in ENGINE_CC_DB.items():
        if make_l.startswith(db_make) or db_make in make_l:
            if not model_l or db_model in model_l:
                if engine_cc == 0:
                    result["engine_cc_inferred"] = (cc_min + cc_max) // 2
                    result["engine_cc_confidence"] = 75
                    result["enrichments_applied"].append("engine_cc=%dcc (db)" % result["engine_cc_inferred"])
                break

    # -- Fuel type --
    if not fuel_type or fuel_type.lower() in ("unknown", ""):
        for (db_make, db_model, db_fuel), db_fuel_type in FUEL_TYPE_DB.items():
            if make_l.startswith(db_make) or db_make in make_l:
                if not model_l or db_model in model_l:
                    result["fuel_type_inferred"] = db_fuel_type
                    result["fuel_type_confidence"] = 70
                    result["enrichments_applied"].append("fuel_type=" + db_fuel_type + " (db)")
                    break
        if not result["fuel_type_inferred"]:
            result["fuel_type_inferred"] = "Petrol" if year >= 2015 else "Diesel / Petrol (verify)"
            result["fuel_type_confidence"] = 40
            result["enrichments_applied"].append("fuel_type=" + result["fuel_type_inferred"] + " (inferred)")

    # -- Gearbox --
    for (db_make, db_model), db_gearbox in GEARBOX_DB.items():
        if make_l.startswith(db_make) or db_make in make_l:
            if not model_l or db_model in model_l:
                result["gearbox_inferred"] = db_gearbox
                result["gearbox_confidence"] = 80
                result["enrichments_applied"].append("gearbox=" + db_gearbox + " (db)")
                break

    # -- Body type --
    for (db_make, db_model), db_body in BODY_TYPE_DB.items():
        if make_l.startswith(db_make) or db_make in make_l:
            if not model_l or db_model in model_l:
                result["body_type_inferred"] = db_body
                result["body_type_confidence"] = 80
                result["enrichments_applied"].append("body_type=" + db_body + " (db)")
                break

    # -- Insurance group --
    if not insurance_data.get("group_min"):
        for (db_make, db_model), (grp_min, grp_max) in INSURANCE_GROUP_DB.items():
            if make_l.startswith(db_make) or db_make in make_l:
                if not model_l or db_model in model_l:
                    result["insurance_group_inferred"] = grp_min
                    result["insurance_group_max_inferred"] = grp_max
                    result["insurance_confidence"] = 60
                    result["enrichments_applied"].append("insurance_group=%d-%d (db)" % (grp_min, grp_max))
                    break

    return result

'''

new_lines = lines[:insert_after+1] + [l.encode() for l in new_function.strip().split('\n')] + lines[insert_after+1:]

# Find where known_issues_data now is (shifted)
new_call_idx = None
for i, line in enumerate(new_lines):
    if b'known_issues_data = lookup_known_issues' in line:
        new_call_idx = i + 1
        break

call_snippet = b'''
    # -- Cross-reference enrichment --
    cross_ref = cross_reference_enrichment(make or "", model or "", year or 0,
                                           engine_cc or 0, fuel_type or "",
                                           insurance_data)
'''
new_lines = new_lines[:new_call_idx] + call_snippet.split(b'\n') + new_lines[new_call_idx:]

# Add cross_ref to report_data bundle
cr_search = b'"known_issues": known_issues_data,'
cr_pos = None
for i, line in enumerate(new_lines):
    if cr_search in line:
        cr_pos = i
        break

if cr_pos:
    new_lines.insert(cr_pos+1, b'        "cross_ref": cross_ref,')
    print(f"Added cross_ref to report_data at line {cr_pos+2}")
else:
    print("WARNING: could not find known_issues line in report_data")

new_content = b'\r\n'.join(new_lines)

with open(path, 'wb') as f:
    f.write(new_content)

print(f"Written {len(new_content)} bytes")

try:
    import ast
    ast.parse(new_content.decode('utf-8'))
    print("Syntax OK")
except SyntaxError as e:
    print("Syntax error at line %d: %s" % (e.lineno, e.msg))
