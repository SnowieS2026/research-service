const { DiscoveryScanner } = require('./dist/src/scanner/DiscoveryScanner.js');
const { scanForXSS } = require('./dist/src/scanner/XSSScanner.js');
const { scanForSQLi } = require('./dist/src/scanner/SQLScanner.js');
const { scanForSSRF } = require('./dist/src/scanner/SSRFScanner.js');
const { scanForAuthIssues } = require('./dist/src/scanner/AuthScanner.js');
const { runNuclei } = require('./dist/src/scanner/NucleiScanner.js');
const fs = require('fs');
const path = require('path');

const OUT_FILE = 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/scan-findings.json';

async function main() {
  const allFindings = [];

  // 1. Discovery
  process.stdout.write('[1] Discovery...\n');
  const scanner = new DiscoveryScanner();
  const targets = [
    'https://www.carsdirect.com/',
    'https://pets.webmd.com/',
    'https://member.webmd.com/',
    'https://www.mdedge.com/',
    'https://accounts.webmd.com/',
    'https://powerpak.com/'
  ];
  const results = await scanner.scan(targets, 'reports');
  const allEndpoints = results.flatMap(r => r.endpoints);
  const paramEndpoints = allEndpoints.filter(e => e.params.length > 0);

  // Dedupe endpoints
  const seenUrls = new Set();
  const uniqueEndpoints = [];
  for (const e of allEndpoints) {
    if (!seenUrls.has(e.url)) {
      seenUrls.add(e.url);
      uniqueEndpoints.push(e);
    }
  }

  process.stdout.write('[1] ' + allEndpoints.length + ' endpoints, ' + paramEndpoints.length + ' with params\n');
  const stack = results[0] && results[0].stackInfo ? results[0].stackInfo : { url: '', technologies: [] };
  const config = { dryRun: false, outputDir: 'reports', rateLimitMs: 1000, timeoutPerTarget: 300000 };

  // 2. XSS - skip dalfox (known to hang on some targets)
  process.stdout.write('[2] XSS: SKIPPED (dalfox unstable on this target)\n');

  // 3. SQLi
  process.stdout.write('[3] SQLi...\n');
  try {
    const f = await scanForSQLi(paramEndpoints, stack, config);
    process.stdout.write('[3] SQLi: ' + f.length + ' findings\n');
    for (const ff of f) allFindings.push({ tool: 'sql', ...ff });
  } catch(e) { process.stdout.write('[3] SQLi error: ' + e.message + '\n'); }

  // 4. SSRF
  process.stdout.write('[4] SSRF...\n');
  try {
    const f = await scanForSSRF(paramEndpoints, stack, config);
    process.stdout.write('[4] SSRF: ' + f.length + ' findings\n');
    for (const ff of f) allFindings.push({ tool: 'ssrf', ...ff });
  } catch(e) { process.stdout.write('[4] SSRF error: ' + e.message + '\n'); }

  // 5. Auth
  process.stdout.write('[5] Auth...\n');
  try {
    const loginForms = uniqueEndpoints.filter(e => e.formFields.some(f => f.type === 'password'));
    const authTargets = [...paramEndpoints, ...loginForms];
    const f = await scanForAuthIssues(authTargets, stack, config);
    process.stdout.write('[5] Auth: ' + f.length + ' findings\n');
    for (const ff of f) allFindings.push({ tool: 'auth', ...ff });
  } catch(e) { process.stdout.write('[5] Auth error: ' + e.message + '\n'); }

  // 6. Nuclei
  process.stdout.write('[6] Nuclei...\n');
  try {
    const techs = results.map(r => r.stackInfo && r.stackInfo.technologies ? r.stackInfo.technologies.map(t => t.name) : []).flat();
    const f = await runNuclei(targets, techs, config);
    process.stdout.write('[6] Nuclei: ' + f.length + ' findings\n');
    for (const ff of f) allFindings.push({ tool: 'nuclei', ...ff });
  } catch(e) { process.stdout.write('[6] Nuclei error: ' + e.message + '\n'); }

  await scanner.close();

  // Save
  fs.writeFileSync(OUT_FILE, JSON.stringify(allFindings, null, 2));

  // Print findings
  process.stdout.write('\n=== RESULTS: ' + allFindings.length + ' total findings ===\n');
  const summary = { xss: 0, sql: 0, ssrf: 0, auth: 0, nuclei: 0, api: 0 };
  for (const ff of allFindings) {
    const t = ff.tool;
    if (t === 'xss') summary.xss++;
    else if (t === 'sql') summary.sql++;
    else if (t === 'ssrf') summary.ssr++;
    else if (t === 'auth') summary.auth++;
    else if (t === 'nuclei') summary.nuclei++;
    else if (t === 'api') summary.api++;
    process.stdout.write('[' + (t || '?').toUpperCase() + '] ' + (ff.severity || '?') + ' | ' + (ff.url || '?') + ' | ' + (ff.description || '').substring(0, 100) + '\n');
  }
  process.stdout.write('\nSummary: ' + JSON.stringify(summary) + '\n');
  process.stdout.write('Saved to: ' + OUT_FILE + '\n');
}

main().catch(e => { process.stderr.write('[FATAL] ' + e.message + '\n'); process.exit(1); });
