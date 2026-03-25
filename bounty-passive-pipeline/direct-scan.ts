/**
 * direct-scan.ts – Run a targeted active scan on a specific program.
 * Usage: npx tsx direct-scan.ts <slug> [target1] [target2] ...
 *   npx tsx direct-scan.ts kucoin
 *   npx tsx direct-scan.ts blockchain-dot-com
 *   npx tsx direct-scan.ts custom https://example.com https://api.example.com
 */
import { runNuclei } from './src/scanner/NucleiScanner.js';
import { scanForXSS } from './src/scanner/XSSScanner.js';
import { scanForSQLi } from './src/scanner/SQLScanner.js';
import { scanForSSRF } from './src/scanner/SSRFScanner.js';
import { scanForAuthIssues } from './src/scanner/AuthScanner.js';
import { scanAPI } from './src/scanner/ApiScanner.js';
import { DiscoveryScanner, type DiscoveredEndpoint } from './src/scanner/DiscoveryScanner.js';
import path from 'path';
import fs from 'fs';

const PIPELINE_ROOT = process.cwd();
const SNAPSHOT_DIR = path.join(PIPELINE_ROOT, 'logs', 'snapshots');
const REPORTS_DIR = path.join(PIPELINE_ROOT, 'reports', 'direct');

const PROGRAM_TARGETS: Record<string, string[]> = {
  'kucoin': ['https://www.kucoin.com', 'https://api.kucoin.com', 'https://spot-api.kucoin.com', 'https://futures-api.kucoin.com'],
  'blockchain-dot-com': ['https://blockchain.com', 'https://api.blockchain.com', 'https://login.blockchain.com'],
  'zendesk': ['https://www.zendesk.com', 'https://api.zendesk.com', 'https://developer.zendesk.com'],
  'chime': ['https://www.chime.com', 'https://api.chime.com', 'https://auth.chime.com'],
  'okta': ['https://developer.okta.com', 'https://okta.com', 'https://www.okta.com'],
  'bitso': ['https://bitso.com', 'https://api.bitso.com'],
  'coinbase': ['https://coinbase.com', 'https://api.coinbase.com'],
};

async function extractScopeFromSnapshot(slug: string): Promise<string[]> {
  const files = fs.readdirSync(SNAPSHOT_DIR)
    .filter(f => f.includes(slug) && !f.includes('engagements') && !f.includes('programs')
      && !f.includes('blog') && !f.includes('about') && !f.includes('featured'));
  const allUrls = new Set<string>();
  for (const file of files.slice(0, 3)) {
    try {
      const raw = fs.readFileSync(path.join(SNAPSHOT_DIR, file), 'utf8');
      const snap = JSON.parse(raw);
      if (snap.scope_assets) {
        for (const asset of snap.scope_assets) {
          if (typeof asset === 'string' && asset.startsWith('http')) allUrls.add(asset);
        }
      }
    } catch { /* skip */ }
  }
  return [...allUrls];
}

async function discoverEndpoints(targets: string[]): Promise<DiscoveredEndpoint[]> {
  const scanner = new DiscoveryScanner();
  const endpoints: DiscoveredEndpoint[] = [];
  for (const target of targets) {
    try {
      const results = await scanner.scan([target], REPORTS_DIR);
      for (const r of results) endpoints.push(...r.endpoints);
    } catch (err) { console.warn(`Discovery failed for ${target}: ${err}`); }
    await new Promise(r => setTimeout(r, 2000));
  }
  await scanner.close();
  return endpoints;
}

interface Finding { type: string; severity: string; url: string; description: string; evidence: string; tool: string; cvss: number; references: string[]; }

