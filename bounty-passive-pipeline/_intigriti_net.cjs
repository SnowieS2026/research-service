const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json'
  });
  const page = await ctx.newPage();

  const requests = [];
  page.on('request', r => {
    const url = r.url();
    if (url.includes('api.') || url.includes('intigriti') && !url.match(/\.(js|css|png|jpg|woff)/)) {
      requests.push({ method: r.method(), url: url.replace('https://app.intigriti.com','').replace('https://api.intigriti.com','').replace('https://www.intigriti.com','') });
    }
  });
  page.on('response', async r => {
    const url = r.url();
    if (url.includes('api.') && !url.match(/\.(js|css|png|jpg|woff)/)) {
      try {
        const text = await r.text();
        if (text.startsWith('{') && text.length > 100) {
          console.log('JSON Response: ' + r.status() + ' ' + url.replace('https://app.intigriti.com','').replace('https://api.intigriti.com',''));
          console.log('  Body: ' + text.slice(0, 400));
        }
      } catch {}
    }
  });

  await page.goto('https://app.intigriti.com/researcher/programs', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  console.log('\nAll API requests:');
  requests.forEach(r => console.log('  ' + r.method + ' ' + r.url));

  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
