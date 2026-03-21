/**
 * patch-parallel-scanner.js — inject scope-endpoints fix into ParallelScanner.ts
 */
import fs from 'fs';

const file = 'C:\\Users\\bryan\\.openclaw\\workspace\\bounty-passive-pipeline\\src\\scanner\\ParallelScanner.ts';
let code = fs.readFileSync(file, 'utf8');

// 1. Add extractQueryParams to the import line
if (!code.includes('extractQueryParams')) {
  code = code.replace(
    "import { DiscoveryScanner, type DiscoveredEndpoint, type ScanResult } from './DiscoveryScanner.js';",
    "import { DiscoveryScanner, type DiscoveredEndpoint, type ScanResult, extractQueryParams } from './DiscoveryScanner.js';"
  );
}

// 2. Replace the old dedup block with the new scope-endpoints code
const oldBlock = `  // Deduplicate
  const allEndpoints: DiscoveredEndpoint[] = [];
  const stackInfos: StackInfo[] = [];
  for (const result of discoveryResults) {
    allEndpoints.push(...result.endpoints);
    stackInfos.push(result.stackInfo);
  }

  const seenE = new Set<string>();
  const uniqueEndpoints = allEndpoints.filter((e) => {
    if (seenE.has(e.url)) return false;
    seenE.add(e.url); return true;
  });`;

const newBlock = `  // Convert scope assets to endpoints directly
  // Every scope asset becomes a scan target even if DiscoveryScanner found no endpoints.
  // Wildcard scopes (e.g. *.okta.com) will never yield crawled endpoints.
  const scopeEndpoints: DiscoveredEndpoint[] = capped.map((url) => {
    const params = extractQueryParams(url);
    return {
      url,
      method: 'GET',
      params,
      formFields: [],
      inJS: false,
      source: ('html' as DiscoveredEndpoint['source'])
    };
  });

  // Merge crawled endpoints with scope endpoints, deduplicating by URL
  const allEndpoints: DiscoveredEndpoint[] = [...scopeEndpoints];
  const seenE = new Set<string>(capped);
  for (const result of discoveryResults) {
    for (const ep of result.endpoints) {
      if (!seenE.has(ep.url)) {
        seenE.add(ep.url);
        allEndpoints.push(ep);
      }
    }
  }

  const stackInfos = discoveryResults.map((r) => r.stackInfo);`;

if (!code.includes('scopeEndpoints')) {
  code = code.replace(oldBlock, newBlock);
  fs.writeFileSync(file, code, 'utf8');
  console.log('Patched ParallelScanner.ts successfully');
} else {
  console.log('Already patched');
}
