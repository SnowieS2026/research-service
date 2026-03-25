const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/hackerone-state.json' });
  const page = await ctx.newPage();
  
  await page.goto('https://hackerone.com/opportunities/my_programs', { waitUntil: 'networkidle', timeout: 25000 });
  
  // Wait for React to render
  await page.waitForTimeout(8000);
  
  // Check what's in the DOM
  const bodyHTML = await page.evaluate(() => document.body.innerHTML.slice(0, 3000));
  console.log('Body HTML preview:');
  console.log(bodyHTML.slice(0, 1500));
  
  // Try to find program cards
  const cards = await page.evaluate(() => {
    const els = document.querySelectorAll('[class*="program"], [class*="opportunity"], [class*="card"]');
    return [...els].slice(0, 5).map(el => el.className + ': ' + el.innerText.slice(0, 100));
  });
  console.log('\nCards found: ' + cards.length);
  cards.forEach(c => console.log('  ' + c));
  
  // Check network requests for program data
  const allRequests = [];
  page.on('request', r => {
    if (r.url().includes('graphql') || r.url().includes('json') || r.url().includes('programs')) {
      allRequests.push(r.url());
    }
  });
  
  await page.reload({ waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  console.log('\nRelevant requests:');
  allRequests.slice(0, 20).forEach(u => console.log('  ' + u));
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
