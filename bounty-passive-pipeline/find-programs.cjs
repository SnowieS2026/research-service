#!/usr/bin/env node
/** Find programs with large, accessible web attack surfaces */
const { MetadataBrowser } = require('./dist/src/browser/MetadataBrowser.js');
const { BugcrowdParser } = require('./dist/src/browser/parsers/BugcrowdParser.js');
const { Logger } = require('./dist/src/Logger.js');
const log = new Logger('finder');

const PROGRAMS_URL = 'https://bugcrowd.com/engagements';

async function probeProgram(browser, url) {
  try {
    const page = await browser.navigate(url, { waitUntil: 'networkidle2', timeout: 20000 });
    await page.waitForTimeout(2000);
    const parser = new BugcrowdParser(log);
    const result = await parser.parse(page, url);
    // Filter to only http/https web targets (no mobile apps, docs, static)
    const webTargets = result.scope_assets.filter(a => {
      if (!a.startsWith('http')) return false;
      // Skip app stores, documentation sites, static content
      if (a.includes('apps.apple.com') || a.includes('play.google.com')) return false;
      if (a.includes('docs.') || a.includes('documentation')) return false;
      if (a.includes('github.com') && !a.includes('api.')) return false;
      return true;
    });
    return {
      name: result.program_name,
      url,
      totalAssets: result.scope_assets.length,
      webTargets: webTargets.length,
      webTargetSample: webTargets.slice(0, 3),
      rewards: result.reward_range
    };
  } catch(e) {
    return null;
  }
}

async function main() {
  const browser = new MetadataBrowser();
  await browser.init();

  // Get engagement list
  log.log('Fetching Bugcrowd engagement list...');
  const page = await browser.navigate(PROGRAMS_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  const html = await page.content();

  // Extract all engagement links
  const links = html.match(/\/engagements\/[a-z0-9_-]+/gi) || [];
  const uniqueLinks = [...new Set(links.map(l => 'https://bugcrowd.com' + l))];
  log.log(`Found ${uniqueLinks.length} engagement URLs`);

  // Sort: prioritize ones likely to have web targets
  const priorityKeywords = ['web', 'site', 'app', 'portal', 'platform', 'api', 'dashboard', 'site'];
  const scored = uniqueLinks.map(url => {
    const slug = url.toLowerCase();
    let score = 0;
    for (const kw of priorityKeywords) if (slug.includes(kw)) score++;
    // Penalize featured, staff-picks, sign_in
    if (slug.includes('featured') || slug.includes('staff') || slug.includes('sign_in') || slug.includes('login')) score -= 10;
    return { url, score };
  });
  scored.sort((a, b) => b.score - a.score);

  // Probe top candidates in batches
  const candidates = scored.slice(0, 40);
  log.log('Probing top ' + candidates.length + ' candidates...');

  const results = [];
  for (let i = 0; i < candidates.length; i += 3) {
    const batch = candidates.slice(i, i + 3);
    const probed = await Promise.all(batch.map(c => probeProgram(browser, c.url)));
    for (const r of probed) {
      if (r && r.webTargets >= 2) results.push(r);
    }
    process.stdout.write(`[${i + batch.length}/${candidates.length}] Checked ${candidates.length} candidates, found ${results.length} with web targets\n`);
  }

  await browser.close();

  // Sort by web target count
  results.sort((a, b) => b.webTargets - a.webTargets);

  process.stdout.write('\n=== PROGRAMS WITH BEST WEB ATTACK SURFACE ===\n\n');
  for (const r of results.slice(0, 20)) {
    process.stdout.write(`[${r.webTargets} web targets] ${r.name}\n`);
    process.stdout.write(`  ${r.url}\n`);
    process.stdout.write(`  Rewards: ${r.rewards}\n`);
    for (const t of r.webTargetSample) process.stdout.write(`  → ${t}\n`);
    process.stdout.write('\n');
  }

  // Save full list
  const fs = require('fs');
  fs.writeFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/program-survey.json', JSON.stringify(results, null, 2));
  process.exit(0);
}

main().catch(e => { process.stderr.write('[FATAL] ' + e.message + '\n'); process.exit(1); });
