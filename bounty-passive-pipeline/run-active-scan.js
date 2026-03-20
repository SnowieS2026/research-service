import { loadConfig } from './dist/src/config.js';
import { MetadataBrowser } from './dist/src/browser/MetadataBrowser.js';
import { SnapshotManager } from './dist/src/storage/SnapshotManager.js';
import { BugcrowdParser } from './dist/src/browser/parsers/BugcrowdParser.js';
import { DiscoveryScanner } from './dist/src/scanner/DiscoveryScanner.js';
import { StackDetector } from './dist/src/stackdetector/StackDetector.js';
import { scanForXSS } from './dist/src/scanner/XSSScanner.js';
import { scanForSQLi } from './dist/src/scanner/SQLScanner.js';
import { scanForSSRF } from './dist/src/scanner/SSRFScanner.js';
import { scanForAuthIssues } from './dist/src/scanner/AuthScanner.js';
import { scanAPI } from './dist/src/scanner/ApiScanner.js';
import { runNuclei } from './dist/src/scanner/NucleiScanner.js';
import { classifyFinding } from './dist/src/FindingClassifier.js';
import { Logger } from './dist/src/Logger.js';
import fs from 'fs';
import path from 'path';

const LOG = new Logger('ActiveScan');

// Redirect stdout to file
const logFile = path.join(process.cwd(), 'logs', `scan-${Date.now()}.log`);
const logStream = fs.createWriteStream(logFile);
function log(...args) {
  const ts = new Date().toISOString().slice(11, 19);
  const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
  logStream.write(`[${ts}] ${msg}\n`);
  console.log(`[${ts}]`, ...args);
}

