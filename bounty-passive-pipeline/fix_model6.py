with open('vehicle-osint.py', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Replace the whole model extraction + cleanup block with a clean version
old_block = '''    model = (raw.get("model", "") or "").strip()
    # Strip any trailing Colour/Year/Yeof Manufacture artifacts
    for bad in ["Colour", "Year of manufacture", "Colour of vehicle"]:
        if model.endswith(bad):
            model = model[:model.rfind(bad)].strip()'''

new_block = '''    _raw_model = (raw.get("model", "") or "").strip()
    # Extract just the model name — stop at Colour keyword
    import re as _re
    _m = _re.search(r'Model\s+([^\n]+?)\s+Colour', body)
    model = _m.group(1).strip() if _m else _raw_model'''

if old_block in content:
    content = content.replace(old_block, new_block)
    print("Fixed!")
else:
    print("Not found - trying alternate")
    # Try without the comments
    old2 = '    model = (raw.get("model", "") or "").strip()\n    # Strip any trailing'
    if old2 in content:
        print("Found old2")
        content = content.replace(old2, new_block)
        print("Fixed via old2")
    else:
        print("Not found at all")

with open('vehicle-osint.py', 'w', encoding='utf-8') as f:
    f.write(content)
