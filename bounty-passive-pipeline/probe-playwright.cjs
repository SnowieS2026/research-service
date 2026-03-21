#!/usr/bin/env node
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const apiCalls = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('api') || url.includes('graphql') || url.includes('/v1/')) {
      apiCalls.push(req.method() + ' ' + url);
    }
  });
  page.on('response', async res => {
    const url = res.url();
    if (url.includes('api') || url.includes('graphql')) {
      try {
        const body = await res.text();
        if (body.includes('scope') || body.includes('target') || body.includes('in_scope')) {
          process.stdout.write('SCOPE-API [' + res.status() + ']: ' + url + '\n  ' + body.substring(0, 600) + '\n---\n');
        }
      } catch {}
    }
  });

  await page.goto('https://bugbounty.standoff365.com/en-US/programs/pt_ngfw', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  process.stdout.write('\nAll API calls made:\n');
  for (const c of apiCalls.slice(0, 30)) process.stdout.write('  ' + c + '\n');

  await browser.close();
  process.exit(0);
})().catch(e => { process.stderr.write(e.message + '\n'); process.exit(1); });
