const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json'
  });
  const page = await ctx.newPage();
  await page.goto('https://app.intigriti.com/researcher/dashboard', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Get scope for Capital.com
  const handle = 'capitalcom';
  const endpoints = [
    '/api/core/researcher/programs/' + handle + '/targets',
    '/api/researcher/programs/' + handle + '/targets',
    '/api/core/programs/' + handle + '/targets',
    '/api/programs/' + handle + '/scope',
  ];
  
  for (const ep of endpoints) {
    const r = await page.request.get('https://app.intigriti.com' + ep);
    const text = await r.text();
    console.log(ep + ' -> ' + r.status() + ' | ' + text.slice(0, 200));
  }

  // Also try loading the program page and intercepting API calls
  const calls = [];
  page.on('response', async r => {
    if (r.url().includes('target') || r.url().includes('scope') || r.url().includes('asset')) {
      const text = await r.text().catch(() => '');
      if (text.startsWith('{')) {
        calls.push({ url: r.url().replace('https://app.intigriti.com',''), status: r.status() });
      }
    }
  });
  
  await page.goto('https://app.intigriti.com/researcher/programs/' + handle, { timeout: 30000 });
  await page.waitForTimeout(5000);
  console.log('\nCaptured API calls:');
  calls.forEach(c => console.log('  ' + c.status + ' ' + c.url));

  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
