const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json'
  });
  const page = await ctx.newPage();

  // Scrape scope from public Intigriti program pages
  // These are JS-rendered, but Playwright captures the final DOM
  const programs = [
    { slug: 'coveopublicbugbounty', name: 'Coveo', bounty: '100-5500' },
    { slug: 'toastvdp', name: 'Toast', bounty: 'VDP' },
    { slug: 'liferaydxp', name: 'Liferay DXP', bounty: '100-2000' },
    { slug: 'trustedfirmware', name: 'Trusted Firmware', bounty: '1000-20000' },
    { slug: 'excoscalebugbounty', name: 'Exoscale', bounty: '50-5000' },
    { slug: 'belfius', name: 'Belfius', bounty: '500-5000' },
    { slug: 'newpharma', name: 'New Pharma', bounty: 'VDP' },
    { slug: 'ideal DVDP', name: 'Ideal', bounty: 'VDP' },
  ];

  const results = [];
  for (const p of programs) {
    console.log('=== ' + p.name + ' ===');
    try {
      await page.goto('https://www.intigriti.com/researchers/bug-bounty-programs/' + p.slug, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(4000);
      
      const data = await page.evaluate(() => {
        const text = document.body.innerText;
        const urlRegex = /https?:\/\/[^\s<>"'#]+/g;
        const urls = text.match(urlRegex) || [];
        const domainSet = new Set();
        const pathSet = new Set();
        urls.forEach(u => {
          try {
            const url = new URL(u);
            if (!url.hostname.includes('intigriti') && !url.hostname.includes('google') && !url.hostname.includes('youtube') && !url.hostname.includes('linkedin')) {
              domainSet.add(url.hostname.replace(/\.$/, ''));
              if (url.pathname !== '/' && url.pathname.length > 1) {
                pathSet.add(url.pathname.split('?')[0]);
              }
            }
          } catch {}
        });
        return { domains: [...domainSet], paths: [...pathSet] };
      });
      
      console.log('  Domains: ' + data.domains.length, data.domains.slice(0, 5));
      console.log('  Paths: ' + data.paths.length, data.paths.slice(0, 5));
      results.push({ name: p.name, slug: p.slug, bounty: p.bounty, ...data });
    } catch (e) {
      console.log('  ERROR: ' + e.message);
      results.push({ name: p.name, slug: p.slug, bounty: p.bounty, error: e.message });
    }
    await page.waitForTimeout(2000);
  }

  const fs = require('fs');
  fs.writeFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/intigriti-scope-scraped.json', JSON.stringify(results, null, 2));
  
  console.log('\n=== SUMMARY ===');
  results.forEach(r => {
    if (r.error) {
      console.log('[ERR] ' + r.name + ': ' + r.error);
    } else {
      console.log('[OK] ' + r.name + ' | ' + r.domains.length + ' domains | ' + r.paths.length + ' paths | ' + r.domains.slice(0, 3).join(', '));
    }
  });

  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
