#!/usr/bin/env node
/** Step 2: SSRF scan */
const { scanForSSRF } = require('./dist/src/scanner/SSRFScanner.js');
const fs = require('fs');

const ENDPOINTS_FILE = 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/endpoints.json';
const OUT_FILE = 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/findings-ssrf.json';

async function main() {
  const data = JSON.parse(fs.readFileSync(ENDPOINTS_FILE, 'utf8'));
  process.stdout.write('[SSRF] Running on ' + data.paramEndpoints.length + ' param endpoints...\n');

  const stack = { url: '', technologies: [] };
  const config = { dryRun: false, outputDir: 'reports', rateLimitMs: 1000, timeoutPerTarget: 60000 };

  const findings = await scanForSSRF(data.paramEndpoints, stack, config);
  process.stdout.write('[SSRF] ' + findings.length + ' findings\n');

  fs.writeFileSync(OUT_FILE, JSON.stringify(findings, null, 2));
  for (const f of findings) {
    process.stdout.write('  [SSRF] ' + f.severity + ' | ' + f.url + ' | ' + f.description.substring(0, 100) + '\n');
  }
  process.exit(0);
}

main().catch(e => { process.stderr.write('[FATAL] ' + e.message + '\n'); process.exit(1); });
