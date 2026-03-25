const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/hackerone-state.json' });
  const page = await ctx.newPage();
  
  const pages = [
    { url: 'https://hackerone.com/opportunities/my_programs', name: 'My Programs' },
    { url: 'https://hackerone.com/opportunities/pending_invitations', name: 'Pending Invitations' },
  ];
  
  for (const p of pages) {
    console.log('\n=== ' + p.name + ' ===');
    await page.goto(p.url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(5000);
    
    const text = await page.evaluate(() => document.body.innerText);
    
    // Extract program names and handles
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    console.log('Text preview:');
    console.log(lines.slice(0, 30).join('\n'));
    
    // Extract program URLs
    const progLinks = await page.evaluate(() => {
      const as = document.querySelectorAll('a[href*="/programs/"]');
      return [...new Set([...as].map(a => a.href))].slice(0, 20);
    });
    console.log('\nProgram links (' + progLinks.length + '):');
    progLinks.forEach(l => console.log('  ' + l));
  }
  
  // Also try to find the structured data
  await page.goto('https://hackerone.com/opportunities/my_programs', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  const jsonData = await page.evaluate(() => {
    // Look for JSON in page source
    const scripts = document.querySelectorAll('script[type="application/json"]');
    const results = [];
    scripts.forEach(s => {
      try {
        const d = JSON.parse(s.textContent);
        if (JSON.stringify(d).includes('program') || JSON.stringify(d).includes('handle')) {
          results.push(JSON.stringify(d).slice(0, 500));
        }
      } catch {}
    });
    return results;
  });
  console.log('\nJSON data found: ' + jsonData.length);
  jsonData.slice(0, 3).forEach(j => console.log(j.slice(0, 300)));
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
