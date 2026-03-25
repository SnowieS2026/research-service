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
  
  // Navigate to Superhuman program
  await page.goto('https://hackerone.com/superhuman/safe_harbor', { waitUntil: 'networkidle', timeout: 25000 });
  await page.waitForTimeout(6000);
  
  console.log('URL: ' + page.url());
  console.log('Title: ' + (await page.title()));
  
  // Look for scope in GraphQL
  for (const gq of gql) {
    const str = JSON.stringify(gq);
    if (str.includes('structured_scope') || str.includes('asset') || str.includes('in_scope') || str.includes('scope')) {
      console.log('\n=== Scope GraphQL ===');
      console.log(JSON.stringify(gq, null, 2).slice(0, 5000));
      break;
    }
  }
  
  // Extract URLs from DOM
  const urls = await page.evaluate(() => {
    const seen = new Set();
    const results = [];
    const linkEls = document.querySelectorAll('a[href]');
    linkEls.forEach(a => {
      try {
        const u = new URL(a.href);
        if (!u.hostname.includes('hackerone') && !u.hostname.includes('stripe') && !u.hostname.includes('google') && u.href.length < 200) {
          if (!seen.has(u.href)) {
            seen.add(u.href);
            results.push(u.href);
          }
        }
      } catch {}
    });
    return results;
  });
  console.log('\nDOM URLs (' + urls.length + '):');
  urls.forEach(u => console.log('  ' + u));
  
  // Get text content for scope hints
  const text = await page.evaluate(() => document.body.innerText);
  const scopeSection = text.match(/scope|target|asset|in.?scope|attack.?surface/gi) || [];
  console.log('\nScope mentions: ' + scopeSection.length);
  
  const fs = require('fs');
  fs.writeFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/h1-superhuman-scope.json', JSON.stringify({ url: page.url(), title: page.title(), graphql: gql, domUrls: urls }, null, 2));
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
