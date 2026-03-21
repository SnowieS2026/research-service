#!/usr/bin/env node
const { MetadataBrowser } = require('./dist/src/browser/MetadataBrowser.js');
const { Logger } = require('./dist/src/Logger.js');

const log = new Logger('so-api');
const url = 'https://bugbounty.standoff365.com/en-US/programs/pt_ngfw';

(async () => {
  const browser = new MetadataBrowser();
  await browser.init();
  const page = await browser.newPage();

  // Intercept all responses to find the scope API
  const scopeResponses = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('scope') || url.includes('target') || url.includes('asset') || url.includes('program')) {
      scopeResponses.push({ url, status: response.status() });
      try {
        const body = await response.text();
        if (body.length < 5000 && (body.includes('"url"') || body.includes('"targets"') || body.includes('"assets"'))) {
          process.stdout.write('API: ' + url + '\n' + body.substring(0, 500) + '\n---\n');
        }
      } catch {}
    }
  });

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForTimeout(5000);

  process.stdout.write('\nAll scope-related responses:\n');
  for (const r of scopeResponses) {
    process.stdout.write('  [' + r.status + '] ' + r.url + '\n');
  }

  await browser.close();
  process.exit(0);
})().catch(e => { process.stderr.write(e.message + '\n'); process.exit(1); });
