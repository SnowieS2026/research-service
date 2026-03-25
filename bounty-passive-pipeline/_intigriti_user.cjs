const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json'
  });
  const page = await ctx.newPage();
  await page.goto('https://app.intigriti.com/researcher/dashboard', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Get user's submissions - shows programs they're accepted to
  const r = await page.request.get('https://app.intigriti.com/api/core/researcher/submissions?limit=50');
  const submissions = await r.json();
  console.log('Submissions status:', r.status());
  console.log('Submissions:', JSON.stringify(submissions).slice(0, 1000));
  
  // Also check applications
  const r2 = await page.request.get('https://app.intigriti.com/api/core/researcher/applications');
  const apps = await r2.json();
  console.log('\nApplications:', JSON.stringify(apps).slice(0, 500));

  const fs = require('fs');
  fs.writeFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/intigriti-user-data.json', JSON.stringify({ submissions, applications: apps }, null, 2));
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
