#!/usr/bin/env node
/** Step 5: SQLi scan - limited time */
const { scanForSQLi } = require('./dist/src/scanner/SQLScanner.js');
const fs = require('fs');

const ENDPOINTS_FILE = 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/endpoints.json';
const OUT_FILE = 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/findings-sqli.json';

async function main() {
  const data = JSON.parse(fs.readFileSync(ENDPOINTS_FILE, 'utf8'));

  // Limit to endpoints that are good candidates (search, query, id params)
  const promising = data.paramEndpoints.filter(e => {
    const u = e.url.toLowerCase();
    return u.includes('search') || u.includes('query') || u.includes('id=') || u.includes('user') || u.includes('product') || u.includes('page') || u.includes('cat') || u.includes('pid') || u.includes('id_');
  });

  process.stdout.write('[SQLi] Running on ' + promising.length + ' promising endpoints (limited)...\n');

  const stack = { url: '', technologies: [] };
  const config = { dryRun: false, outputDir: 'reports', rateLimitMs: 500, timeoutPerTarget: 30000 };

  const findings = await scanForSQLi(promising, stack, config);
  process.stdout.write('[SQLi] ' + findings.length + ' findings\n');

  fs.writeFileSync(OUT_FILE, JSON.stringify(findings, null, 2));
  for (const f of findings) {
    process.stdout.write('  [SQLi] ' + (f.severity || '?') + ' | ' + (f.url || '?') + ' | ' + (f.description || '').substring(0, 100) + '\n');
  }
  process.exit(0);
}

main().catch(e => { process.stderr.write('[FATAL] ' + e.message + '\n'); process.exit(1); });
