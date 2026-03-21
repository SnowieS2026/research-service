#!/usr/bin/env node
/** Nuclei scan across all known targets */
const { runNuclei } = require('./dist/src/scanner/NucleiScanner.js');
const { scanSubfinder } = require('./dist/src/scanner/SubfinderScanner.js');
const { scanGau } = require('./dist/src/scanner/GauScanner.js');
const { scanForSSRF } = require('./dist/src/scanner/SSRFScanner.js');
const fs = require('fs');

const ENDPOINTS = JSON.parse(fs.readFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/endpoints.json', 'utf8'));
const OUT = 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/all-findings.json';

const config = { dryRun: false, outputDir: 'reports', rateLimitMs: 500, timeoutPerTarget: 60000 };
const stack = { url: '', technologies: [] };
const allFindings = [];

async function run() {
  const targets = ENDPOINTS.targets.slice(0, 30);
  const domains = [...new Set(targets.map(t => { try { return new URL(t).hostname.replace('www.', ''); } catch { return null; } }).filter(Boolean))];

  process.stdout.write('=== NUCLEI (30 targets) ===\n');
  const nucleiResults = await runNuclei(targets, ['jarmi', 'workflow', 'technologies'], config);
  process.stdout.write('Nuclei: ' + nucleiResults.length + ' findings\n');
  for (const f of nucleiResults.slice(0, 20)) {
    process.stdout.write('  [' + f.severity + '] ' + (f.url || f.host) + ' | ' + (f.description || '').substring(0, 80) + '\n');
  }
  allFindings.push(...nucleiResults.map(f => ({ tool: 'nuclei', ...f })));

  process.stdout.write('\n=== SUBFINDER (10 domains) ===\n');
  const sf = await scanSubfinder(domains.slice(0, 10), stack, config);
  process.stdout.write('Subfinder: ' + sf.length + ' subdomains\n');
  for (const f of sf.slice(0, 10)) {
    process.stdout.write('  ' + (f.url || f.host) + ' | ' + (f.description || '').substring(0, 80) + '\n');
  }
  allFindings.push(...sf.map(f => ({ tool: 'subfinder', ...f })));

  process.stdout.write('\n=== GAU (5 domains) ===\n');
  const gau = await scanGau(domains.slice(0, 5), stack, config);
  process.stdout.write('Gau: ' + gau.length + ' URLs\n');
  for (const f of gau.slice(0, 10)) {
    process.stdout.write('  ' + (f.url || f.description || JSON.stringify(f).substring(0, 80)) + '\n');
  }
  allFindings.push(...gau.map(f => ({ tool: 'gau', ...f })));

  // High-value targets only (web apps, portals)
  const portalTargets = ENDPOINTS.targets.filter(t =>
    t.includes('member.') || t.includes('portal') || t.includes('accounts.') ||
    t.includes('admin') || t.includes('dashboard') || t.includes('app.')
  );
  process.stdout.write('\n=== SSRF on portals (' + portalTargets.length + ' portals) ===\n');
  const portalEndpoints = ENDPOINTS.paramEndpoints.filter(e => portalTargets.some(t => e.url.startsWith(t)));
  if (portalEndpoints.length > 0) {
    const ssrf = await scanForSSRF(portalEndpoints, stack, config);
    process.stdout.write('SSRF: ' + ssrf.length + '\n');
    for (const f of ssrf.slice(0, 10)) {
      process.stdout.write('  [' + f.severity + '] ' + f.url + ' | ' + (f.description || '').substring(0, 80) + '\n');
    }
    allFindings.push(...ssrf.map(f => ({ tool: 'ssrf', ...f })));
  }

  // Summary
  const summary = {};
  for (const f of allFindings) summary[f.tool] = (summary[f.tool] || 0) + 1;
  process.stdout.write('\n=== TOTAL: ' + allFindings.length + ' findings ===\n');
  process.stdout.write(JSON.stringify(summary) + '\n');

  fs.writeFileSync(OUT, JSON.stringify(allFindings, null, 2));
  process.stdout.write('Saved to ' + OUT + '\n');
  process.exit(0);
}

run().catch(e => { process.stderr.write('[ERR] ' + e.message + '\n'); process.exit(1); });
