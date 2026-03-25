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
  
  // Try various settings/report URLs that might have scope
  const urls = [
    'https://hackerone.com/superhuman/safe_harbor?type=team',
    'https://hackerone.com/superhuman/submissions/new',
    'https://hackerone.com/superhuman/scope',
    'https://hackerone.com/bugs?organization_inbox_handle=superhuman_inbox',
    'https://hackerone.com/superhuman/program_members',
  ];
  
  for (const url of urls) {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(4000);
    console.log('\n[' + url + ']');
    console.log('  URL: ' + page.url());
    console.log('  Title: ' + (await page.title()));
    
    const text = await page.evaluate(() => document.body.innerText.slice(0, 300));
    console.log('  Text: ' + text.replace(/\n/g, ' ').slice(0, 200));
  }
  
  // Save all GraphQL for analysis
  const fs = require('fs');
  fs.writeFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/h1-graphql-all.json', JSON.stringify(gql, null, 2));
  console.log('\nTotal GraphQL responses: ' + gql.length);
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
