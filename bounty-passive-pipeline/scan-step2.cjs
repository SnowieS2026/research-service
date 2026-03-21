#!/usr/bin/env node
const { scanForSSRF } = require('./dist/src/scanner/SSRFScanner.js');
const { scanForAuthIssues } = require('./dist/src/scanner/AuthScanner.js');
const { runNuclei } = require('./dist/src/scanner/NucleiScanner.js');
const { scanSubfinder } = require('./dist/src/scanner/SubfinderScanner.js');
const { scanGau } = require('./dist/src/scanner/GauScanner.js');
const fs = require('fs');

const ENDPOINTS = JSON.parse(fs.readFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/endpoints.json', 'utf8'));
const OUT_DIR = 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs';

const allFindings = [];
const config = { dryRun: false, outputDir: 'reports', rateLimitMs: 1000, timeoutPerTarget: 60000 };
const stack = { url: '', technologies: [] };

async function run(name, fn) {
  process.stdout.write('[' + name + '] starting...\n');
  try {
    const f = await fn();
    process.stdout.write('[' + name + '] ' + f.length + ' findings\n');
    for (const ff of f.slice(0, 20)) process.stdout.write('  ' + (ff.url || ff.host || '?') + ' | ' + (ff.description || '').substring(0, 80) + '\n');
    if (f.length > 20) process.stdout.write('  ... (' + (f.length - 20) + ' more)\n');
    allFindings.push(...f.map(x => ({ tool: name.toLowerCase(), ...x })));
  } catch(e) {
    process.stdout.write('[' + name + '] ERROR: ' + e.message + '\n');
  }
}

async function main() {
  // SSRF
  await run('SSRF', async () => {
    return await scanForSSRF(ENDPOINTS.paramEndpoints, stack, config);
  });

  // Auth
  await run('Auth', async () => {
    const loginForms = ENDPOINTS.paramEndpoints.filter(e => e.formFields && e.formFields.some(f => f.type === 'password'));
    return await scanForAuthIssues([...ENDPOINTS.paramEndpoints, ...loginForms], stack, config);
  });

  // Nuclei
  await run('Nuclei', async () => {
    return await runNuclei(ENDPOINTS.targets.slice(0, 15), ['Generic'], config);
  });

  // Subfinder
  await run('Subfinder', async () => {
    const domains = [...new Set(ENDPOINTS.targets.map(t => { try { return new URL(t).hostname.replace('www.', ''); } catch { return null; } }).filter(Boolean))];
    return await scanSubfinder(domains.slice(0, 5), stack, config);
  });

  // Gau
  await run('Gau', async () => {
    const domains = [...new Set(ENDPOINTS.targets.map(t => { try { return new URL(t).hostname.replace('www.', ''); } catch { return null; } }).filter(Boolean))];
    return await scanGau(domains.slice(0, 5), stack, config);
  });

  fs.writeFileSync(OUT_DIR + '/findings-all.json', JSON.stringify(allFindings, null, 2));
  const summary = {};
  for (const f of allFindings) summary[f.tool] = (summary[f.tool] || 0) + 1;
  process.stdout.write('\n=== TOTAL: ' + allFindings.length + ' findings ===\n');
  process.stdout.write(JSON.stringify(summary) + '\n');
}

main().catch(e => { process.stderr.write('[FATAL] ' + e.message + '\n'); process.exit(1); });
