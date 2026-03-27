const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
  const page = await browser.newPage();
  
  await page.goto('https://www.car-checking.com/', { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.waitForTimeout(3000);
  
  const bodyText = (await page.textContent('body') || '').substring(0, 3000);
  console.log('=== CAR-CHECKING HOME ===');
  console.log(bodyText);
  await browser.close();
})().catch(e => console.error(e.message));
