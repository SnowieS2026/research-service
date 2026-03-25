const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ 
    storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36'
  });
  const page = await ctx.newPage();
  
  // Try Grafana OSS BBP - go to program page and look for Apply button
  console.log('=== Trying grafanaossbbp ===');
  await page.goto('https://app.intigriti.com/researcher/programs/grafanaossbbp', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  // Check page content
  const text = await page.evaluate(() => document.body.innerText);
  if (text.includes('Apply') || text.includes('apply')) {
    console.log('Found Apply text');
  }
  
  // Look for apply button
  const applyBtn = await page.$('button');
  const btns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(b => ({ text: b.innerText, disabled: b.disabled }));
  });
  console.log('Buttons: ' + JSON.stringify(btns));
  
  // Try clicking the apply button
  const applyButtons = await page.getByRole('button', { name: /apply/i }).all();
  console.log('Apply buttons found: ' + applyButtons.length);
  
  if (applyButtons.length > 0) {
    const isDisabled = await applyButtons[0].isDisabled();
    console.log('First apply button disabled: ' + isDisabled);
    if (!isDisabled) {
      await applyButtons[0].click();
      await page.waitForTimeout(3000);
      const newText = await page.evaluate(() => document.body.innerText);
      console.log('After click: ' + newText.slice(0, 500));
    }
  }
  
  // Check current URL
  console.log('Current URL: ' + page.url());
  
  // Check for toasts/notifications
  const toast = await page.$('.toast, .notification, [role="alert"]');
  if (toast) {
    const toastText = await toast.innerText();
    console.log('Toast: ' + toastText);
  }
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
