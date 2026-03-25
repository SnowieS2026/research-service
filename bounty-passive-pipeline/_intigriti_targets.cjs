const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json'
  });
  const page = await ctx.newPage();
  await page.goto('https://app.intigriti.com/researcher/dashboard', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Get scope via API - targets endpoint
  const handles = ['belfius', 'newpharma', 'fortnox', 'intertoys', 'kahoot', 'ideals', 'solarwindssaas', 'belfius'];
  const results = {};

  for (const handle of handles) {
    console.log('\n=== ' + handle + ' ===');
    try {
      // Try program targets endpoint
      const r = await page.request.get('https://app.intigriti.com/api/core/researcher/programs/' + handle + '/targets');
      const text = await r.text();
      console.log('  Status:', r.status(), '| Length:', text.length);
      
      if (r.status() === 200 && text.length > 50) {
        try {
          const data = JSON.parse(text);
          const targets = data.data || data.targets || data;
          if (Array.isArray(targets)) {
            console.log('  Targets:', targets.length);
            const domains = targets.map(t => t.target?.domain || t.domain || t.url || t.target || JSON.stringify(t).slice(0,50)).filter(Boolean);
            console.log('  Sample domains:', domains.slice(0, 5));
            results[handle] = { targets: targets.length, domains: [...new Set(domains)].slice(0, 20) };
          } else {
            console.log('  Data:', JSON.stringify(data).slice(0, 300));
            results[handle] = data;
          }
        } catch (e) {
          console.log('  Parse error:', e.message);
          results[handle] = { raw: text.slice(0, 300) };
        }
      } else {
        results[handle] = { error: 'status ' + r.status() };
      }
    } catch (e) {
      console.log('  Error:', e.message);
      results[handle] = { error: e.message };
    }
    await page.waitForTimeout(1000);
  }

  const fs = require('fs');
  fs.writeFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/intigriti-targets.json', JSON.stringify(results, null, 2));
  
  // Print summary
  console.log('\n\n=== SUMMARY ===');
  for (const [h, d] of Object.entries(results)) {
    if (d.targets !== undefined) {
      console.log(h + ': ' + d.targets + ' targets, ' + (d.domains?.length||0) + ' domains');
      d.domains?.slice(0, 3).forEach(dom => console.log('  ' + dom));
    } else {
      console.log(h + ': ' + (d.error || JSON.stringify(d).slice(0,50)));
    }
  }
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
