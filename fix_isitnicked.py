lines = open(r'C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\vehicle-osint.py', 'rb').read().split(b'\r\n')
print(f'Total lines: {len(lines)}')

# Show current state of the problem area
for i in range(857, 867):
    print(f'{i+1}: {lines[i]!r}')

# Fix lines 860-863 (0-indexed: 859-862)
lines[859] = b'        if not result["findings"]:'
lines[860] = b'            result["errors"].append("isitnicked.com: no result parsed from page")'
lines[861] = b'    except Exception as e:'
lines[862] = b'        result["errors"].append(f"isitnicked.com: {e}")'

print()
print('After fix:')
for i in range(857, 867):
    print(f'{i+1}: {lines[i]!r}')

new_content = b'\r\n'.join(lines)
with open(r'C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\vehicle-osint.py', 'wb') as f:
    f.write(new_content)
print(f'\nWritten {len(new_content)} bytes')

import ast
try:
    ast.parse(new_content.decode('utf-8'))
    print('Syntax OK')
except SyntaxError as e:
    print(f'Syntax error at line {e.lineno}: {e.msg}')
