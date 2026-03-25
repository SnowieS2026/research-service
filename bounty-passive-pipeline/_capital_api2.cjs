const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const r = await page.request.get('http://open-api.capital.com', { timeout: 8000 });
  const text = await r.text();
  
  // Look for spec URL in redoc config - search for "spec" or "url" followed by .json
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.includes('spec') && line.includes('.json')) {
      console.log('Spec line: ' + line.trim().slice(0, 200));
    }
  }
  
  // Try to find the actual API spec URL
  const specUrls = [
    'https://capital.com/api/v1/spec',
    'https://capital.com/api/spec',
    'http://open-api.capital.com/spec',
    'http://open-api.capital.com/capital-api.json',
    'https://swagger.capital.com',
  ];
  
  for (const u of specUrls) {
    try {
      const r2 = await page.request.get(u, { timeout: 5000 });
      console.log(r2.status() + ' | ' + u);
    } catch {}
  }
  
  // Also check capital.com and www.capital.com for API paths
  console.log('\n--- capital.com API probes ---');
  const paths = ['/api', '/api/v1', '/api/v2', '/graphql', '/rest', '/api/health'];
  for (const p of paths) {
    try {
      const r3 = await page.request.get('https://capital.com' + p, { timeout: 5000 });
      const ct = r3.headers()['content-type'] || '';
      const t = await r3.text();
      console.log(r3.status() + ' | ' + ct.slice(0,30) + ' | ' + p + ' => ' + t.slice(0, 80));
    } catch (e) {
      console.log('ERR | ' + p);
    }
  }
  
  console.log('\n--- www.capital.com API probes ---');
  for (const p of paths) {
    try {
      const r4 = await page.request.get('https://www.capital.com' + p, { timeout: 5000 });
      const ct = r4.headers()['content-type'] || '';
      const t = await r4.text();
      console.log(r4.status() + ' | ' + ct.slice(0,30) + ' | ' + p + ' => ' + t.slice(0, 80));
    } catch (e) {
      console.log('ERR | ' + p);
    }
  }
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
