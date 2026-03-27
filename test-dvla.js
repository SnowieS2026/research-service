const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
  const page = await browser.newPage();
  
  await page.goto('https://vehicleenquiry.service.gov.uk/', { waitUntil: 'networkidle', timeout: 20_000 });
  await page.waitForTimeout(1000);
  try {
    const rejectBtn = page.locator('button').filter({ hasText: /reject/i }).first();
    if (await rejectBtn.count() > 0) { await rejectBtn.click(); await page.waitForLoadState('networkidle', { timeout: 10_000 }); }
  } catch {}
  await page.locator('#wizard_vehicle_enquiry_capture_vrn_vrn').fill('GMZ2745');
  await page.locator('button').filter({ hasText: /continue/i }).click();
  await page.waitForLoadState('networkidle', { timeout: 20_000 });
  await page.waitForTimeout(1500);

  // Click Yes
  try {
    await page.locator('input[type="radio"]').filter({ hasText: /yes/i }).click();
  } catch {}
  try {
    await page.locator('label').filter({ hasText: /yes/i }).click();
  } catch {}
  try {
    await page.locator('button').filter({ hasText: /continue/i }).click();
    await page.waitForLoadState('networkidle', { timeout: 20_000 });
    await page.waitForTimeout(1500);
  } catch {}

  const bodyText = (await page.textContent('body') || '').substring(0, 4000);
  console.log('=== DVLA After Yes ===');
  console.log(bodyText);
  await browser.close();
})().catch(e => console.error(e.message));
