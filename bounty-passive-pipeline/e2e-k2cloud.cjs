#!/usr/bin/env node
/** End-to-end scan on k2cloud from Standoff365 */
const { MetadataBrowser } = require('./dist/src/browser/MetadataBrowser.js');
const { Standoff365Parser } = require('./dist/src/browser/parsers/Standoff365Parser.js');
const { DiscoveryScanner } = require('./dist/src/scanner/DiscoveryScanner.js');
const { scanForSSRF } = require('./dist/src/scanner/SSRFScanner.js');
const { scanForAuthIssues } = require('./dist/src/scanner/AuthScanner.js');
const { runNuclei } = require('./dist/src/scanner/NucleiScanner.js');
const { scanSubfinder } = require('./dist/src/scanner/SubfinderScanner.js');
const { scanGau } = require('./dist/src/scanner/GauScanner.js');
const { Logger } = require('./dist/src/Logger.js');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const log = new Logger('e2e-k2cloud');

const PROGRAM_URL = 'https://bugbounty.standoff365.com/en-US/programs/k2cloud';
const OUT = path.join(ROOT, 'logs', 'k2cloud-findings.json');

async function main() {
  log.log('=== Starting k2cloud end-to-end scan ===');

  // Step 1: Parse program and get scope
  log.log('[1/5] Fetching program scope...');
  const browser = new MetadataBrowser();
  await browser.init();
  const page = await browser.navigate(PROGRAM_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  const parser = new Standoff365Parser(log);
  const program = await parser.parse(page, PROGRAM_URL);
  await browser.close();

  log.log(`Program: ${program.program_name}`);
  log.log(`Scope assets: ${program.scope_assets.length}`);
  const targets = program.scope_assets.filter(a => a.startsWith('http'));
  log.log(`HTTP targets: ${targets.length}`);

  if (targets.length === 0) {
    process.stderr.write('No HTTP targets found — check scope extraction\n');
    process.exit(1);
  }

  // Step 2: Discovery — crawl all scope domains
  log.log('[2/5] Running discovery on ' + targets.length + ' targets...');
  const disc = new DiscoveryScanner();
  const discResults = await disc.scan(targets.slice(0, 20), path.join(ROOT, 'reports'));
  await disc.close();

  const allEndpoints = discResults.flatMap(r => r.endpoints);
  const seen = new Set();
  const unique = [];
  for (const e of allEndpoints) { if (!seen.has(e.url)) { seen.add(e.url); unique.push(e); } }
  const paramEndpoints = unique.filter(e => e.params.length > 0);
  log.log(`Discovery: ${unique.length} endpoints, ${paramEndpoints.length} with params`);

  // Step 3: Run scanners
  const findings = [];
  const config = { dryRun: false, outputDir: 'reports', rateLimitMs: 1000, timeoutPerTarget: 60000 };
  const stack = { url: '', technologies: [] };

  // Subfinder
  log.log('[3/5] Running subfinder...');
  const domains = [...new Set(targets.map(t => { try { return new URL(t).hostname.replace('www.', ''); } catch { return null; } }).filter(Boolean))];
  const sfFindings = await scanSubfinder(domains, stack, config);
  log.log(`  subfinder: ${sfFindings.length} subdomains`);
  findings.push(...sfFindings.map(f => ({ tool: 'subfinder', ...f })));

  // Gau
  log.log('[4/5] Running gau...');
  const gauFindings = await scanGau(domains.slice(0, 5), stack, config);
  log.log(`  gau: ${gauFindings.length} URLs`);
  findings.push(...gauFindings.map(f => ({ tool: 'gau', ...f })));

  // SSRF
  if (paramEndpoints.length > 0) {
    log.log('[5/5] Running SSRF scan...');
    const ssrfFindings = await scanForSSRF(paramEndpoints, stack, config);
    log.log(`  SSRF: ${ssrfFindings.length} findings`);
    findings.push(...ssrfFindings.map(f => ({ tool: 'ssrf', ...f })));
  }

  // Nuclei
  log.log('[5/5] Running nuclei...');
  const nucleiFindings = await runNuclei(targets.slice(0, 15), ['generic'], config);
  log.log(`  nuclei: ${nucleiFindings.length} findings`);
  findings.push(...nucleiFindings.map(f => ({ tool: 'nuclei', ...f })));

  // Save results
  fs.writeFileSync(OUT, JSON.stringify({ program: program.program_name, program_url: PROGRAM_URL, targets, findings, scannedAt: new Date().toISOString() }, null, 2));

  const summary = {};
  for (const f of findings) summary[f.tool] = (summary[f.tool] || 0) + 1;
  log.log('\n=== SCAN COMPLETE ===');
  log.log(`Total findings: ${findings.length}`);
  log.log(JSON.stringify(summary));

  process.stdout.write('\nTop findings:\n');
  for (const f of findings.slice(0, 10)) {
    process.stdout.write(`  [${f.tool.toUpperCase()}] ${f.url || f.host || f.description || JSON.stringify(f).substring(0, 80)}\n`);
  }
  process.exit(0);
}

main().catch(e => { process.stderr.write('[FATAL] ' + e.message + '\n'); process.exit(1); });
