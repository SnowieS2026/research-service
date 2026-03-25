"""Fix the botched vehicle-osint.py by removing duplicate code blocks."""
import re

path = r"C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\vehicle-osint.py"
bak  = path + ".bak"

# Work from the backup (clean reference point)
with open(bak, 'rb') as f:
    c = f.read()

print(f"Backup size: {len(c)} bytes")

# ── BLOCK A: Duplicate `import threading` section (after the clean one) ──
# These are the repeated pre-initialise / import threading / errors=[] blocks
# that were appended during the failed edit
# We can find them by their shared markers
#
# In the backup (clean): the clean parallel block starts at the first
# `errors = []\n    data_sources_log = []\n\n    # Shared data holders`
# and the `with sync_playwright() as pw:` follows it.
#
# After the clean block, we need to add the NEW parallel version.
# The old version had `with sync_playwright() as pw:` followed by the
# sequential collectors. We REPLACE that old sequential block.

# Find the old sequential block start — it begins right after the new
# initializations (dvla_data = {}, carcheck_data = {}, etc.) and the
# `with sync_playwright() as pw:` line
old_pw_block_start = c.find(b"    with sync_playwright() as pw:")
print(f"Old pw block starts at: {old_pw_block_start}")

# Find where `with sync_playwright() as pw:` ends — at the else: clause
# that closes the if/elif/else for plate_type
old_pw_block_end_search = c.find(b"        else:\n            errors.append", old_pw_block_start)
print(f"Old pw block else: clause at: {old_pw_block_end_search}")

# The end of the old pw block is just before `# ── Extract core fields`
old_pw_block_end = c.find(b"    # ── Extract core fields from collected data ──", old_pw_block_start)
print(f"Old pw block ends at: {old_pw_block_end}")
print(f"Content at end: {c[old_pw_block_end:old_pw_block_end+50]!r}")

old_sequential_block = c[old_pw_block_start:old_pw_block_end]
print(f"Old sequential block to remove: {len(old_sequential_block)} bytes")

# ── NEW parallel block ──
new_parallel_block = b"""    # ─────────────────────────────────────────────────────────────────────────
    # PARALLEL COLLECTION -- all 7 sources fire simultaneously, results merged
    # ─────────────────────────────────────────────────────────────────

    def run_parallel_collectors(plate: str):
        \"\"\"Fire all UK collectors in parallel via threads. Each gets its own
        playwright instance so Chromium state is isolated per collector.\"\"\"
        import threading

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

        # Wait up to 60s per collector -- sites that haven't responded get marked failed
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

            # Log every source -- success/failure + note
            source_log_map = [
                ("gov.uk DVLA",            dvla_data,        True),
                ("car-checking.com",        carcheck_data,   True),
                ("gov.uk MOT",             govuk_data,       True),
                ("motest.com",             motest_data,      True),
                ("isitnicked.com",         isitnicked_data,  False),
                ("carwow.co.uk",           carwow_data,      False),
                ("checkcardetails.co.uk",  ccd_data,        False),
            ]
            for src_name, src_data, show_note in source_log_map:
                ok = bool(src_data.get("findings"))
                note = src_data.get("source", "") if show_note else ""
                data_sources_log.append({"name": src_name, "success": ok, "note": note})
                if src_data.get("errors"):
                    for e in src_data["errors"]:
                        errors.append(f"{src_name}: {e}")

            # -- MOT: merge all MOT sources, prefer best quality --
            # carcheck (rich specs+year) > govuk (expiry+mileage) > motest (basic)
            def mot_quality(d):
                if not d.get("findings"): return -1
                raw = d.get("raw_data", {})
                if raw.get("model") or raw.get("make"): return 3
                if raw.get("mot_expiry") or raw.get("current_mileage"): return 2
                return 1

            mot_candidates = sorted(
                [("carcheck", carcheck_data), ("govuk", govuk_data), ("motest", motest_data)],
                key=lambda x: mot_quality(x[1]),
                reverse=True
            )
            mot_data = mot_candidates[0][1]

        else:
            errors.append(f"Unrecognised plate format: {plate_clean}. Supported: UK reg, VIN (17 chars).")

"""

# Build new content: everything before the old pw block + new parallel block
# Then the `# ── Extract core fields` section and everything after
after_old_block = c[old_pw_block_end:]

new_content = c[:old_pw_block_start] + new_parallel_block + after_old_block

print(f"\nOriginal: {len(c)} bytes")
print(f"New:      {len(new_content)} bytes")
print(f"Delta:    {len(new_content) - len(c)} bytes")

# Write
with open(path, 'wb') as f:
    f.write(new_content)

print("\nWritten. Checking syntax...")

# Verify syntax
try:
    import ast
    with open(path, encoding='utf-8') as f:
        ast.parse(f.read())
    print("Syntax OK!")
except SyntaxError as e:
    print(f"SYNTAX ERROR at line {e.lineno}: {e.msg}")
    print(f"  {e.text}")
