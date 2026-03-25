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
          const parsed = JSON.parse(text);
          gql.push(parsed);
        }
      }
    } catch {}
  });
  
  await page.goto('https://hackerone.com/superhuman/policy_scopes', { waitUntil: 'networkidle', timeout: 25000 });
  await page.waitForTimeout(6000);
  
  console.log('URL: ' + page.url());
  console.log('Title: ' + (await page.title()));
  
  // Find scope data in GraphQL responses
  for (const gq of gql) {
    const str = JSON.stringify(gq);
    if (str.includes('asset') && (str.includes('url') || str.includes('WILDCARD') || str.includes('instruction'))) {
      console.log('\n=== Scope GraphQL ===');
      console.log(JSON.stringify(gq, null, 2).slice(0, 4000));
      break;
    }
  }
  
  // Extract URLs from page
  const urls = await page.evaluate(() => {
    const seen = new Set();
    const results = [];
    document.querySelectorAll('a[href], input[value]').forEach(el => {
      const val = el.href || el.value || '';
      if (val.includes('superhuman') || val.includes('grammarly') || val.includes('coda') || (val.startsWith('http') && !val.includes('hackerone'))) {
        try {
          const u = new URL(val.startsWith('http') ? val : 'https://' + val);
          if (!seen.has(u.href) && u.href.length < 300) {
            seen.add(u.href);
            results.push(u.href);
          }
        } catch {}
      }
    });
    return results;
  });
  console.log('\nDOM URLs (' + urls.length + '):');
  urls.forEach(u => console.log('  ' + u));
  
  // Get full text content
  const text = await page.evaluate(() => document.body.innerText);
  const scopeText = text.match(/superhuman\.com|grammarly\.com|coda\.io|api\.[a-z]+\.com|app\.[a-z]+\.com/g) || [];
  console.log('\nScope domains in text: ' + [...new Set(scopeText)].join(', '));
  
  const fs = require('fs');
  fs.writeFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/h1-superhuman-scopes.json', JSON.stringify(gql, null, 2));
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
