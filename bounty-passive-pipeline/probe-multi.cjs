#!/usr/bin/env node
const { MetadataBrowser } = require('./dist/src/browser/MetadataBrowser.js');
const { HackeroneParser, IntigritiParser } = require('./dist/src/browser/parsers/index.js');
const { Logger } = require('./dist/src/Logger.js');
const log = new Logger('multi-probe');
const browser = new MetadataBrowser();

const PROGRAMS = [
  { platform: 'hackerone', url: 'https://hackerone.com/shopify' },
  { platform: 'hackerone', url: 'https://hackerone.com/gitlab' },
  { platform: 'hackerone', url: 'https://hackerone.com/tiktok' },
  { platform: 'hackerone', url: 'https://hackerone.com/steam' },
  { platform: 'hackerone', url: 'https://hackerone.com/starbucks' },
  { platform: 'intigriti', url: 'https://www.intigriti.com/programs/uber/uber' },
  { platform: 'intigriti', url: 'https://www.intigriti.com/programs/stripe/stripe' },
  { platform: 'intigriti', url: 'https://www.intigriti.com/programs/wordpress/wordpress' },
];

function webTargets(assets) {
  return assets.filter(a => {
    if (!a.startsWith('http')) return false;
    if (a.includes('apps.apple.com') || a.includes('play.google.com')) return false;
    if (a.includes('docs.') || a.includes('documentation')) return false;
    if (a.includes('github.com') && !a.includes('api.')) return false;
    return true;
  });
}

(async () => {
  await browser.init();
  for (const p of PROGRAMS) {
    try {
      const Parser = p.platform === 'hackerone' ? HackeroneParser : IntigritiParser;
      const page = await browser.navigate(p.url, { waitUntil: 'networkidle2', timeout: 20000 });
      await page.waitForTimeout(3000);
      const result = await new Parser(log).parse(page, p.url);
      const wts = webTargets(result.scope_assets);
      process.stdout.write('[' + p.platform + '] ' + result.program_name + ' | ' + result.scope_assets.length + ' total, ' + wts.length + ' web\n');
      if (wts.length > 0) { for (const t of wts.slice(0, 5)) process.stdout.write('  -> ' + t + '\n'); }
      process.stdout.write('  Rewards: ' + result.reward_range + '\n\n');
    } catch(e) {
      process.stdout.write('[ERR] ' + p.url + ': ' + e.message.substring(0, 100) + '\n');
    }
  }
  await browser.close();
  process.exit(0);
})().catch(e => { process.stderr.write(e.message + '\n'); process.exit(1); });
