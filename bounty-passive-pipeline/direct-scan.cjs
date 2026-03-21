#!/usr/bin/env node
/** Direct targeted scan on known-good programs */
const { MetadataBrowser } = require('./dist/src/browser/MetadataBrowser.js');
const { BugcrowdParser } = require('./dist/src/browser/parsers/BugcrowdParser.js');
const { Logger } = require('./dist/src/Logger.js');
const path = require('path');
const fs = require('fs');

const PIPELINE_ROOT = process.cwd();
const log = new Logger('direct-scan');
const OUT = path.join(PIPELINE_ROOT, 'logs', 'direct-scan-findings.json');

const PROGRAMS = [
  'https://bugcrowd.com/engagements/internetbrands-public',
  'https://bugcrowd.com/engagements/okta',
  'https://bugcrowd.com/engagements/zendesk',
  'https://bugcrowd.com/engagements/chime',
  'https://bugcrowd.com/engagements/verisign',
  'https://bugcrowd.com/engagements/ynab',
  'https://bugcrowd.com/engagements/fireblocks-mbb-og',
  'https://bugcrowd.com/engagements/underarmour-corp',
];

async function main() {
  const browser = new MetadataBrowser();
  await browser.init();

  const scanTargets = new Set();
  const programNames = {};

  for (const url of PROGRAMS) {
    try {
      const page = await browser.navigate(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const parser = new BugcrowdParser(log);
      const result = await parser.parse(page, url);
      const name = result.program_name || url;
      programNames[url] = name;
      process.stdout.write('[' + name + '] ' + result.scope_assets.length + ' assets\n');
      for (const asset of result.scope_assets) {
        if (asset.startsWith('http') && !asset.match(/\/(login|sign_in|auth|password|register|sign_up)/)) {
          scanTargets.add(asset);
        }
      }
    } catch(e) {
      process.stdout.write('[ERR] ' + url + ': ' + e.message + '\n');
    }
  }
  await browser.close();

  const targets = [...scanTargets];
  process.stdout.write('\n=== ' + targets.length + ' scan targets ===\n');
  for (const t of targets.slice(0, 10)) process.stdout.write('  ' + t + '\n');
  if (targets.length > 10) process.stdout.write('  ... (' + (targets.length - 10) + ' more)\n');

  // Save targets
  const targetData = { programs: programNames, targets, scannedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(PIPELINE_ROOT, 'logs', 'direct-scan-targets.json'), JSON.stringify(targetData, null, 2));
  process.stdout.write('\nTargets saved. Run complete.\n');
  process.exit(0);
}

main().catch(e => { process.stderr.write('[FATAL] ' + e.message + '\n'); process.exit(1); });
