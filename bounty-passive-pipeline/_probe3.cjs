const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json' });
  const page = await ctx.newPage();

  const programs = [
    { handle: 'dropbox', company: 'Dropbox' },
    { handle: 'eurid', company: 'EURid' },
    { handle: 'intigriti', company: 'Intigriti' },
  ];

  for (const p of programs) {
    console.log('\n=== ' + p.company + ' ===');

    // Try the authenticated API endpoints
    const apis = [
      '/api/core/researcher/programs/' + p.handle + '/targets',
      '/api/core/researcher/programs/' + p.handle + '/domains',
      '/api/core/programs/' + p.handle + '/targets',
    ];

    for (const api of apis) {
      try {
        const r = await page.request.get('https://app.intigriti.com' + api);
        const text = await r.text();
        if (r.status() === 200 && text.length > 50) {
          console.log('  ' + api + ' -> ' + r.status());
          console.log('  ' + text.slice(0, 400));
        } else {
          console.log('  ' + api + ' -> ' + r.status());
        }
      } catch (e) {
        console.log('  ' + api + ' ERR');
      }
    }

    // Try public page
    try {
      await page.goto('https://www.intigriti.com/researchers/bug-bounty-programs/' + p.handle, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
      const text = await page.evaluate(() => document.body.innerText);
      const urlRegex = /https?:\/\/[^\s<>"']+/g;
      const urls = text.match(urlRegex) || [];
      const domains = [];
      const seen = new Set();
      for (const u of urls) {
        try {
          const hostname = new URL(u).hostname;
          if (!seen.has(hostname) && !hostname.includes('intigriti') && !hostname.includes('google')) {
            seen.add(hostname);
            domains.push(hostname);
          }
        } catch {}
      }
      if (domains.length > 0) {
        console.log('  Public domains: ' + domains.slice(0, 10).join(', '));
      }
    } catch (e) {
      console.log('  Public page error: ' + e.message.slice(0, 50));
    }
  }

  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
