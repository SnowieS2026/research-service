const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const r = await page.request.get('http://open-api.capital.com', { timeout: 8000 });
  const text = await r.text();
  
  const urls = text.match(/https?:\/\/[^\s\\"'<>'"]+/g) || [];
  console.log('URLs in open-api page:');
  urls.slice(0, 15).forEach(u => console.log('  ' + u));
  
  // Try common spec paths
  const specPaths = ['/swagger/index.html', '/swagger-ui.html', '/api-docs', '/api-docs.json', '/swagger.json', '/openapi.json', '/api/swagger.json'];
  for (const sp of specPaths) {
    try {
      const r2 = await page.request.get('http://open-api.capital.com' + sp, { timeout: 5000 });
      const ct = r2.headers()['content-type'] || '';
      const t = await r2.text();
      console.log(r2.status() + ' | ' + ct.slice(0,30) + ' | ' + sp + ' | ' + t.slice(0, 150));
    } catch {}
  }
  
  // Try relocate-with-us.capital.com
  console.log('\n=== relocate-with-us.capital.com ===');
  try {
    const r3 = await page.request.get('http://relocate-with-us.capital.com', { timeout: 8000 });
    const h3 = r3.headers();
    console.log('Status: ' + r3.status());
    console.log('Server: ' + (h3['server'] || 'none'));
    const t3 = await r3.text();
    console.log('Content: ' + t3.slice(0, 500));
    
    // Check for API paths
    for (const p of ['/api', '/graphql', '/admin', '/swagger', '/v1/api']) {
      try {
        const r4 = await page.request.get('http://relocate-with-us.capital.com' + p, { timeout: 5000 });
        const t4 = await r4.text();
        console.log(r4.status() + ' | relocate-with-us' + p + ' | ' + t4.slice(0, 100));
      } catch {}
    }
  } catch (e) {
    console.log('Error: ' + e.message.slice(0, 100));
  }
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
