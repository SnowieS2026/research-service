#!/usr/bin/env python3
import cloudscraper, re

PLATE = 'AJ05RCF'
scraper = cloudscraper.create_scraper()

# --- isitnicked.com ---
print('=== isitnicked.com ===')
try:
    r = scraper.get('https://isitnicked.com/', timeout=10)
    print(f'Status: {r.status_code}')
    # Look for API patterns
    api_urls = re.findall(r'["\']/[\w/\-]+["\']', r.text)
    print(f'URLs found: {api_urls[:15]}')
    # Try the turnstile challenge bypass with a proper form submit
    r2 = scraper.post('https://isitnicked.com/CheckIfNicked',
                       data={'Vrm': PLATE, 'Vin': '', 'SearchType': 'reg'},
                       timeout=10, allow_redirects=True)
    print(f'Search status: {r2.status_code}')
    print(f'Search body: {r2.text[:600]}')
except Exception as e:
    print(f'Error: {e}')

# --- checkcardetails.co.uk direct ---
print()
print('=== checkcardetails.co.uk direct ===')
try:
    r = scraper.get(f'https://www.checkcardetails.co.uk/cardetails/{PLATE}', timeout=10)
    print(f'Status: {r.status_code}')
    print(r.text[:800])
except Exception as e:
    print(f'Error: {e}')

# --- carwow.co.uk ---
print()
print('=== carwow.co.uk API ===')
try:
    r = scraper.get('https://www.carwow.co.uk/car-check', timeout=10)
    print(f'Status: {r.status_code}')
    # Look for API keys/endpoints
    api_patterns = re.findall(r'(?:apiEndpoint|api_url|baseURL|graphql)[:\s]*["\']([^"\']+)["\']', r.text, re.I)
    print(f'API patterns: {api_patterns[:10]}')
    # Try their HPI check endpoint
    r2 = scraper.post('https://api.carwow.co.uk/v1/mot',
                       data={'registration': PLATE},
                       headers={'Accept': 'application/json'},
                       timeout=10)
    print(f'MOT API status: {r2.status_code}')
    print(f'MOT API body: {r2.text[:500]}')
except Exception as e:
    print(f'Error: {e}')
