const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  // === INTIGRITI ===
  const intCtx = await browser.newContext({
    storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json'
  });
  const intPage = await intCtx.newPage();
  
  // Capture API calls while loading programs page
  const apiCalls = [];
  intPage.on('response', async r => {
    const url = r.url();
    if (url.includes('api.') || url.includes('.json')) {
      try {
        const text = await r.text();
        if (text.startsWith('{') && text.length > 50) {
          apiCalls.push({ url: r.url(), body: text.slice(0, 300) });
        }
      } catch {}
    }
  });
  
  await intPage.goto('https://app.intigriti.com/researcher/programs', { waitUntil: 'networkidle', timeout: 45000 });
  await intPage.waitForTimeout(4000);
  
  console.log('Intigriti API calls captured:', apiCalls.length);
  apiCalls.slice(0, 5).forEach(c => {
    console.log('\nURL:', c.url.replace('https://api.intigriti.com','').replace('https://app.intigriti.com',''));
    console.log('BODY:', c.body);
  });
  
  // Try fetching program scope via API
  // Look for RIPE NCC program
  const ripeScope = await intPage.evaluate(async () => {
    // Try direct fetch to a program page
    const r = await fetch('/researcher/api/programs/ripe-ncc', { credentials: 'include' });
    return await r.text();
  }).catch(() => 'failed');
  console.log('\nRIPE NCC API response:', ripeScope.slice(0, 300));
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
