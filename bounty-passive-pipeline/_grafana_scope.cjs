const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json' });
  const page = await ctx.newPage();
  
  await page.goto('https://app.intigriti.com/researcher/programs/grafanaossbbp', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  console.log('URL: ' + page.url());
  const text = await page.evaluate(() => document.body.innerText);
  
  // Find URLs
  const urlRegex = /https?:\/\/[^\s<>"']+/g;
  const urls = text.match(urlRegex) || [];
  const seen = new Set();
  const unique = [];
  for (const u of urls) {
    if (!seen.has(u) && u.length < 200) {
      seen.add(u);
      unique.push(u);
    }
  }
  
  console.log('URLs found: ' + unique.length);
  unique.slice(0, 20).forEach(u => console.log('  ' + u));
  
  // Check for scope text
  const lowerText = text.toLowerCase();
  if (lowerText.includes('scope')) {
    const idx = lowerText.indexOf('scope');
    console.log('\nScope context:');
    console.log(text.slice(Math.max(0, idx - 100), idx + 300));
  }
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
