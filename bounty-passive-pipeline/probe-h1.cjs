#!/usr/bin/env node
const { MetadataBrowser } = require('./dist/src/browser/MetadataBrowser.js');
const { HackeroneParser } = require('./dist/src/browser/parsers/HackeroneParser.js');
const { Logger } = require('./dist/src/Logger.js');
const log = new Logger('h1-test');
const browser = new MetadataBrowser();

// Try GitLab directly - well-known public program
const PROGRAM_URLS = [
  'https://hackerone.com/gitlab',
  'https://hackerone.com/shopify',
  'https://hackerone.com/tiktok',
];

(async () => {
  await browser.init();
  for (const url of PROGRAM_URLS) {
    try {
      const page = await browser.navigate(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(3000);
      const parser = new HackeroneParser(log);
      const result = await parser.parse(page, url);
      process.stdout.write('[' + result.program_name + '] ' + result.scope_assets.length + ' assets\n');
      for (const a of result.scope_assets.slice(0, 5)) process.stdout.write('  ' + a + '\n');
      if (result.scope_assets.length > 5) process.stdout.write('  ... (' + (result.scope_assets.length - 5) + ' more)\n');
    } catch(e) {
      process.stdout.write('[ERR] ' + url + ': ' + e.message.substring(0, 100) + '\n');
    }
  }
  await browser.close();
  process.exit(0);
})().catch(e => { process.stderr.write(e.message + '\n'); process.exit(1); });