async function runScan(targets: string[], slug: string) {
  const reportDir = path.join(REPORTS_DIR, slug);
  fs.mkdirSync(reportDir, { recursive: true });

  const config: any = {
    dryRun: false,
    tools: { dalfox: true, sqlmap: true, nuclei: true, ssrf: true, auth: true, api: true, subfinder: false, gau: false, httpx: false, gitleaks: false },
    nucleiTemplates: '', rateLimitMs: 2000, timeoutPerTarget: 300000,
    maxTargetsPerRun: 10, outputDir: reportDir, sqlmapLevel: 2, sqlmapRisk: 1
  };

  const allFindings: Finding[] = [];
  const errors: string[] = [];
  const snapshotPath = path.join(reportDir, 'latest-findings.json');

  function saveSnapshot() {
    try { fs.writeFileSync(snapshotPath, JSON.stringify({ targets, findings: allFindings, errors }, null, 2)); } catch { /* noop */ }
  }

  console.log(`\n[1/6] Discovering endpoints for ${targets.length} targets...`);
  const endpoints = await discoverEndpoints(targets);
  const paramEndpoints = endpoints.filter(e => e.params.length > 0);
  console.log(`    Found ${endpoints.length} endpoints (${paramEndpoints.length} with params)`);
  saveSnapshot();

  // Nuclei
  console.log(`\n[2/6] Nuclei on ${targets.length} targets...`);
  try {
    const f = await runNuclei(targets, [], config);
    allFindings.push(...(f as Finding[]));
    console.log(`    Nuclei: ${f.length} findings`);
  } catch (e) { errors.push(`Nuclei: ${e}`); console.warn(`    Nuclei error: ${e}`); }
  saveSnapshot();

  // XSS
  if (paramEndpoints.length > 0) {
    console.log(`\n[3/6] XSS on ${Math.min(paramEndpoints.length, 20)} endpoints...`);
    try {
      const f = await scanForXSS(paramEndpoints.slice(0, 20), {} as any, config);
      allFindings.push(...(f as Finding[]));
      console.log(`    XSS: ${f.length} findings`);
    } catch (e) { errors.push(`XSS: ${e}`); console.warn(`    XSS error: ${e}`); }
    saveSnapshot();
  } else { console.log('\n[3/6] XSS: no param endpoints, skipping'); }

  // SQLi
  if (paramEndpoints.length > 0) {
    console.log(`\n[4/6] SQLi on ${Math.min(paramEndpoints.length, 20)} endpoints...`);
    try {
      const f = await scanForSQLi(paramEndpoints.slice(0, 20), {} as any, config);
      allFindings.push(...(f as Finding[]));
      console.log(`    SQLi: ${f.length} findings`);
    } catch (e) { errors.push(`SQLi: ${e}`); console.warn(`    SQLi error: ${e}`); }
    saveSnapshot();
  } else { console.log('\n[4/6] SQLi: no param endpoints, skipping'); }

  // SSRF
  if (paramEndpoints.length > 0) {
    console.log(`\n[5/6] SSRF on ${Math.min(paramEndpoints.length, 20)} endpoints...`);
    try {
      const f = await scanForSSRF(paramEndpoints.slice(0, 20), {} as any, config);
      allFindings.push(...(f as Finding[]));
      console.log(`    SSRF: ${f.length} findings`);
    } catch (e) { errors.push(`SSRF: ${e}`); console.warn(`    SSRF error: ${e}`); }
    saveSnapshot();
  } else { console.log('\n[5/6] SSRF: no param endpoints, skipping'); }

  // Auth
  if (paramEndpoints.length > 0) {
    console.log(`\n[6/6] Auth on ${Math.min(paramEndpoints.length, 20)} endpoints...`);
    try {
      const f = await scanForAuthIssues(paramEndpoints.slice(0, 20), {} as any, config);
      allFindings.push(...(f as Finding[]));
      console.log(`    Auth: ${f.length} findings`);
    } catch (e) { errors.push(`Auth: ${e}`); console.warn(`    Auth error: ${e}`); }
    saveSnapshot();
  } else { console.log('\n[6/6] Auth: no param endpoints, skipping'); }

  // Results
  console.log('\n' + '='.repeat(60));
  const bySev = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
  for (const f of allFindings) {
    const k = f.severity?.toUpperCase() as keyof typeof bySev;
    if (k in bySev) bySev[k]++; else bySev.INFO++;
  }
  console.log(`SCAN COMPLETE – ${allFindings.length} findings`);
  console.log(`  CRITICAL: ${bySev.CRITICAL}  HIGH: ${bySev.HIGH}  MEDIUM: ${bySev.MEDIUM}  LOW: ${bySev.LOW}  INFO: ${bySev.INFO}`);
  if (errors.length) console.log(`  Errors: ${errors.length}`);
  console.log('='.repeat(60));

  const notable = allFindings.filter(f => ['CRITICAL', 'HIGH', 'MEDIUM'].includes(f.severity?.toUpperCase()));
  if (notable.length > 0) {
    console.log('\nNOTABLE FINDINGS:');
    for (const f of notable.slice(0, 30)) {
      console.log(`  [${f.severity?.toUpperCase()}] ${f.type} @ ${f.url}`);
      console.log(`    ${f.description?.slice(0, 150)}`);
      if (f.evidence) console.log(`    → ${f.evidence?.slice(0, 150)}`);
      console.log('');
    }
  }

  saveSnapshot();
  const finalPath = path.join(reportDir, `findings-${Date.now()}.json`);
  fs.writeFileSync(finalPath, JSON.stringify({ slug, targets, findings: allFindings, errors }, null, 2));
  console.log(`Report: ${finalPath}`);
  return allFindings;
}

async function main() {
  const args = process.argv.slice(2);
  const slug = args[0] ?? 'kucoin';
  const cliTargets = args.slice(1);

  console.log(`=== Direct Scan: ${slug} ===`);
  let targets: string[];

  if (cliTargets.length > 0) {
    targets = cliTargets;
    console.log(`CLI targets: ${targets.join(', ')}`);
  } else {
    const fromSnap = await extractScopeFromSnapshot(slug);
    if (fromSnap.length > 0) {
      targets = fromSnap; console.log(`Snapshot targets: ${targets.length}`);
    } else {
      targets = PROGRAM_TARGETS[slug] ?? []; console.log(`Hardcoded targets: ${targets.length}`);
    }
  }

  if (targets.length === 0) {
    console.error('No targets. Usage: npx tsx direct-scan.ts <slug> [url1] [url2] ...');
    process.exit(1);
  }

  const findings = await runScan(targets, slug);
  const notable = findings.filter(f => ['CRITICAL', 'HIGH', 'MEDIUM'].includes(f.severity?.toUpperCase()));
  console.log(`\nNotable findings: ${notable.length}`);
  process.exit(0);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
