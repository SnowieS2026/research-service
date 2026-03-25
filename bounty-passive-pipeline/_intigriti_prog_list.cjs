const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json'
  });
  const page = await ctx.newPage();

  // Navigate to establish context
  await page.goto('https://app.intigriti.com/researcher/dashboard', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Use page.request which automatically includes cookies
  const r = await page.request.get('https://app.intigriti.com/api/core/researcher/invites');
  const invites = await r.json();
  console.log('Invites status:', r.status());
  console.log('Invites data:', JSON.stringify(invites).slice(0, 500));

  const r2 = await page.request.get('https://app.intigriti.com/api/core/researcher/programs?page=1&limit=50');
  const programs = await r2.json();
  console.log('\nPrograms status:', r2.status());
  if (programs.data) {
    console.log('Programs count:', programs.total || programs.data.length);
    const bugs = programs.data.filter(p => p.programType === 'Bug bounty program');
    bugs.slice(0, 10).forEach(p => {
      console.log('  ' + p.handle + ' | ' + p.name + ' | ' + (p.minBounty?.value||'?') + '-' + (p.maxBounty?.value||'?') + ' ' + (p.maxBounty?.currency||''));
    });
  }

  const fs = require('fs');
  fs.writeFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/intigriti-full-data.json', JSON.stringify({ invites, programs }, null, 2));
  console.log('\nSaved.');
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
