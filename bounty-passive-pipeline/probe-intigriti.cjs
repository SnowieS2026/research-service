#!/usr/bin/env node
const { MetadataBrowser } = require('./dist/src/browser/MetadataBrowser.js');
const { IntigritiParser } = require('./dist/src/browser/parsers/index.js');
const { Logger } = require('./dist/src/Logger.js');
const log = new Logger('intigriti-debug');
const browser = new MetadataBrowser();

(async () => {
  await browser.init();

  // Try different Intigriti URL formats
  const urls = [
    'https://www.intigriti.com/programs/uber/uber',
    'https://www.intigriti.com/programs/stripe/stripe',
    'https://www.intigriti.com/programs/port/swagger',
    'https://www.intigriti.com/programs/snyk/snyk',
  ];

  for (const url of urls) {
    try {
      const page = await browser.navigate(url, { waitUntil: 'networkidle2', timeout: 20000 });
      await page.waitForTimeout(4000);
      const html = await page.content();
      process.stdout.write('\n[' + url + '] HTML length: ' + html.length + '\n');
      // Check for key content
      process.stdout.write('  Has scope: ' + html.includes('scope') + '\n');
      process.stdout.write('  Has target: ' + html.includes('target') + '\n');
      // Try parsing
      const result = await new IntigritiParser(log).parse(page, url);
      process.stdout.write('  Name: ' + result.program_name + ', Assets: ' + result.scope_assets.length + '\n');
      if (result.scope_assets.length > 0) {
        for (const a of result.scope_assets.slice(0, 3)) process.stdout.write('    -> ' + a + '\n');
      }
    } catch(e) {
      process.stdout.write('[ERR] ' + url + ': ' + e.message.substring(0, 120) + '\n');
    }
  }

  await browser.close();
  process.exit(0);
})().catch(e => { process.stderr.write(e.message + '\n'); process.exit(1); });
