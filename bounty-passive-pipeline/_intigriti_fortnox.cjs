const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json'
  });
  const page = await ctx.newPage();
  
  // Try Fortnox program
  const slug = 'fortnox-bug-bounty-program';
  const r = await page.request.get('https://app.intigriti.com/api/core/researcher/programs/' + slug + '/targets');
  const text = await r.text();
  console.log('Status:', r.status());
  console.log('Response:', text.slice(0, 1000));
  
  // Also try without /targets
  const r2 = await page.request.get('https://app.intigriti.com/api/core/researcher/programs/' + slug);
  const text2 = await r2.text();
  console.log('\nProgram details:', text2.slice(0, 500));
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
