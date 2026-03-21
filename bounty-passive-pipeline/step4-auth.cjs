#!/usr/bin/env node
/** Step 4: Auth scan */
const { scanForAuthIssues } = require('./dist/src/scanner/AuthScanner.js');
const fs = require('fs');

const ENDPOINTS_FILE = 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/endpoints.json';
const OUT_FILE = 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/findings-auth.json';

async function main() {
  const data = JSON.parse(fs.readFileSync(ENDPOINTS_FILE, 'utf8'));

  const loginForms = data.paramEndpoints.filter(e => e.formFields && e.formFields.some(f => f.type === 'password'));
  const authTargets = [...data.paramEndpoints, ...loginForms];

  process.stdout.write('[Auth] Running on ' + authTargets.length + ' targets...\n');

  const stack = { url: '', technologies: [] };
  const config = { dryRun: false, outputDir: 'reports', rateLimitMs: 1000, timeoutPerTarget: 60000 };

  const findings = await scanForAuthIssues(authTargets, stack, config);
  process.stdout.write('[Auth] ' + findings.length + ' findings\n');

  fs.writeFileSync(OUT_FILE, JSON.stringify(findings, null, 2));
  for (const f of findings) {
    process.stdout.write('  [AUTH] ' + (f.severity || '?') + ' | ' + (f.url || '?') + ' | ' + (f.description || '').substring(0, 100) + '\n');
  }
  process.exit(0);
}

main().catch(e => { process.stderr.write('[FATAL] ' + e.message + '\n'); process.exit(1); });
