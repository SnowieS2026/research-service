const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  
  // Check Bugcrowd invites
  console.log('=== BUGCROWD INVITES ===');
  const bcCtx = await browser.newContext({ storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/bugcrowd-state.json' });
  const bcPage = await bcCtx.newPage();
  await bcPage.goto('https://bugcrowd.com/invites', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await bcPage.waitForTimeout(3000);
  const bcText = await bcPage.evaluate(() => document.body.innerText);
  console.log('Bugcrowd invites page: ' + bcText.slice(0, 500));
  
  // Check Bugcrowd engagements
  console.log('\n=== BUGCROWD ENGAGEMENTS ===');
  const engUrls = [
    'https://bugcrowd.com/engagements/invites',
    'https://bugcrowd.com/engagements',
  ];
  for (const url of engUrls) {
    await bcPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await bcPage.waitForTimeout(2000);
    const txt = await bcPage.evaluate(() => document.body.innerText);
    console.log(url + ': ' + txt.slice(0, 300));
  }
  
  // Check Intigriti applications
  console.log('\n=== INTIGRITI APPLICATIONS ===');
  const intCtx = await browser.newContext({ storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json' });
  const intPage = await intCtx.newPage();
  await intPage.goto('https://app.intigriti.com/researcher/applications', { waitUntil: 'networkidle', timeout: 20000 });
  await intPage.waitForTimeout(3000);
  const intText = await intPage.evaluate(() => document.body.innerText);
  console.log('Intigriti applications: ' + intText.slice(0, 800));
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
