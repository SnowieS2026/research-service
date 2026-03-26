with open('vehicle-osint.py', 'rb') as f:
    data = f.read()

old_block = (
    b'        vmin = valuation.get("current_value_min", 0)\n'
    b'    vmax = valuation.get("current_value_max", 0)\n'
    b'    has_crit = any(a.get("severity") in ("critical","high") for a in advisories)\n'
    b'    risk_str = "HIGH" if has_crit else "LOW"\n'
    b'    print(f"\\n  --- Result ---")\n'
    b'    print(f"  {plate_clean}  {make} {model}  MOT:{mot_expiry or \'?\'}")\n'
    b'    if vmin and vmax:\n'
    b'        print(f"  Value: \xc2\xa3{vmin:,}\xe2\x80\x93\xc2\xa3{vmax:,}  Risk: {risk_str}")\n'
    b'    print(f"  Report: {out}")'
)
new_block = (
    b'    vmin = valuation.get("current_value_min", 0)\n'
    b'    vmax = valuation.get("current_value_max", 0)\n'
    b'    has_crit = any(a.get("severity") in ("critical","high") for a in advisories)\n'
    b'    risk_str = "HIGH" if has_crit else "LOW"\n'
    b'    print(f"\\n  --- Result ---")\n'
    b'    print(f"  {plate_clean}  {make} {model}  MOT:{mot_expiry or \'?\'}")\n'
    b'    if vmin and vmax:\n'
    b'        print(f"  Value: \xc2\xa3{vmin:,}\xe2\x80\x93\xc2\xa3{vmax:,}  Risk: {risk_str}")\n'
    b'    print(f"  Report: {out}")'
)

if old_block in data:
    data = data.replace(old_block, new_block)
    with open('vehicle-osint.py', 'wb') as f:
        f.write(data)
    print('Fixed!')
else:
    print('Pattern not found')
