const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json'
  });
  const page = await ctx.newPage();

  // Get invites which should have scope info
  const invites = await page.evaluate(async () => {
    const r = await fetch('https://app.intigriti.com/api/core/researcher/invites', { credentials: 'include' });
    return await r.json();
  });
  console.log('Invites count:', invites.total || invites.length);
  
  if (invites.data) {
    console.log('\nInvited programs:');
    invites.data.forEach(i => {
      console.log('  ' + (i.program?.handle || i.handle || JSON.stringify(i).slice(0, 100)));
    });
  }
  
  if (invites.results) {
    console.log('\nInvited programs (results):');
    invites.results.forEach(i => {
      console.log('  ' + (i.program?.handle || i.handle || JSON.stringify(i).slice(0, 100)));
    });
  }

  // Also get full programs list
  const programs = await page.evaluate(async () => {
    const r = await fetch('https://app.intigriti.com/api/core/researcher/programs', { credentials: 'include' });
    return await r.json();
  });
  console.log('\n\nPrograms count:', programs.total || programs.length);
  
  if (programs.data) {
    const bugs = programs.data.filter(p => p.programType === 'Bug bounty program');
    const vdps = programs.data.filter(p => p.programType === 'Responsible disclosure');
    console.log('Bug bounty programs:', bugs.length);
    console.log('VDPs:', vdps.length);
    bugs.slice(0, 5).forEach(p => {
      console.log('  ' + p.handle + ' | ' + p.name + ' | ' + (p.minBounty?.value||'?') + '-' + (p.maxBounty?.value||'?') + ' ' + (p.maxBounty?.currency||''));
    });
  }

  const fs = require('fs');
  fs.writeFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/intigriti-full-data.json', JSON.stringify({ invites, programs }, null, 2));
  console.log('\nSaved to logs/intigriti-full-data.json');
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
