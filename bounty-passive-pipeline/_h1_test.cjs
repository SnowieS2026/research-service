const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/hackerone-state.json' });
  const page = await ctx.newPage();
  
  await page.goto('https://hackerone.com/opportunities/all', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  
  const text = await page.evaluate(() => document.body.innerText.slice(0, 2000));
  console.log('Page text:');
  console.log(text.slice(0, 800));
  
  const links = await page.evaluate(() => {
    const as = document.querySelectorAll('a[href*="/programs/"]');
    return [...as].slice(0, 10).map(a => a.href);
  });
  console.log('\nProgram links:');
  links.forEach(l => console.log('  ' + l));
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
