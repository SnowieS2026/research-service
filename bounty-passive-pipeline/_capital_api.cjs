const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json' });
  const page = await ctx.newPage();
  
  const allApi = [];
  ctx.on('response', async r => {
    try {
      const url = r.url();
      if (url.includes('app.intigriti.com/api') && (r.request().method() === 'POST' || r.request().method() === 'GET')) {
        const text = await r.text();
        if (text.startsWith('{') || text.startsWith('[')) {
          const parsed = JSON.parse(text);
          allApi.push({ url: url.replace('https://app.intigriti.com', ''), body: parsed });
        }
      }
    } catch {}
  });
  
  await page.goto('https://app.intigriti.com/researcher/programs/capitalcom/capitalcom/detail', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  console.log('API responses captured: ' + allApi.length);
  
  for (const api of allApi) {
    const str = JSON.stringify(api.body);
    if (str.includes('domain') || str.includes('target') || str.includes('in_scope') || str.includes('asset')) {
      console.log('\n=== Scope API: ' + api.url + ' ===');
      console.log(JSON.stringify(api.body, null, 2).slice(0, 3000));
    }
  }
  
  const fs = require('fs');
  fs.writeFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/capital-api.json', JSON.stringify(allApi, null, 2));
  console.log('\nAll API saved to logs/capital-api.json');
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
