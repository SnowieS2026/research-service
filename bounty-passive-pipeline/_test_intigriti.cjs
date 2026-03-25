const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  // Test Intigriti session
  const ctx = await browser.newContext({
    storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json'
  });
  const page = await ctx.newPage();
  await page.goto('https://app.intigriti.com/researcher/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Intigriti URL:', page.url());
  const title = await page.title();
  console.log('Intigriti title:', title);
  const text = await page.evaluate(() => document.body.innerText.slice(0, 300));
  console.log('Intigriti body:', text);
  
  // Get programs
  await page.goto('https://app.intigriti.com/researcher/programs', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  const programs = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href*="/programs/"]');
    const results = [];
    links.forEach(a => {
      const href = a.href;
      if (href && href.includes('/programs/')) {
        const slug = href.split('/programs/')[1];
        if (slug && slug.length > 2 && slug.length < 100) results.push(slug);
      }
    });
    return [...new Set(results)];
  });
  console.log('\nIntigriti programs:', programs.length);
  console.log(programs.slice(0, 20));
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
