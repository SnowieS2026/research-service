const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json' });
  const page = await ctx.newPage();
  
  await page.goto('https://app.intigriti.com/researcher/programs/grafanaossbbp', { waitUntil: 'domcontentloaded', timeout: 15000 });
  
  // Wait for React to render - wait for specific text
  try {
    await page.waitForFunction(() => {
      return document.body.innerText.includes('Grafana') || 
             document.body.innerText.includes('scope') ||
             document.body.innerText.includes('In Scope') ||
             document.body.innerText.includes('Program');
    }, { timeout: 15000 });
  } catch (e) {
    console.log('Timeout waiting for content');
  }
  
  await page.waitForTimeout(3000);
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log('Page text length: ' + text.length);
  console.log('First 1000 chars:');
  console.log(text.slice(0, 1000));
  
  // Get all links
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href]')).map(a => a.href).filter(h => h.startsWith('http'));
  });
  console.log('\nLinks (' + links.length + '):');
  links.slice(0, 20).forEach(l => console.log('  ' + l));
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
