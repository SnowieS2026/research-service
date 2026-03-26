import re

with open('vehicle-osint.py', 'rb') as f:
    content = f.read()

# Replace with correct bytes (CRLF)
old = b'    print(f"\\n  --- Result ---")\r\n    print(f"  {plate_clean}  {make} {model}  MOT:{mot_expiry or \'?\'}")\r\n    if val_min and val_max:\r\n        print(f"  Value: \xc2\xa3{val_min:,}\xe2\x80\x93\xc2\xa3{val_max:,}  Risk: {risk_emoji(\'low\')}")\r\n    print(f"  Report: {out}")'
new = b'    vmin = valuation.get("current_value_min", 0)\r\n    vmax = valuation.get("current_value_max", 0)\r\n    has_crit = any(a.get("severity") in ("critical","high") for a in advisories)\r\n    risk_str = "HIGH" if has_crit else "LOW"\r\n    print(f"\\n  --- Result ---")\r\n    print(f"  {plate_clean}  {make} {model}  MOT:{mot_expiry or \'?\'}")\r\n    if vmin and vmax:\r\n        print(f"  Value: \xc2\xa3{vmin:,}\xe2\x80\x93\xc2\xa3{vmax:,}  Risk: {risk_str}")\r\n    print(f"  Report: {out}")'

if old in content:
    content = content.replace(old, new)
    print("Fixed!")
else:
    # Try different line endings
    content_str = content.decode('utf-8', errors='replace')
    # Just replace the relevant section
    pattern = r'    print\(f"\\n  --- Result ---"\)[^\n]*\n.*?print\(f"  Report: \{out\}"\)'
    replacement = '''    vmin = valuation.get("current_value_min", 0)
    vmax = valuation.get("current_value_max", 0)
    has_crit = any(a.get("severity") in ("critical","high") for a in advisories)
    risk_str = "HIGH" if has_crit else "LOW"
    print(f"\\n  --- Result ---")
    print(f"  {plate_clean}  {make} {model}  MOT:{mot_expiry or '?'}")
    if vmin and vmax:
        print(f"  Value: £{vmin:,}–£{vmax:,}  Risk: {risk_str}")
    print(f"  Report: {out}")'''
    new_content = re.sub(pattern, replacement, content_str)
    if new_content != content_str:
        content = new_content.encode('utf-8')
        print("Fixed (regex)!")
    else:
        print("Could not find pattern to fix")
        # Show what we have
        idx = content_str.find('--- Result ---')
        if idx >= 0:
            print(repr(content_str[idx-50:idx+200]))

with open('vehicle-osint.py', 'wb') as f:
    f.write(content)
