const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json'
  });
  const page = await ctx.newPage();
  
  const programs = require('./logs/intigriti-programs.json');
  const list = Array.isArray(programs) ? programs : (programs.data || []);
  
  console.log('Fetching scope for ' + list.length + ' programs...');
  
  const results = [];
  for (const p of list.slice(0, 30)) {
    const slug = p.slug || p.id || '';
    if (!slug) continue;
    
    try {
      const r = await page.request.get('https://app.intigriti.com/api/core/researcher/programs/' + slug + '/targets');
      const text = await r.text();
      let targets = [];
      try { targets = JSON.parse(text); } catch {}
      
      const domains = [];
      const urls = [];
      if (targets.data) {
        targets.data.forEach(t => {
          if (t.target) {
            const d = t.target.domain || t.target.url || t.target;
            if (d && typeof d === 'string' && d.length < 200) {
              domains.push(d);
            }
          }
        });
      }
      
      if (domains.length > 0) {
        console.log('\n[' + p.name + '] (' + slug + ') - ' + domains.length + ' targets');
        domains.slice(0, 10).forEach(d => console.log('  ' + d));
        results.push({ name: p.name, slug, domains: [...new Set(domains)] });
      }
    } catch (e) {}
    
    // Rate limit
    await page.waitForTimeout(500);
  }
  
  console.log('\n\n=== PROGRAMS WITH TARGETS ===');
  results.forEach(r => {
    console.log('\n[' + r.name + '] (' + r.slug + ')');
    r.domains.slice(0, 5).forEach(d => console.log('  ' + d));
  });
  
  const fs = require('fs');
  fs.writeFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/intigriti-scopes.json', JSON.stringify(results, null, 2));
  console.log('\n\nSaved to logs/intigriti-scopes.json');
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
