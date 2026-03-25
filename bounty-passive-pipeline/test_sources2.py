#!/usr/bin/env python3
import cloudscraper, re

PLATE = 'AJ05RCF'
scraper = cloudscraper.create_scraper()

# isitnicked.com - find API from JS
print('=== isitnicked.com JS analysis ===')
try:
    r = scraper.get('https://isitnicked.com/', timeout=10)
    # Find all JS files
    js_files = re.findall(r'src=["\']([^"\']+\.js[^"\']*)["\']', r.text)
    print(f'JS files: {js_files[:10]}')
    # Check main JS for API endpoints
    for js_url in js_files[:5]:
        if js_url.startswith('/'):
            js_url = 'https://isitnicked.com' + js_url
        try:
            jr = scraper.get(js_url, timeout=8)
            apis = re.findall(r'["\'](/[\w/\-]+|https?://[^\s"\']+)["\'].*?(?:search|check|api|fetch)', jr.text[:10000], re.I)
            if apis:
                print(f'  API in {js_url}: {apis[:5]}')
        except:
            pass
    # Try known patterns
    for path in [f'/CheckIfNicked?reg={PLATE}', f'/api/check/{PLATE}', f'/api/v1/check/{PLATE}']:
        r2 = scraper.get('https://isitnicked.com' + path, timeout=8)
        print(f'  GET {path}: {r2.status_code} -- {r2.text[:100]}')
except Exception as e:
    print(f'Error: {e}')

# Try carwow static JS
print()
print('=== carwow.co.uk JS analysis ===')
try:
    r = scraper.get('https://www.carwow.co.uk/car-check', timeout=10)
    js_files = re.findall(r'src=["\']([^"\']+\.js[^"\']*)["\']', r.text)
    print(f'JS files: {js_files[:10]}')
    # Try their known API patterns
    for path in [
        f'/api/v1/vehicle/{PLATE}',
        f'/api/mot/{PLATE}',
        f'/api/check/{PLATE}',
        f'/api/vehicle/check?reg={PLATE}',
    ]:
        r2 = scraper.get('https://www.carwow.co.uk' + path, timeout=5, headers={'Accept': 'application/json'})
        print(f'  GET {path}: {r2.status_code} -- {r2.text[:150]}')
except Exception as e:
    print(f'Error: {e}')

# motortradesolutions - free MOT data
print()
print('=== motortradesolutions.co.uk ===')
try:
    r = scraper.get('https://www.motortradesolutions.co.uk/free-mot-check', timeout=10)
    print(f'Status: {r.status_code}')
    inputs = re.findall(r'<input[^>]+name=["\']([^"\']+)["\'][^>]+>', r.text, re.I)
    print(f'Inputs: {inputs[:10]}')
    forms = re.findall(r'<form[^>]+action=["\']([^"\']+)["\']', r.text, re.I)
    print(f'Forms: {forms[:5]}')
except Exception as e:
    print(f'Error: {e}')

# Try gov.uk MOT API (the actual DVSA one)
print()
print('=== check-mot.service.gov.uk ===')
try:
    r = scraper.get('https://check-mot.service.gov.uk/', timeout=10)
    print(f'Status: {r.status_code}')
    # Try API
    r2 = scraper.get(f'https://check-mot.service.gov.uk/api/mot-history/{PLATE}', timeout=10)
    print(f'API status: {r2.status_code} -- {r2.text[:300]}')
except Exception as e:
    print(f'Error: {e}')
