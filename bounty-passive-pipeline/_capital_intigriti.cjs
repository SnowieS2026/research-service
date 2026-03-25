const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json'
  });
  const page = await ctx.newPage();
  await page.goto('https://app.intigriti.com/researcher/dashboard', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Try Capital.com program page - intercept API calls
  const calls = [];
  page.on('response', async r => {
    if (r.url().includes('target') || r.url().includes('scope') || r.url().includes('asset') || r.url().includes('domain')) {
      const text = await r.text().catch(() => '');
      if (text.startsWith('{')) {
        calls.push({ url: r.url().replace('https://app.intigriti.com','').replace('https://api.intigriti.com',''), status: r.status(), body: text.slice(0, 300) });
      }
    }
  });

  await page.goto('https://app.intigriti.com/researcher/programs/capitalcom', { timeout: 30000 });
  await page.waitForTimeout(5000);
  await page.waitForTimeout(3000);

  console.log('API calls captured:', calls.length);
  calls.forEach(c => {
    console.log('\n' + c.status + ' ' + c.url);
    console.log(c.body);
  });

  // Try authenticated API directly
  const r = await page.request.get('https://app.intigriti.com/api/core/researcher/programs/capitalcom');
  console.log('\nDirect API: ' + r.status());
  const text = await r.text();
  console.log(text.slice(0, 500));

  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
