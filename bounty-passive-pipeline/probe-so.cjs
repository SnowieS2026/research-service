#!/usr/bin/env node
const { MetadataBrowser } = require('./dist/src/browser/MetadataBrowser.js');
const url = 'https://bugbounty.standoff365.com/en-US/programs/pt_ngfw';
(async () => {
  const browser = new MetadataBrowser();
  await browser.init();
  const page = await browser.navigate(url, { waitUntil: 'networkidle2', timeout: 45000 });
  await page.waitForTimeout(5000);
  const html = await page.content();
  // Find scopes
  const scopesIdx = html.indexOf('"scopes":');
  if (scopesIdx >= 0) {
    process.stdout.write('scopes: ' + html.substring(scopesIdx, scopesIdx + 500) + '\n');
  }
  // Find any in-scope text
  const inScopeIdx = html.indexOf('in-scope');
  if (inScopeIdx >= 0) process.stdout.write('in-scope: ' + html.substring(inScopeIdx, inScopeIdx + 300) + '\n');
  const targetsIdx = html.indexOf('"targets":');
  if (targetsIdx >= 0) process.stdout.write('targets: ' + html.substring(targetsIdx, targetsIdx + 300) + '\n');
  await browser.close();
  process.exit(0);
})().catch(e => { process.stderr.write(e.message + '\n'); process.exit(1); });
