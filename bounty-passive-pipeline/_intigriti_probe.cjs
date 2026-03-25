const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json'
  });
  const page = await ctx.newPage();
  
  // Capture all requests
  const requests = [];
  page.on('request', r => {
    const url = r.url();
    if (url.includes('intigriti')) requests.push({ method: r.method(), url: url.replace('https://app.intigriti.com','').replace('https://api.intigriti.com','') });
  });
  
  await page.goto('https://app.intigriti.com/researcher/programs', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(5000);
  
  console.log('All Intigriti requests:', requests.length);
  requests.forEach(r => console.log('  ' + r.method + ' ' + r.url));
  
  // Try API calls directly
  console.log('\n--- Direct API probes ---');
  const apis = [
    '/api/programs',
    '/api/researcher/programs',
    '/researcher/api/programs',
    '/api/v1/programs'
  ];
  for (const api of apis) {
    try {
      const r = await page.request.get('https://app.intigriti.com' + api);
      const text = await r.text();
      console.log(api + ' -> ' + r.status() + ' | ' + text.slice(0, 100));
    } catch (e) {
      console.log(api + ' -> ERROR: ' + e.message);
    }
  }
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
