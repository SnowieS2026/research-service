#!/usr/bin/env node
const { DiscoveryScanner } = require('./dist/src/scanner/DiscoveryScanner.js');
const fs = require('fs');

const OUT = 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/endpoints.json';
const TARGETS = JSON.parse(fs.readFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/direct-scan-targets.json', 'utf8')).targets.slice(0, 20);

async function main() {
  const scanner = new DiscoveryScanner();
  const results = await scanner.scan(TARGETS.slice(0, 15), 'reports');
  const allEndpoints = results.flatMap(r => r.endpoints);
  const seen = new Set();
  const unique = [];
  for (const e of allEndpoints) { if (!seen.has(e.url)) { seen.add(e.url); unique.push(e); } }
  const paramEndpoints = allEndpoints.filter(e => e.params.length > 0);
  const data = { targets: TARGETS, allEndpoints: unique, paramEndpoints, scanId: Date.now().toString(36) };
  fs.writeFileSync(OUT, JSON.stringify(data, null, 2));
  process.stdout.write('[OK] ' + unique.length + ' endpoints, ' + paramEndpoints.length + ' with params. Saved.\n');
  await scanner.close();
  process.exit(0);
}
main().catch(e => { process.stderr.write('[ERR] ' + e.message + '\n'); process.exit(1); });
