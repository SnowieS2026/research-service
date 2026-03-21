#!/usr/bin/env node
const { MetadataBrowser } = require('./dist/src/browser/MetadataBrowser.js');
const { Standoff365Parser } = require('./dist/src/browser/parsers/Standoff365Parser.js');
const { Logger } = require('./dist/src/Logger.js');
const log = new Logger('so-test');
const browser = new MetadataBrowser();

(async () => {
  await browser.init();
  const url = 'https://bugbounty.standoff365.com/en-US/programs/k2cloud';
  const page = await browser.navigate(url, { waitUntil: 'networkidle2', timeout: 30000 });
  const result = await new Standoff365Parser(log).parse(page, url);
  process.stdout.write('Program: ' + result.program_name + '\n');
  process.stdout.write('Scope assets (' + result.scope_assets.length + '):\n');
  for (const a of result.scope_assets) process.stdout.write('  ' + a + '\n');
  await browser.close();
  process.exit(0);
})().catch(e => { process.stderr.write(e.message + '\n'); process.exit(1); });
