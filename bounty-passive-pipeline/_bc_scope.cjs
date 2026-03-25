const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/bugcrowd-state.json' });
  const page = await ctx.newPage();

  // Check Bugcrowd submissions to see programs with activity
  await page.goto('https://bugcrowd.com/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);

  // Get all engagement links
  const engs = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href*="/engagements/"]');
    const seen = new Set();
    const results = [];
    links.forEach(a => {
      const href = a.href.replace('https://bugcrowd.com/engagements/', '');
      if (href && !href.includes('/') && !seen.has(href)) {
        seen.add(href);
        results.push(href);
      }
    });
    return results;
  });
  console.log('Bugcrowd engagements:', engs.join(', '));

  // Also try to scrape scope from each engagement
  const allScope = {};
  for (const eng of engs) {
    try {
      await page.goto('https://bugcrowd.com/engagements/' + eng, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(3000);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);

      const text = await page.evaluate(() => document.body.innerText);
      const urlRegex = /https?:\/\/[^\s<>"']+/g;
      const urls = text.match(urlRegex) || [];
      const domains = [...new Set(urls.filter(u =>
        !u.includes('bugcrowd.com') &&
        !u.includes('youtube.com') &&
        !u.includes('google.com') &&
        u.length < 200
      ).map(u => { try { return new URL(u).hostname } catch { return null } }).filter(Boolean))];

      if (domains.length > 0) {
        console.log('\n[' + eng + '] ' + domains.length + ' domains:');
        domains.slice(0, 10).forEach(d => console.log('  ' + d));
        allScope[eng] = domains;
      }
    } catch {}
  }

  const fs = require('fs');
  fs.writeFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/bugcrowd-scope.json', JSON.stringify(allScope, null, 2));
  console.log('\nSaved to logs/bugcrowd-scope.json');
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
