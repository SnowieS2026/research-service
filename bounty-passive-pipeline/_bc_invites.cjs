const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/bugcrowd-state.json' });
  const page = await ctx.newPage();
  
  await page.goto('https://bugcrowd.com/engagements/invites', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  console.log('URL: ' + page.url());
  console.log('Title: ' + (await page.title()));
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log('Page text (first 2000):');
  console.log(text.slice(0, 2000));
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
