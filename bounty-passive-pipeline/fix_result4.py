with open('vehicle-osint.py', 'r', encoding='utf-8') as f:
    data = f.read()

# Find and replace the broken block
old = '        vmin = valuation.get("current_value_min", 0)\n    vmax'
new = '    vmin = valuation.get("current_value_min", 0)\n    vmax'

if old in data:
    data = data.replace(old, new)
    with open('vehicle-osint.py', 'w', encoding='utf-8') as f:
        f.write(data)
    print('Fixed!')
else:
    print('Not found')
    idx = data.find('vmin = valuation')
    print(repr(data[idx-20:idx+200]))
