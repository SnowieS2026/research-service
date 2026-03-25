const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/hackerone-state.json' });
  const page = await ctx.newPage();
  
  const graphqlResponses = [];
  
  // Capture GraphQL responses
  ctx.on('response', async r => {
    try {
      if (r.url().includes('/graphql') && r.request().method() === 'POST') {
        const text = await r.text();
        if (text.startsWith('{')) {
          graphqlResponses.push({ url: r.url(), body: JSON.parse(text) });
        }
      }
    } catch {}
  });
  
  await page.goto('https://hackerone.com/opportunities/my_programs', { waitUntil: 'networkidle', timeout: 25000 });
  await page.waitForTimeout(6000);
  
  console.log('GraphQL responses captured: ' + graphqlResponses.length);
  
  // Find program data
  for (const gq of graphqlResponses) {
    const str = JSON.stringify(gq.body);
    if (str.includes('program') || str.includes('handle') || str.includes('opportunity')) {
      console.log('\n=== GraphQL response (' + gq.url + ') ===');
      console.log(JSON.stringify(gq.body, null, 2).slice(0, 2000));
      break;
    }
  }
  
  const fs = require('fs');
  fs.writeFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/h1-graphql.json', JSON.stringify(graphqlResponses, null, 2));
  console.log('\nSaved to logs/h1-graphql.json');
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
