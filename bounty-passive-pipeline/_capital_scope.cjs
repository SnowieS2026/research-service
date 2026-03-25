const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json' });
  const page = await ctx.newPage();
  
  const gql = [];
  ctx.on('response', async r => {
    try {
      if (r.url().includes('/api/') && (r.request().method() === 'POST' || r.request().method() === 'GET')) {
        const text = await r.text();
        if (text.startsWith('{')) {
          gql.push({ url: r.url().replace('https://app.intigriti.com',''), body: JSON.parse(text) });
        }
      }
    } catch {}
  });
  
  await page.goto('https://app.intigriti.com/researcher/programs/capitalcom/capitalcom/detail', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  console.log('URL: ' + page.url());
  console.log('Title: ' + (await page.title()));
  
  const text = await page.evaluate(() => document.body.innerText);
  const urlRegex = /https?:\/\/[^\s<>"']+/g;
  const urls = text.match(urlRegex) || [];
  const seen = new Set();
  const domains = [];
  for (const u of urls) {
    try {
      const h = new URL(u).hostname;
      if (!h.includes('intigriti') && !h.includes('google') && u.length < 200) {
        if (!seen.has(h)) { seen.add(h); domains.push(h); }
      }
    } catch {}
  }
  
  console.log('Domains (' + domains.length + '):');
  domains.forEach(d => console.log('  ' + d));
  
  // Check GraphQL for scope
  console.log('\nGraphQL responses: ' + gql.length);
  for (const gq of gql) {
    const str = JSON.stringify(gq.body);
    if (str.includes('domain') || str.includes('scope') || str.includes('target') || str.includes('asset')) {
      console.log('\n=== Scope API ===');
      console.log(JSON.stringify(gq.body, null, 2).slice(0, 2000));
      break;
    }
  }
  
  const fs = require('fs');
  fs.writeFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/capital-scope.json', JSON.stringify({ url: page.url(), domains, gql }, null, 2));
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
