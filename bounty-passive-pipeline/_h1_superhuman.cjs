const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/hackerone-state.json' });
  const page = await ctx.newPage();
  
  // Capture all GraphQL responses
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
  await page.goto('https://hackerone.com/programs/superhuman', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(6000);
  
  console.log('Page URL: ' + page.url());
  console.log('Page title: ' + (await page.title()));
  
  // Find scope in GraphQL responses
  for (const gq of gql) {
    const str = JSON.stringify(gq);
    if (str.includes('structured_scope') || str.includes('asset') || str.includes('URL') || str.includes('scope')) {
      console.log('\nScope GraphQL response:');
      console.log(JSON.stringify(gq, null, 2).slice(0, 3000));
      break;
    }
  }
  
  // Try to extract scope from DOM
  const scopeData = await page.evaluate(() => {
    const text = document.body.innerText;
    const results = { urls: [], domains: [] };
    
    // Look for URLs in text
    const urlMatches = text.match(/https?:\/\/[^\s<>"']+/g) || [];
    urlMatches.forEach(u => {
      try {
        const url = new URL(u);
        if (!url.hostname.includes('hackerone') && !url.hostname.includes('stripe') && u.length < 200) {
          results.urls.push(u);
        }
      } catch {}
    });
    
    return results;
  });
  
  console.log('\nURLs from DOM (' + scopeData.urls.length + '):');
  scopeData.urls.slice(0, 20).forEach(u => console.log('  ' + u));
  
  const fs = require('fs');
  fs.writeFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/h1-superhuman-scope.json', JSON.stringify({ graphql: gql, dom: scopeData }, null, 2));
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
