const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/hackerone-state.json' });
  const page = await ctx.newPage();
  
  // Test Hack1 API endpoints
  const apis = [
    'https://hackerone.com/api/v3/hackers/programs',
    'https://hackerone.com/api/v3/reports',
    'https://api.hackerone.com/v1/hackers/me',
  ];
  
  for (const url of apis) {
    try {
      const r = await page.request.get(url, { timeout: 10000 });
      const text = await r.text();
      console.log(url + ' -> ' + r.status() + ' | ' + text.slice(0, 200));
    } catch (e) {
      console.log(url + ' ERR: ' + e.message.slice(0, 50));
    }
  }
  
  // Try to navigate and wait for content
  await page.goto('https://hackerone.com/opportunities/all', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  const links = await page.evaluate(() => {
    const as = document.querySelectorAll('a[href]');
    return [...as].filter(a => a.href.includes('hackerone.com') && a.href.match(/\/programs\/|\/opportunities\//)).slice(0, 15).map(a => a.href);
  });
  console.log('\nOpportunities links:');
  links.forEach(l => console.log('  ' + l));
  
  // Also try /dir
  await page.goto('https://hackerone.com/directory', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  const dirText = await page.evaluate(() => document.body.innerText.slice(0, 500));
  console.log('\nDirectory page: ' + dirText.slice(0, 200));
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
