with open('vehicle-osint.py', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

# Find and fix lines 713-720
for i, l in enumerate(lines):
    if 'for bad in ["Colour"' in l:
        print(f"Found bad cleanup at line {i+1}: {repr(l)}")
        # Replace with clean version - just strip
        lines[i] = '        model = model.strip()\n'
        # Remove the next 3 lines (if 'if model.endswith' etc.)
        j = i + 1
        while j < len(lines) and ('if model.endswith' in lines[j] or 'model = model[:' in lines[j]):
            print(f"  Removing line {j+1}: {repr(lines[j])}")
            lines[j] = ''
            j += 1
        break

# Fix the model regex
new_content = ''.join(lines)
old_regex = r"m = re.search(r'Model\s+([A-Za-z0-9 ]{2,40})(?=\s+Colour|\s+Year|\s+Fuel|\s+Engine|\s+Top|\s+0 to|$)', body)"
new_regex = r"m = re.search(r'Model\s+([^\n]+?)\s+Colour', body)"

if old_regex in new_content:
    new_content = new_content.replace(old_regex, new_regex)
    print("Fixed model regex")
else:
    print("Old regex not found")

with open('vehicle-osint.py', 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Done")
