const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json' });
  const page = await ctx.newPage();
  await page.goto('https://app.intigriti.com/researcher/dashboard', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Get submissions
  const r = await page.request.get('https://app.intigriti.com/api/core/researcher/submissions?limit=50');
  const data = await r.json();
  console.log('Submissions:');
  const list = data.data || data.results || [];
  for (const s of list.slice(0, 20)) {
    const prog = s.program || s;
    console.log('  ' + (prog.handle || prog.name || JSON.stringify(prog).slice(0, 50)) + ' | ' + s.status + ' | ' + (s.bounty ? s.bounty.currency + s.bounty.value : 'no bounty'));
  }

  // Check applications
  const r2 = await page.request.get('https://app.intigriti.com/api/core/researcher/applications');
  const apps = await r2.json();
  console.log('\nApplications:');
  const appsList = apps.data || apps.results || [];
  for (const a of appsList.slice(0, 20)) {
    const prog = a.program || a;
    console.log('  ' + (prog.handle || prog.name || JSON.stringify(prog).slice(0, 50)) + ' | ' + a.status);
  }

  // Check for pending invites/credentials
  const r3 = await page.request.get('https://app.intigriti.com/api/core/researcher/credentials');
  const creds = await r3.json();
  console.log('\nCredentials:');
  const credsList = creds.data || creds.results || [];
  for (const c of credsList.slice(0, 10)) {
    console.log('  ' + JSON.stringify(c).slice(0, 100));
  }

  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
