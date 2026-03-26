with open('vehicle-osint.py', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Fix model regex — use "up to Colour" approach which works
old = r"m = re.search(r'Model\s+([A-Za-z0-9 ]{2,40})(?=\s+Colour|\s+Year|\s+Fuel|\s+Engine|\s+Top|\s+0 to|$)', body)"
new = r"m = re.search(r'Model\s+([^\n]+?)\s+Colour', body)"

if old in content:
    content = content.replace(old, new)
    print("Fixed model regex")
else:
    print("Model regex not found - checking current...")
    import re
    found = re.search(r'm = re.search\(r\'Model[^\']+\', body\)', content)
    if found:
        print(f"Current: {found.group()}")

# Also fix the model cleanup section - it has wrong logic
old2 = '    # Strip any trailing Colour/Year/Yeof Manufacture artifacts\n    for bad in ["Colour", "Year of manufacture", "Colour of vehicle"]:\n        if model.endswith(bad):\n            model = model[:model.rfind(bad)].strip()'
new2 = '    # Strip trailing whitespace from model field\n    model = model.strip()'

if old2 in content:
    content = content.replace(old2, new2)
    print("Fixed model cleanup")
else:
    print("Model cleanup block not found")

with open('vehicle-osint.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
