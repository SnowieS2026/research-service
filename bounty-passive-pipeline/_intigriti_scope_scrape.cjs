const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json'
  });
  const page = await ctx.newPage();

  // Most promising programs (public scope, high bounties)
  const targets = [
    { slug: 'coveopublicbugbounty', name: 'Coveo', min: 100, max: 5500 },
    { slug: 'toastvdp', name: 'Toast', min: 0, max: 0 },
    { slug: 'liferaydxp', name: 'Liferay DXP', min: 100, max: 2000 },
    { slug: 'trustedfirmware', name: 'Trusted Firmware', min: 1000, max: 20000 },
    { slug: 'excoscalebugbounty', name: 'Exoscale', min: 50, max: 5000 },
  ];

  const results = {};
  for (const t of targets) {
    console.log('\n=== ' + t.name + ' (' + t.slug + ') ===');
    try {
      await page.goto('https://www.intigriti.com/researchers/bug-bounty-programs/' + t.slug, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(4000);

      // Extract all URLs and domains
      const data = await page.evaluate(() => {
        const text = document.body.innerText;
        const urlRegex = /https?:\/\/[^\s<>"']+/g;
        const urls = (text.match(urlRegex) || []);
        const domainSet = new Set();
        const pathSet = new Set();
        urls.forEach(u => {
          try {
            const url = new URL(u);
            if (!url.hostname.includes('intigriti.com') && !url.hostname.includes('google.com')) {
              domainSet.add(url.hostname.replace(/\.$/, ''));
              if (url.pathname !== '/') pathSet.add(url.pathname);
            }
          } catch {}
        });
        return { domains: [...domainSet], paths: [...pathSet] };
      });

      console.log('  Domains (' + data.domains.length + '):', data.domains.slice(0, 10));
      console.log('  Paths (' + data.paths.length + '):', data.paths.slice(0, 10));
      results[t.slug] = { name: t.name, bounty: t.min + '-' + t.max, ...data };

      // Also check for specific API endpoints
      for (const d of data.domains.slice(0, 5)) {
        const domain = 'https://' + d;
        try {
          const r = await page.request.get(domain + '/api');
          if (r.status() < 500) console.log('  /api on ' + d + ': ' + r.status());
        } catch {}
      }
    } catch (e) {
      console.log('  ERROR:', e.message);
      results[t.slug] = { name: t.name, error: e.message };
    }
    await page.waitForTimeout(2000);
  }

  const fs = require('fs');
  fs.writeFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/intigriti-scope.json', JSON.stringify(results, null, 2));
  console.log('\nSaved to logs/intigriti-scope.json');
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
