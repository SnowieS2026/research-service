const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/bugcrowd-state.json'
  });
  const page = await ctx.newPage();

  // Get all engagement links from dashboard
  await page.goto('https://bugcrowd.com/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const engLinks = await page.evaluate(() => {
    return [...document.querySelectorAll('a[href*="/engagements/"]')]
      .map(a => a.href.replace('https://bugcrowd.com/engagements/', ''))
      .filter(s => s && !s.includes('/') && !s.match(/^\?/))
      .filter((v, i, a) => a.indexOf(v) === i);
  });
  console.log('Engagements:', engLinks);

  // Scrape scope for each
  const results = {};
  for (const eng of engLinks) {
    console.log('\n=== ' + eng + ' ===');
    try {
      await page.goto('https://bugcrowd.com/engagements/' + eng, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(5000);

      // Scroll to load everything
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1500);
      }

      const data = await page.evaluate(() => {
        const text = document.body.innerText;
        const urlRegex = /https?:\/\/[^\s<>"']+/g;
        const urls = text.match(urlRegex) || [];
        const filtered = urls.filter(u =>
          !u.includes('bugcrowd.com') &&
          !u.includes('youtube.com') &&
          !u.includes('google.com') &&
          !u.includes('vimeo.com') &&
          !u.includes('linkedin.com') &&
          !u.includes('twitter.com') &&
          !u.includes('facebook.com') &&
          !u.match(/\.(pdf|doc|ppt|jpg|png|gif|css|js|ico)/) &&
          u.length < 300
        );
        const domainSet = new Set();
        const pathSet = new Set();
        filtered.forEach(u => {
          try {
            const url = new URL(u);
            if (!url.hostname.includes('bugcrowd')) {
              domainSet.add(url.hostname.replace(/\.$/, ''));
              if (url.pathname !== '/') pathSet.add(url.pathname);
            }
          } catch {}
        });
        return {
          domains: [...domainSet],
          paths: [...pathSet],
          title: document.title
        };
      });

      console.log('  Title:', data.title);
      console.log('  Domains:', data.domains.length, data.domains.slice(0, 5));
      console.log('  Paths:', data.paths.length);
      results[eng] = data;
    } catch (e) {
      console.log('  ERROR:', e.message);
      results[eng] = { error: e.message };
    }
  }

  // Save all scope data
  fs.writeFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/bugcrowd-scope-all.json', JSON.stringify(results, null, 2));

  // Summary
  console.log('\n\n=== FINAL ===');
  for (const [eng, data] of Object.entries(results)) {
    if (data.error) {
      console.log('[ERR] ' + eng);
    } else {
      const d = data.domains.length;
      console.log('[OK] ' + eng + ' | ' + d + ' domains | ' + (data.domains.slice(0, 3)).join(', '));
    }
  }

  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
