#!/usr/bin/env node
const { MetadataBrowser } = require('./dist/src/browser/MetadataBrowser.js');
const { Logger } = require('./dist/src/Logger.js');
const log = new Logger('dbg');
const browser = new MetadataBrowser();

(async () => {
  await browser.init();
  const url = 'https://bugcrowd.com/engagements/internetbrands-public';
  const page = await browser.navigate(url, { waitUntil: 'networkidle2', timeout: 20000 });
  await page.waitForTimeout(3000);

  // Get raw HTML sample
  const html = await page.content();
  process.stdout.write('HTML length: ' + html.length + '\n');

  // Check for key elements
  process.stdout.write('Has crowdstream: ' + html.includes('crowdstream') + '\n');
  process.stdout.write('Has engagement: ' + html.includes('engagement') + '\n');
  process.stdout.write('Has scope: ' + html.includes('scope') + '\n');

  // Check what BugcrowdParser looks for
  const selectors = [
    'table', '.target-table', '[data-testid="scope"]', '.scope-table',
    'table tbody tr', '.card-container'
  ];
  for (const sel of selectors) {
    const count = await page.locator(sel).count();
    if (count > 0) process.stdout.write(`Selector "${sel}": ${count} elements\n`);
  }

  // Get text sample
  const bodyText = await page.locator('body').textContent();
  process.stdout.write('Body text sample (500ch): ' + bodyText.substring(0, 500) + '\n');

  await browser.close();
  process.exit(0);
})().catch(e => { process.stderr.write(e.message + '\n'); process.exit(1); });
