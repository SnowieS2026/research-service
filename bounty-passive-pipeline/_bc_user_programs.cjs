const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/bugcrowd-state.json'
  });
  const page = await ctx.newPage();

  // Get all engagement links from Bugcrowd dashboard
  await page.goto('https://bugcrowd.com/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const engLinks = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href*="/engagements/"]');
    const results = new Set();
    links.forEach(a => {
      const href = a.href;
      const slug = href.replace('https://bugcrowd.com/engagements/', '');
      if (slug && slug.includes('/')) {
        results.add(slug.split('/')[0]);
      }
    });
    return [...results];
  });

  console.log('User engagement groups:', engLinks);

  // Get submissions to see programs
  await page.goto('https://bugcrowd.com/submissions', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const submissions = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href*="/engagements/"]');
    const results = new Set();
    links.forEach(a => {
      const slug = a.href.replace('https://bugcrowd.com/engagements/', '');
      if (slug && !slug.includes('/')) {
        results.add(slug);
      }
    });
    return [...results];
  });

  console.log('\nPrograms with submissions:', submissions);

  // Also get program directory
  await page.goto('https://bugcrowd.com/programs', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const programs = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href*="/programs/"]');
    const results = new Set();
    links.forEach(a => {
      const slug = a.href.replace('https://bugcrowd.com/programs/', '').split('?')[0].split('#')[0];
      if (slug && slug.length > 2 && slug.length < 100) {
        results.add(slug);
      }
    });
    return [...results].slice(0, 50);
  });

  console.log('\nPrograms on directory page:', programs.length);
  console.log(programs.slice(0, 20));

  const fs = require('fs');
  fs.writeFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/bugcrowd-user-programs.json', JSON.stringify({ engLinks, submissions, programs }, null, 2));
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
