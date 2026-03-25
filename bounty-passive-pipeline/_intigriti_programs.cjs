const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json'
  });
  const page = await ctx.newPage();
  
  // Get programs list
  const r = await page.request.get('https://app.intigriti.com/api/core/researcher/programs');
  const text = await r.text();
  let programs;
  try { programs = JSON.parse(text); } catch { console.log('Parse error:', text.slice(0, 200)); return; }
  
  console.log('Programs count:', programs.total || programs.length);
  const list = programs.data || programs.results || programs || [];
  console.log('\nPrograms:');
  for (const p of list.slice(0, 20)) {
    const name = p.name || p.companyName || p.slug || JSON.stringify(p).slice(0, 50);
    const slug = p.slug || p.id || '';
    console.log('  ' + name + ' (' + slug + ')');
  }
  
  // Save for later
  const fs = require('fs');
  fs.writeFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/intigriti-programs.json', JSON.stringify(list, null, 2));
  console.log('\nSaved ' + list.length + ' programs to logs/intigriti-programs.json');
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
