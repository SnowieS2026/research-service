const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json'
  });
  const page = await ctx.newPage();

  // Try to get program details via API
  const programs = [
    { slug: 'coveopublicbugbounty', name: 'Coveo' },
    { slug: 'toastvdp', name: 'Toast' },
    { slug: 'liferaydxp', name: 'Liferay DXP' },
    { slug: 'excoscalebugbounty', name: 'Exoscale' },
    { slug: 'nutaku-bbp', name: 'Nutaku' },
  ];

  const results = {};
  for (const p of programs) {
    console.log('\n=== ' + p.name + ' ===');
    
    // Try authenticated API call within page context
    const result = await page.evaluate(async (slug) => {
      const endpoints = [
        '/api/core/researcher/programs/' + slug,
        '/api/core/programs/' + slug + '/targets',
        '/api/researcher/programs/' + slug + '/scope',
      ];
      for (const ep of endpoints) {
        try {
          const r = await fetch(ep, { credentials: 'include' });
          const text = await r.text();
          if (r.status !== 404 && text.length > 50) {
            return { endpoint: ep, status: r.status, body: text.slice(0, 500) };
          }
        } catch (e) {}
      }
      return { error: 'all endpoints returned 404 or empty' };
    }, p.slug);
    
    console.log('Result:', JSON.stringify(result));
    results[p.slug] = result;
    await page.waitForTimeout(1000);
  }

  const fs = require('fs');
  fs.writeFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/intigriti-api-results.json', JSON.stringify(results, null, 2));
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
