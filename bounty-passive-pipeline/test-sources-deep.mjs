// Deeper test: try actual plate lookup URLs on accessible sites
const { chromium } = await import('@playwright/test');

const plate = 'KY05YTJ';
const results = [];

async function test(name, url, fn) {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await fn(page, url, plate);
    results.push({ name, ok: true });
  } catch (err) {
    results.push({ name, ok: false, error: String(err).substring(0, 200) });
  } finally {
    if (browser) await browser.close();
  }
}

async function parkersValuation(page, baseUrl, plate) {
  await page.goto('https://www.parkers.co.uk/car-valuation/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  const inputs = await page.locator('input').all();
  console.log(`Parkers inputs: ${inputs.length}`);
  for (const inp of inputs.slice(0, 5)) {
    const type = await inp.getAttribute('type');
    const name = await inp.getAttribute('name');
    const id = await inp.getAttribute('id');
    const placeholder = await inp.getAttribute('placeholder');
    console.log(`  input: type=${type}, name=${name}, id=${id}, placeholder=${placeholder}`);
  }
  const pageText = await page.locator('body').textContent();
  console.log(`Parkers page text snippet: ${pageText?.substring(0, 300)}`);
}

async function autoTraderValuation(page, baseUrl, plate) {
  // Try the valuation URL with reg parameter
  const url = `https://www.autotrader.co.uk/cars/valuation?registration=${plate}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);
  const pageText = await page.locator('body').textContent();
  console.log(`AutoTrader valuation text snippet: ${pageText?.substring(0, 500)}`);
}

async function freeCarCheck(page, baseUrl, plate) {
  await page.goto('https://www.freecarcheck.co.uk/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  const inputs = await page.locator('input').all();
  console.log(`FreeCarCheck inputs: ${inputs.length}`);
  for (const inp of inputs.slice(0, 5)) {
    const type = await inp.getAttribute('type');
    const name = await inp.getAttribute('name');
    const id = await inp.getAttribute('id');
    const placeholder = await inp.getAttribute('placeholder');
    console.log(`  input: type=${type}, name=${name}, id=${id}, placeholder=${placeholder}`);
  }
  const pageText = await page.locator('body').textContent();
  console.log(`FreeCarCheck text snippet: ${pageText?.substring(0, 300)}`);
}

async function motorsSearch(page, baseUrl, plate) {
  // Try search URL with reg
  const url = `https://www.motors.co.uk/cars/?q=${plate}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);
  const pageText = await page.locator('body').textContent();
  console.log(`Motors search text snippet: ${pageText?.substring(0, 400)}`);
}

async function parkersSpecs(page, baseUrl, plate) {
  // Try Parkers spec lookup by reg - they may have a search endpoint
  await page.goto('https://www.parkers.co.uk/car-specs/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  const inputs = await page.locator('input').all();
  console.log(`Parkers specs inputs: ${inputs.length}`);
  for (const inp of inputs.slice(0, 5)) {
    const type = await inp.getAttribute('type');
    const name = await inp.getAttribute('name');
    const id = await inp.getAttribute('id');
    const placeholder = await inp.getAttribute('placeholder');
    console.log(`  input: type=${type}, name=${name}, id=${id}, placeholder=${placeholder}`);
  }
  const pageText = await page.locator('body').textContent();
  console.log(`Parkers specs text snippet: ${pageText?.substring(0, 300)}`);
}

await test('Parkers-Valuation', 'https://www.parkers.co.uk/car-valuation/', parkersValuation);
await test('AutoTrader-Valuation', `https://www.autotrader.co.uk/cars/valuation?registration=${plate}`, autoTraderValuation);
await test('FreeCarCheck', 'https://www.freecarcheck.co.uk/', freeCarCheck);
await test('Motors-Search', `https://www.motors.co.uk/cars/?q=${plate}`, motorsSearch);
await test('Parkers-Specs', 'https://www.parkers.co.uk/car-specs/', parkersSpecs);

console.log('\n=== Summary ===');
for (const r of results) {
  console.log(`${r.ok ? '✅' : '❌'} ${r.name}${r.error ? ': ' + r.error : ''}`);
}
