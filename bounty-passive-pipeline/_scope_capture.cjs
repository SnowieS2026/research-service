const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const SCOPE_DIR = 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/session-scope';
  const intPath = 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json';
  
  const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
  const ctx = await browser.newContext({ storageState: intPath });
  const page = await ctx.newPage();

  let captureCount = 0;
  
  // Capture ALL JSON responses from app.intigriti.com
  ctx.on('response', async r => {
    try {
      const url = r.url();
      if (!url.includes('app.intigriti.com') || !url.includes('api.')) return;
      
      const text = await r.text();
      if (!text.startsWith('{') && !text.startsWith('[')) return;
      
      let data;
      try { data = JSON.parse(text); } catch { return; }
      
      // Look for scope/target/asset data
      const str = JSON.stringify(data);
      if (str.includes('"domain') || str.includes('"url') || str.includes('"target') || str.includes('"in_scope') || str.includes('"asset')) {
        const filename = 'scope-' + Date.now() + '-' + (captureCount++) + '.json';
        fs.writeFileSync(path.join(SCOPE_DIR, filename), JSON.stringify({ url, data }, null, 2));
        console.log('[CAPTURED] ' + url.replace('https://app.intigriti.com',''));
      }
    } catch {}
  });

  console.log('Browser open. Navigate to an Intigriti program page and wait 5 seconds.');
  console.log('Press Enter in this terminal when done...');
  
  await new Promise(resolve => process.stdin.once('data', () => resolve()));
  
  console.log('Captured:', captureCount, 'scope responses');
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