async function main() {
  log('=== Active Scan Test ===');
  log('Config: DRY_RUN=false, all tools enabled');

  const testUrl = 'https://bugcrowd.com/engagements/okta';
  log('Target:', testUrl);

  // Step 1: Parse program scope from Bugcrowd
  log('\n[1] Fetching program scope...');
  const browser = new MetadataBrowser();
  await browser.init();
  const page = await browser.navigate(testUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const parser = new BugcrowdParser(LOG);
  const program = await parser.parse(page, testUrl);
  log('  Program:', program.program_name);
  log('  Scope assets:', program.scope_assets.length);
  log('  Reward range:', program.reward_range);

  // Step 2: Filter scope to actual in-scope URLs (filter out non-http)
  const scopeUrls = program.scope_assets
    .filter(a => a.startsWith('http'))
    .slice(0, 10); // cap at 10 for test
  log('\n[2] Scope URLs to scan:', scopeUrls.length);
  scopeUrls.forEach((a, i) => log(`  ${i+1}. ${a}`));

  if (scopeUrls.length === 0) {
    log('ERROR: No http scope assets found in program');
    await browser.close();
    return;
  }

  // Step 3: Discovery scan — enumerate endpoints
  log('\n[3] Discovery scan (endpoint enumeration)...');
  const discoveryScanner = new DiscoveryScanner();
  const discoveredEndpoints = [];

  for (const url of scopeUrls) {
    try {
      log('  Probing:', url);
      const result = await discoveryScanner.probe(url);
      if (!result || result.isStatic) { log('    -> skipped'); continue; }
      log('    Status:', result.statusCode, '| Content-Type:', result.contentType);

      // Stack detection
      const stack = await discoveryScanner.stackDetector.detect(result.finalUrl);
      log('    Stack:', stack.technologies.map(t => t.name).join(', ') || 'unknown');
      log('    Server:', stack.server || 'unknown', '| CDN:', stack.cdn || 'none');

      // Endpoint discovery
      const { endpoints } = await discoveryScanner.discoverEndpoints(result.finalUrl);
      log('    Endpoints found:', endpoints.length);
      endpoints.slice(0, 5).forEach(e => log('      -', e.method, e.url, '| params:', e.params.length, '| formFields:', e.formFields.length));
      discoveredEndpoints.push(...endpoints);
    } catch (err) {
      log('  ERROR on', url, ':', String(err));
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  log('\n  Total endpoints discovered:', discoveredEndpoints.length);
  const paramEndpoints = discoveredEndpoints.filter(e => e.params.length > 0);
  log('  Endpoints with parameters:', paramEndpoints.length);

  // Step 4: Run active scanners
  log('\n[4] Running active scanners...');
  const allFindings = [];

  const scannerConfig = {
    dryRun: false,
    tools: { dalfox: true, sqlmap: true, nuclei: true, ssrf: true, auth: true, api: true },
    nucleiTemplates: '',
    rateLimitMs: 2000,
    timeoutPerTarget: 60000,
    maxTargetsPerRun: 10,
    outputDir: 'reports',
    callbackUrl: ''
  };

  const firstStack = { url: testUrl, technologies: [], server: null, cdn: null, cms: null, frontend: [], backend: [], language: null, framework: null, interestingHeaders: {}, scanRecommendations: [] };

  if (paramEndpoints.length > 0) {
    log('\n  [4a] XSS scan (dalfox)...');
    const xssFindings = await scanForXSS(paramEndpoints, firstStack, scannerConfig);
    log('    XSS findings:', xssFindings.length);
    xssFindings.forEach(f => log('      -', f.severity, f.type, f.url, f.param ? `@${f.param}` : ''));
    allFindings.push(...xssFindings);

    log('\n  [4b] SQLi scan (sqlmap)...');
    const sqlFindings = await scanForSQLi(paramEndpoints, firstStack, scannerConfig);
    log('    SQLi findings:', sqlFindings.length);
    sqlFindings.forEach(f => log('      -', f.severity, f.type, f.url, f.param ? `@${f.param}` : ''));
    allFindings.push(...sqlFindings);

    log('\n  [4c] SSRF scan...');
    const ssrfFindings = await scanForSSRF(paramEndpoints, firstStack, scannerConfig);
    log('    SSRF findings:', ssrfFindings.length);
    ssrfFindings.forEach(f => log('      -', f.severity, f.type, f.url, f.param ? `@${f.param}` : ''));
    allFindings.push(...ssrfFindings);

    log('\n  [4d] Auth scan...');
    const authFindings = await scanForAuthIssues(paramEndpoints, firstStack, scannerConfig);
    log('    Auth findings:', authFindings.length);
    authFindings.forEach(f => log('      -', f.severity, f.type, f.url));
    allFindings.push(...authFindings);
  }

  log('\n  [4e] API scan...');
  const apiFindings = await scanAPI(discoveredEndpoints, firstStack, scannerConfig);
  log('    API findings:', apiFindings.length);
  apiFindings.forEach(f => log('      -', f.severity, f.type, f.url, f.subType ? `[${f.subType}]` : ''));
  allFindings.push(...apiFindings);

  log('\n  [4f] Nuclei scan...');
  const nucleiFindings = await runNuclei(scopeUrls, [], scannerConfig);
  log('    Nuclei findings:', nucleiFindings.length);
  nucleiFindings.slice(0, 10).forEach(f => log('      -', f.severity, f.template, '@', f.url));
  allFindings.push(...nucleiFindings);

  // Step 5: Deduplicate and classify
  log('\n[5] Deduplication and classification...');
  const deduped = allFindings.filter((f, i, arr) =>
    arr.findIndex(x => x.url === f.url && x.type === f.type) === i
  );
  log('  Unique findings:', deduped.length);

  for (const finding of deduped) {
    const notification = { ...program, diff: { oldHash: '', newHash: '', addedFields: [], removedFields: [], changedFields: [] }, prevProgram: undefined };
    const cls = classifyFinding(notification);
    log(`  ${cls.severity} [${cls.cvss}] ${finding.type} @ ${finding.url} — ${cls.reasons[0]}`);
  }

  // Step 6: Write active scan report
  log('\n[6] Writing active scan report...');
  const severityCounts = {
    xss: deduped.filter(f => f.type === 'xss').length,
    sql: deduped.filter(f => f.type === 'sql').length,
    ssrf: deduped.filter(f => f.type === 'ssrf').length,
    idor: deduped.filter(f => f.type === 'idor').length,
    auth: deduped.filter(f => f.type === 'auth').length,
    rce: deduped.filter(f => f.type === 'rce').length,
    info: deduped.filter(f => ['nuclei', 'api', 'info'].includes(f.type)).length,
  };

  const report = {
    scanId: 'scan-' + Date.now().toString(16),
    startedAt: new Date().toISOString(),
    duration: 0,
    targetsScanned: scopeUrls.length,
    findings: deduped,
    summary: severityCounts,
    stackDetected: {},
    errors: []
  };

  const { writeScanReport } = await import('./dist/src/scanner/ScannerOrchestrator.js');
  if (deduped.length > 0) {
    // Write scan report manually (replicate ScannerOrchestrator.saveScanResult)
    const today = new Date().toISOString().split('T')[0];
    const scanDir = path.join('reports', 'scans', today);
    await fs.promises.mkdir(scanDir, { recursive: true });
    const hash = report.scanId.slice(0, 12);
    const mdPath = path.join(scanDir, `scan-${hash}.md`);
    const jsonPath = path.join(scanDir, `scan-${hash}.json`);
    await fs.promises.writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf8');
    const mdLines = [
      `# Active Scan Report – ${testUrl}`,
      ``,
      `## Summary`,
      ``,
      `| Metric | Value |`,
      `| --- | --- |`,
      `| Target | ${testUrl} |`,
      `| Scan ID | ${report.scanId} |`,
      `| Targets | ${report.targetsScanned} |`,
      `| Total Findings | ${deduped.length} |`,
      ``,
      `### Findings by Type`,
      ``,
      `| Type | Count |`,
      `| --- | --- |`,
      `| XSS | ${severityCounts.xss} |`,
      `| SQLi | ${severityCounts.sql} |`,
      `| SSRF | ${severityCounts.ssrf} |`,
      `| IDOR | ${severityCounts.idor} |`,
      `| Auth | ${severityCounts.auth} |`,
      `| Info/Nuclei | ${severityCounts.info} |`,
      ``,
      `### Findings`,
      ``,
      ...deduped.slice(0, 50).map((f, i) => {
        const sev = f.severity || 'INFO';
        const cvss = f.cvss || '?';
        const param = (f).param || (f).subType || '';
        return `${i+1}. **${sev}** [\`${f.type}\`] @ ${f.url}${param ? ` (${param})` : ''} — ${f.description.slice(0, 100)}`;
      }),
      ``,
      `_Generated at ${new Date().toISOString()}_`
    ];
    await fs.promises.writeFile(mdPath, mdLines.join('\n'), 'utf8');
    log('  Report MD:', mdPath);
    log('  Report JSON:', jsonPath);
    log('  Exists:', fs.existsSync(mdPath), fs.existsSync(jsonPath));
  } else {
    log('  No findings — skipping report');
  }

  await discoveryScanner.close();
  await browser.close();

  log('\n=== Scan Complete ===');
  log('Log:', logFile);
  logStream.end();
}

main().catch(err => {
  log('FATAL:', err.message);
  log(err.stack);
  logStream.end();
  process.exit(1);
});
