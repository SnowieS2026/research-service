with open(r'C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\vehicle-osint.py', 'rb') as f:
    lines = f.read().split(b'\r\n')

for i, l in enumerate(lines):
    if b'cross_ref = cross_reference_enrichment' in l:
        lines[i] = b'    print("DEBUG: about to call cross_ref", flush=True)'
        lines.insert(i+1, b'    cross_ref = cross_reference_enrichment(make or "", model or "", year or 0, engine_cc or 0, fuel_type or "", insurance_data)')
        lines.insert(i+2, b'    print("DEBUG: done calling cross_ref", flush=True)')
        break

new_content = b'\r\n'.join(lines)
with open(r'C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\vehicle-osint.py', 'wb') as f:
    f.write(new_content)
print('Done')
import ast
try:
    ast.parse(new_content.decode('utf-8'))
    print('Syntax OK')
except SyntaxError as e:
    print('Syntax error at line', e.lineno)
