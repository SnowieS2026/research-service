#!/usr/bin/env node
/** Step 3: Nuclei scan */
const { runNuclei } = require('./dist/src/scanner/NucleiScanner.js');
const fs = require('fs');

const TARGETS_FILE = 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/scan-targets.json';
const OUT_FILE = 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/findings-nuclei.json';

async function main() {
  const targets = JSON.parse(fs.readFileSync(TARGETS_FILE, 'utf8'));
  process.stdout.write('[Nuclei] Running on ' + targets.length + ' targets...\n');

  const config = { dryRun: false, outputDir: 'reports', rateLimitMs: 1000, timeoutPerTarget: 120000 };
  const techs = ['Generic'];

  const findings = await runNuclei(targets, techs, config);
  process.stdout.write('[Nuclei] ' + findings.length + ' findings\n');

  fs.writeFileSync(OUT_FILE, JSON.stringify(findings, null, 2));
  for (const f of findings) {
    process.stdout.write('  [NUCLEI] ' + (f.severity || '?') + ' | ' + (f.url || f.host || '?') + ' | ' + (f.description || f.info || '').toString().substring(0, 100) + '\n');
  }
  process.exit(0);
}

main().catch(e => { process.stderr.write('[FATAL] ' + e.message + '\n'); process.exit(1); });
