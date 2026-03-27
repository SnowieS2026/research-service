const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  
  try {
    await page.goto('https://www.car-checking.com/', { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await page.waitForTimeout(2000);
    
    // Fill in the reg search form
    const input = page.locator('input[type="text"], input[name*="reg" i], input[id*="reg" i]').first();
    if (await input.count() > 0) {
      await input.fill('GMZ2745');
      await page.waitForTimeout(500);
      const btn = page.locator('button, input[type="submit"]').filter({ hasText: /check|search|go/i }).first();
      if (await btn.count() > 0) {
        await btn.click();
        await page.waitForLoadState('networkidle', { timeout: 15_000 });
        await page.waitForTimeout(3000);
      }
    }
    
    const bodyText = (await page.textContent('body') || '').substring(0, 5000);
    console.log('=== CAR-CHECKING RESULT ===');
    console.log(bodyText);
  } catch(e) {
    console.log('Error:', e.message);
  }
  
  await browser.close();
})().catch(e => console.error(e.message));
