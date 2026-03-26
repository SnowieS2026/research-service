with open('vehicle-osint.py', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Fix model regex
old_regex = r"m = re.search(r'Model\s+([A-Za-z0-9 ]{2,40})(?:\s+(?=Colour|Year|Fuel|Engine|Gearbox|Top speed|0 to 60|CO2)|$)', body)"
new_regex = r"m = re.search(r'Model\s+([^\n]+?)\s+Colour', body)"
if old_regex in content:
    content = content.replace(old_regex, new_regex)
    print("Fixed model regex")
else:
    print("Old model regex not found")

# Fix the for bad loop — remove it entirely, just keep model = model.strip()
old_cleanup = '    # Strip any trailing Colour/Year/Yeof Manufacture artifacts\n    for bad in ["Colour", "Year of manufacture", "Colour of vehicle"]:\n        if model.endswith(bad):\n            model = model[:model.rfind(bad)].strip()'
new_cleanup = '    model = model.strip()'

if old_cleanup in content:
    content = content.replace(old_cleanup, new_cleanup)
    print("Fixed model cleanup")
else:
    print("Cleanup block not found exactly")
    # Try to find and remove it differently
    import re
    pattern = r'    # Strip any trailing Colour.*?(?=\n    model =|\n    #|$)'
    if re.search(pattern, content, re.DOTALL):
        content = re.sub(pattern, '    model = model.strip()', content, flags=re.DOTALL)
        print("Fixed model cleanup via regex")

with open('vehicle-osint.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
