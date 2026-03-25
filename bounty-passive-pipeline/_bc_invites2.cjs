const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const bcCtx = await browser.newContext({ storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/bugcrowd-state.json' });
  const bcPage = await bcCtx.newPage();
  
  // Go to Bugcrowd dashboard first
  await bcPage.goto('https://bugcrowd.com/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await bcPage.waitForTimeout(2000);
  
  // Click on Invites
  await bcPage.goto('https://bugcrowd.com/engagements/invites', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await bcPage.waitForTimeout(5000);
  
  // Get all the invite text
  const text = await bcPage.evaluate(() => document.body.innerText);
  const lines = text.split('\n').filter(l => l.trim());
  
  console.log('Full page text:');
  console.log(text.slice(0, 2000));
  
  // Also get all links
  const links = await bcPage.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href]')).map(a => a.href).filter(h => h.includes('engagements') || h.includes('programs'));
  });
  console.log('\nEngagement links:');
  links.slice(0, 20).forEach(l => console.log('  ' + l));
  
  // Check if there are pending invites in the page
  const pendingSection = text.indexOf('Pending');
  if (pendingSection > -1) {
    console.log('\nPending section: ' + text.slice(pendingSection, pendingSection + 500));
  }
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
