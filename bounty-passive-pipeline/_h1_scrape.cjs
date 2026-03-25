const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/hackerone-state.json' });
  const page = await ctx.newPage();
  
  const gql = [];
  ctx.on('response', async r => {
    try {
      if (r.url().includes('/graphql') && r.request().method() === 'POST') {
        const text = await r.text();
        if (text.startsWith('{')) {
          gql.push(JSON.parse(text));
        }
      }
    } catch {}
  });
  
  await page.goto('https://hackerone.com/superhuman/safe_harbor?type=team', { waitUntil: 'networkidle', timeout: 25000 });
  await page.waitForTimeout(8000);
  
  console.log('URL: ' + page.url());
  console.log('Title: ' + (await page.title()));
  
  // Extract all text content
  const text = await page.evaluate(() => document.body.innerText);
  
  // Get URLs from page
  const urls = await page.evaluate(() => {
    const seen = new Set();
    const results = [];
    document.querySelectorAll('a[href]').forEach(a => {
      try {
        const u = new URL(a.href);
        if (!u.hostname.includes('hackerone') && !u.hostname.includes('stripe') && !u.hostname.includes('google') && u.href.length < 300) {
          if (!seen.has(u.href)) {
            seen.add(u.href);
            results.push(u.href);
          }
        }
      } catch {}
    });
    return results;
  });
  
  console.log('\nURLs found (' + urls.length + '):');
  urls.forEach(u => console.log('  ' + u));
  
  // Check GraphQL for scope
  const fs = require('fs');
  fs.writeFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/h1-graphql-all.json', JSON.stringify(gql, null, 2));
  
  // Find scope data in GraphQL
  for (const gq of gql) {
    const str = JSON.stringify(gq);
    if (str.includes('structured_scope') || (str.includes('asset') && str.includes('url'))) {
      console.log('\n=== Scope GraphQL ===');
      console.log(JSON.stringify(gq, null, 2).slice(0, 3000));
      break;
    }
  }
  
  // Save the page DOM for analysis
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  fs.writeFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/h1-superhuman-page.html', bodyHTML.slice(0, 50000));
  console.log('\nPage HTML saved to logs/h1-superhuman-page.html');
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
