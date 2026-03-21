#!/usr/bin/env node
const { MetadataBrowser } = require('./dist/src/browser/MetadataBrowser.js');
const { Standoff365Parser } = require('./dist/src/browser/parsers/Standoff365Parser.js');
const { Logger } = require('./dist/src/Logger.js');
const log = new Logger('so-probe');

// Try standoff365.com program listing to find programs with assets
const URLS = [
  'https://bugbounty.standoff365.com/en-US/programs',
  'https://standoff365.com/en-US/programs',
];

(async () => {
  const browser = new MetadataBrowser();
  await browser.init();
  for (const url of URLS) {
    try {
      process.stdout.write('Trying: ' + url + '\n');
      const page = await browser.navigate(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(3000);
      const html = await page.content();
      // Look for program links
      const programLinks = html.match(/\/programs\/[a-zA-Z0-9_-]+/g);
      const unique = [...new Set(programLinks || [])];
      process.stdout.write('Found programs: ' + unique.slice(0, 10).join(', ') + '\n');
      if (unique.length > 0) {
        // Try the first few programs
        for (const prog of unique.slice(0, 5)) {
          const progUrl = 'https://bugbounty.standoff365.com/en-US' + prog;
          try {
            const p = await browser.navigate(progUrl, { waitUntil: 'networkidle2', timeout: 20000 });
            await p.waitForTimeout(2000);
            const parser = new Standoff365Parser(log);
            const result = await parser.parse(p, progUrl);
            process.stdout.write('  ' + prog + ' => ' + result.scope_assets.length + ' assets, name: ' + result.program_name + '\n');
          } catch(e) {
            process.stdout.write('  ' + prog + ' => ERR: ' + e.message.substring(0, 80) + '\n');
          }
        }
      }
    } catch(e) {
      process.stdout.write('ERR ' + url + ': ' + e.message.substring(0, 100) + '\n');
    }
  }
  await browser.close();
  process.exit(0);
})().catch(e => { process.stderr.write(e.message + '\n'); process.exit(1); });
