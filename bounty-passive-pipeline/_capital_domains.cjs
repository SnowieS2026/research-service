const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json' });
  const page = await ctx.newPage();
  
  await page.goto('https://app.intigriti.com/researcher/programs/capitalcom/capitalcom/detail', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  // Extract all URLs from page
  const data = await page.evaluate(() => {
    const urls = [];
    const seen = new Set();
    
    // From DOM text
    const text = document.body.innerText;
    const urlRegex = /https?:\/\/[a-zA-Z0-9][-a-zA-Z0-9.]*:[^\s<>"']+/g;
    let m;
    while ((m = urlRegex.exec(text)) !== null) {
      const u = m[0];
      if (!seen.has(u) && u.length < 200) {
        seen.add(u);
        urls.push({ u, src: 'text' });
      }
    }
    
    // From href attributes
    document.querySelectorAll('a[href]').forEach(a => {
      const u = a.href;
      if (u.startsWith('http') && !seen.has(u) && u.length < 200) {
        seen.add(u);
        urls.push({ u, src: 'href' });
      }
    });
    
    return urls;
  });
  
  const fs = require('fs');
  fs.writeFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/capital-page.json', JSON.stringify(data, null, 2));
  
  // Dedupe and show
  const unique = [...new Set(data.map(d => d.u))];
  console.log('Total URLs found: ' + unique.length);
  unique.forEach(u => console.log('  ' + u));
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
