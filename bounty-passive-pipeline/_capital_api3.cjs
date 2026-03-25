const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const base = 'https://api-website.capital.com';
  
  // Try different API paths on api-website
  const tests = [
    '/api/v1/disclaimer/en-gb/gb',
    '/api/v1/disclaimer/en-us/us',
    '/api/v1/disclaimer/de-de/de',
    '/api/v1/structure/languages/en-gb/',
    '/api/v1/structure/instruments/en-gb/',
    '/api/v1/structure/markets/en-gb/',
    '/api/v1/translation/instrument-page/en-gb',
    '/api/v1/translation/trading-page/en-gb',
    '/api/v1/translation/main-page/en-gb',
    '/api/v1/translation/header/en-gb',
    '/api/v1/translation/footer/en-gb',
    '/api/v1/config/site/en-gb',
    '/api/v1/config/trading/en-gb',
    '/api/v1/navigation/en-gb',
    '/api/v1/menu/en-gb',
  ];
  
  for (const t of tests) {
    try {
      const r = await page.request.get(base + t, { timeout: 5000 });
      if (r.status() < 500) {
        console.log(r.status() + ' | ' + t);
      }
    } catch {}
  }
  
  // Try service-point/sync POST with various payloads
  console.log('\n=== service-point/sync POST ===');
  
  // 422 with base64 data - try different approaches
  const rawPayloads = [
    '{}',
    'test',
    'data',
    'eyJzIjoidGVzdCJ9',
  ];
  
  for (const raw of rawPayloads) {
    try {
      const r = await page.request.post(base + '/api/v2/service-point/sync', {
        data: raw,
        headers: { 'Content-Type': 'text/plain' },
        timeout: 5000
      });
      const ct = r.headers()['content-type'] || '';
      const t = await r.text();
      console.log(r.status() + ' | ' + ct.slice(0,20) + ' | raw: ' + raw + ' | ' + t.slice(0, 100));
    } catch {}
  }
  
  // Try form-encoded
  try {
    const r = await page.request.post(base + '/api/v2/service-point/sync', {
      data: 'data=test',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 5000
    });
    console.log(r.status() + ' | form-urlencoded | ' + (await r.text()).slice(0, 100));
  } catch {}
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
