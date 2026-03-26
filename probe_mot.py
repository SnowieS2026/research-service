import cloudscraper, re

s = cloudscraper.create_scraper()
s.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://www.gov.uk/check-mot-history',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-GB,en;q=0.9',
})

r = s.get('https://www.gov.uk/check-mot-history', timeout=15)
print(f"History page: {r.status_code} {len(r.text)} chars")

# Extract form action
action = re.search(r'action=["\']([^"\']+)["\']', r.text)
if action:
    print(f"Form action: {action.group(1)}")

# Extract hidden form fields
tokens = re.findall(r'<input[^>]+name=["\']([^"\']+)["\']', r.text)
print(f"Form fields: {tokens}")

# Try POST
print("\nTrying POST...")
r2 = s.post(
    'https://www.check-mot.service.gov.uk/check-mot-history',
    data={'registration': 'AJ05RCF'},
    timeout=15
)
print(f"POST Status: {r2.status_code} URL: {r2.url}")
print(f"Response (first 800): {r2.text[:800]}")
