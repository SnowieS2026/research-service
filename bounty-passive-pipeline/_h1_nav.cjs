const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/hackerone-state.json' });
  const page = await ctx.newPage();
  
  // Go to my programs page and click on Superhuman
  await page.goto('https://hackerone.com/opportunities/my_programs', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  // Try clicking on the program link
  const superhumanLink = await page.locator('a[href*="superhuman"]').first();
  const href = await superhumanLink.getAttribute('href').catch(() => 'not found');
  console.log('Superhuman link href: ' + href);
  
  // Try direct URL variations
  const urls = [
    'https://hackerone.com/superhuman',
    'https://hackerone.com/programs/superhuman',
    'https://hackerone.com/engagements/superhuman',
    'https://hackerone.com/bug-bounty-programs/superhuman',
  ];
  
  for (const url of urls) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);
    const finalUrl = page.url();
    const title = await page.title();
    console.log(url + ' -> ' + finalUrl + ' [' + title + ']');
  }
  
  // Capture GraphQL on the opportunities page for "my programs" query
  const gql = [];
  ctx.on('response', async r => {
    try {
      if (r.url().includes('/graphql') && r.request().method() === 'POST') {
        const text = await r.text();
        if (text.startsWith('{')) {
          const parsed = JSON.parse(text);
          const str = JSON.stringify(parsed);
          if (str.includes('team') || str.includes('scope')) {
            gql.push({ url: r.url(), body: parsed });
          }
        }
      }
    } catch {}
  });
  
  await page.goto('https://hackerone.com/opportunities/my_programs', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  console.log('\nScope-related GraphQL (' + gql.length + '):');
  for (const gq of gql) {
    console.log(JSON.stringify(gq.body, null, 2).slice(0, 1500));
  }
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
