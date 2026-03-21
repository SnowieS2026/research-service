#!/usr/bin/env node
const { MetadataBrowser } = require('./dist/src/browser/MetadataBrowser.js');
const browser = new MetadataBrowser();

(async () => {
  await browser.init();
  const page = await browser.newPage();

  const apiCalls = [];
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('api') || url.includes('graphql') || url.includes('/v1/') || url.includes('/v2/')) {
      try {
        const body = await res.text();
        if (body.length < 5000 && (body.includes('scope') || body.includes('target') || body.includes('in_scope'))) {
          process.stdout.write('API: ' + url + '\n' + body.substring(0, 600) + '\n---\n');
        }
      } catch {}
    }
  });

  await page.goto('https://www.intigriti.com/programs/uber/uber', { waitUntil: 'networkidle', timeout: 25000 });
  await page.waitForTimeout(5000);

  await browser.close();
  process.exit(0);
})().catch(e => { process.stderr.write(e.message + '\n'); process.exit(1); });
