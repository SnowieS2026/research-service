#!/usr/bin/env node
const { MetadataBrowser } = require('./dist/src/browser/MetadataBrowser.js');
const { BugcrowdParser } = require('./dist/src/browser/parsers/BugcrowdParser.js');
const { Logger } = require('./dist/src/Logger.js');
const log = new Logger('probe');
const browser = new MetadataBrowser();

(async () => {
  await browser.init();

  // Probe known-good Bugcrowd programs directly
  const programs = [
    'https://bugcrowd.com/engagements/internetbrands-public',
    'https://bugcrowd.com/engagements/okta',
    'https://bugcrowd.com/engagements/zendesk',
    'https://bugcrowd.com/engagements/verisign',
    'https://bugcrowd.com/engagements/chime',
    'https://bugcrowd.com/engagements/ynab',
  ];

  for (const url of programs) {
    try {
      const page = await browser.navigate(url, { waitUntil: 'networkidle2', timeout: 20000 });
      await page.waitForTimeout(1500);
      const parser = new BugcrowdParser(log);
      const result = await parser.parse(page, url);
      const webTargets = result.scope_assets.filter(a => {
        if (!a.startsWith('http')) return false;
        if (a.includes('apps.apple.com') || a.includes('play.google.com')) return false;
        if (a.includes('docs.') || a.includes('documentation')) return false;
        return true;
      });
      process.stdout.write(`\n[${result.program_name}]\n`);
      process.stdout.write(`  Total: ${result.scope_assets.length}, Web: ${webTargets.length}\n`);
      process.stdout.write(`  Rewards: ${result.reward_range}\n`);
      for (const t of webTargets.slice(0, 5)) process.stdout.write(`  → ${t}\n`);
    } catch(e) {
      process.stdout.write(`[ERR] ${url}: ${e.message.substring(0, 80)}\n`);
    }
  }

  await browser.close();
  process.exit(0);
})().catch(e => { process.stderr.write(e.message + '\n'); process.exit(1); });
