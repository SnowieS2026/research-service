#!/usr/bin/env node
/**
 * Step 1: Discovery - run once, save endpoints to disk.
 */
const { DiscoveryScanner } = require('./dist/src/scanner/DiscoveryScanner.js');
const fs = require('fs');

const ENDPOINTS_FILE = 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/endpoints.json';
const TARGETS_FILE = 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/scan-targets.json';

const targets = [
  'https://www.carsdirect.com/',
  'https://pets.webmd.com/',
  'https://member.webmd.com/',
  'https://www.mdedge.com/',
  'https://accounts.webmd.com/',
  'https://powerpak.com/'
];

async function main() {
  process.stdout.write('[Discovery] Starting...\n');
  const scanner = new DiscoveryScanner();
  const results = await scanner.scan(targets, 'reports');

  const allEndpoints = results.flatMap(r => r.endpoints);
  const paramEndpoints = allEndpoints.filter(e => e.params.length > 0);

  // Dedupe
  const seen = new Set();
  const unique = [];
  for (const e of allEndpoints) {
    if (!seen.has(e.url)) { seen.add(e.url); unique.push(e); }
  }

  const data = {
    targets,
    allEndpoints: unique,
    paramEndpoints,
    scanId: results[0] && results[0].scanId ? results[0].scanId : Date.now().toString(36)
  };

  fs.writeFileSync(ENDPOINTS_FILE, JSON.stringify(data, null, 2));
  process.stdout.write('[Discovery] ' + unique.length + ' endpoints, ' + paramEndpoints.length + ' with params. Saved to ' + ENDPOINTS_FILE + '\n');

  // Save just the targets for nuclei
  fs.writeFileSync(TARGETS_FILE, JSON.stringify(targets, null, 2));

  await scanner.close();
  process.exit(0);
}

main().catch(e => { process.stderr.write('[FATAL] ' + e.message + '\n'); process.exit(1); });
