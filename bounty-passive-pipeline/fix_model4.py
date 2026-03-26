with open('vehicle-osint.py', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

old_regex = r"m = re.search(r'Model\s+([A-Za-z0-9 ]{2,40})(?:\s+(?=Colour|Year|Fuel|Engine|Gearbox|Top speed|0 to 60|CO2)|$)', body)"
new_regex = r"m = re.search(r'Model\s+([^\n]+?)\s+Colour', body)"

if old_regex in content:
    content = content.replace(old_regex, new_regex)
    print("Fixed!")
else:
    print("Not found")

with open('vehicle-osint.py', 'w', encoding='utf-8') as f:
    f.write(content)
