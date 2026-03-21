/**
 * ScannerOrchestrator – coordinates all active scan tools.
 * Orchestrates stack detection, discovery, and scanning based on config.
 */
import { type StackInfo } from '../stackdetector/StackDetector.js';
import { type DiscoveredEndpoint, DiscoveryScanner } from './DiscoveryScanner.js';
import { type ScanResult } from './DiscoveryScanner.js';
export { type ScannerConfig } from './ScanResult.js';
import { type ScannerConfig, type ScanRunResult } from './ScanResult.js';
import { scanForXSS } from './XSSScanner.js';
import { scanForSQLi } from './SQLScanner.js';
import { scanForSSRF } from './SSRFScanner.js';
import { scanForAuthIssues } from './AuthScanner.js';
import { scanAPI } from './ApiScanner.js';
import { runNuclei } from './NucleiScanner.js';
import { scanSubfinder } from './SubfinderScanner.js';
import { scanGau } from './GauScanner.js';
import { scanHttpx } from './HttpxScanner.js';
import { scanGitleaks } from './GitleaksScanner.js';
import {
  type BaseFinding,
  type AnyFinding,
  deduplicateFindings,
  sevToCvss
} from './ScanResult.js';
import { BountyDB } from '../storage/BountyDB.js';
import { Logger } from '../Logger.js';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

const LOG = new Logger('ScannerOrchestrator');

// Static asset extensions to filter
const STATIC_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
  '.css', '.scss', '.sass', '.less',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.mp4', '.mp3', '.webm', '.wav',
  '.pdf', '.zip', '.tar', '.gz', '.rar',
  '.exe', '.dmg', '.app'
]);

function isStaticAsset(url: string): boolean {
  try {
    const u = new URL(url);
    return STATIC_EXTENSIONS.has(path.extname(u.pathname).toLowerCase());
  } catch {
    return false;
  }
}

function buildStackCounts(stackInfos: StackInfo[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const si of stackInfos) {
    for (const t of si.technologies) {
      counts[t.name] = (counts[t.name] ?? 0) + 1;
    }
  }
  return counts;
}

export class ScannerOrchestrator {
  private config: ScannerConfig;
  private discoveryScanner: DiscoveryScanner;
  private db?: BountyDB;

  constructor(config: ScannerConfig, db?: BountyDB) {
    this.config = config;
    this.discoveryScanner = new DiscoveryScanner();
    this.db = db;
  }

  async close(): Promise<void> {
    await this.discoveryScanner.close();
  }

  /**
   * Main entry point – scan a list of target URLs.
   */
  async scanTargets(targets: string[]): Promise<ScanRunResult> {
    const startTime = Date.now();
    const scanId = crypto.randomUUID();
    const errors: string[] = [];
    const allFindings: BaseFinding[] = [];
    const stackInfos: StackInfo[] = [];

    LOG.log(`ScannerOrchestrator: starting scan for ${targets.length} targets`);

    // 1. Deduplicate + filter static assets
    const seen = new Set<string>();
    const filtered = targets.filter((t) => {
      if (isStaticAsset(t)) return false;
      try {
        const n = new URL(t).href;
        if (seen.has(n)) return false;
        seen.add(n);
        return true;
      } catch {
        return false;
      }
    });

    // 2. Cap at maxTargetsPerRun
    const capped = filtered.slice(0, this.config.maxTargetsPerRun);
    LOG.log(`ScannerOrchestrator: ${capped.length} targets after cap (from ${filtered.length})`);

    // 3. Run discovery scan on each target
    const discoveryResults: ScanResult[] = [];
    for (const target of capped) {
      try {
        if (this.config.dryRun) {
          LOG.log(`[DRY_RUN] Discovery scan: ${target}`);
          continue;
        }
        const results = await this.discoveryScanner.scan([target], this.config.outputDir);
        discoveryResults.push(...results);
      } catch (err) {
        const msg = `Discovery failed for ${target}: ${err}`;
        LOG.warn(msg);
        errors.push(msg);
      }

      // Respect rate limiting between targets
      await new Promise((r) => setTimeout(r, this.config.rateLimitMs));
    }

    // Collect stack info from discovery results
    for (const result of discoveryResults) {
      stackInfos.push(result.stackInfo);
    }

    // 4. Build the scan plan based on stack detection
    // Collect all discovered endpoints
    const allEndpoints: DiscoveredEndpoint[] = [];
    for (const result of discoveryResults) {
      allEndpoints.push(...result.endpoints);
    }

    // Deduplicate endpoints
    const seenEndpoints = new Set<string>();
    const uniqueEndpoints = allEndpoints.filter((e) => {
      if (seenEndpoints.has(e.url)) return false;
      seenEndpoints.add(e.url);
      return true;
    });

    // Filter endpoints with parameters for targeted scanning
    const paramEndpoints = uniqueEndpoints.filter((e) => e.params.length > 0);
    const loginFormEndpoints = uniqueEndpoints.filter((e) =>
      e.formFields.some((f) => f.type === 'password')
    );

    // 5. Execute scan tools in parallel (max 3 concurrent)
    const scanPromises: Promise<void>[] = [];

    if (this.config.tools.dalfox && paramEndpoints.length > 0) {
      scanPromises.push(
        scanForXSS(paramEndpoints, discoveryResults[0]?.stackInfo ?? {} as StackInfo, this.config)
          .then((f) => {
            allFindings.push(...f);
            LOG.log(`XSS scan complete: ${f.length} findings`);
          })
          .catch((err) => {
            const msg = `XSS scan error: ${err}`;
            LOG.warn(msg);
            errors.push(msg);
          })
      );
    }

    if (this.config.tools.sqlmap && paramEndpoints.length > 0) {
      scanPromises.push(
        scanForSQLi(paramEndpoints, discoveryResults[0]?.stackInfo ?? {} as StackInfo, this.config)
          .then((f) => {
            allFindings.push(...f);
            LOG.log(`SQLi scan complete: ${f.length} findings`);
          })
          .catch((err) => {
            const msg = `SQLi scan error: ${err}`;
            LOG.warn(msg);
            errors.push(msg);
          })
      );
    }

    if (this.config.tools.ssrf && paramEndpoints.length > 0) {
      scanPromises.push(
        scanForSSRF(paramEndpoints, discoveryResults[0]?.stackInfo ?? {} as StackInfo, this.config)
          .then((f) => {
            allFindings.push(...f);
            LOG.log(`SSRF scan complete: ${f.length} findings`);
          })
          .catch((err) => {
            const msg = `SSRF scan error: ${err}`;
            LOG.warn(msg);
            errors.push(msg);
          })
      );
    }

    if (this.config.tools.auth) {
      const authTargets = [...paramEndpoints, ...loginFormEndpoints];
      if (authTargets.length > 0) {
        scanPromises.push(
          scanForAuthIssues(authTargets, discoveryResults[0]?.stackInfo ?? {} as StackInfo, this.config)
            .then((f) => {
              allFindings.push(...f);
              LOG.log(`Auth scan complete: ${f.length} findings`);
            })
            .catch((err) => {
              const msg = `Auth scan error: ${err}`;
              LOG.warn(msg);
              errors.push(msg);
            })
        );
      }
    }

    if (this.config.tools.api) {
      scanPromises.push(
        scanAPI(uniqueEndpoints, discoveryResults[0]?.stackInfo ?? {} as StackInfo, this.config)
          .then((f) => {
            allFindings.push(...f);
            LOG.log(`API scan complete: ${f.length} findings`);
          })
          .catch((err) => {
            const msg = `API scan error: ${err}`;
            LOG.warn(msg);
            errors.push(msg);
          })
      );
    }

    if (this.config.tools.nuclei && capped.length > 0) {
      const stackTechs = stackInfos.flatMap((s) => s.technologies.map((t) => t.name));
      scanPromises.push(
        runNuclei(capped, stackTechs, this.config)
          .then((f) => {
            allFindings.push(...f);
            LOG.log(`Nuclei scan complete: ${f.length} findings`);
          })
          .catch((err) => {
            const msg = `Nuclei scan error: ${err}`;
            LOG.warn(msg);
            errors.push(msg);
          })
      );
    }

    // OSINT scanners – subdomain, URL archive, HTTP probing, secret scanning
    if (this.config.tools.subfinder) {
      scanPromises.push(
        scanSubfinder(capped, {} as StackInfo, this.config)
          .then((f) => {
            allFindings.push(...f);
            LOG.log(`Subfinder scan complete: ${f.length} findings`);
          })
          .catch((err) => {
            const msg = `Subfinder scan error: ${err}`;
            LOG.warn(msg);
            errors.push(msg);
          })
      );
    }

    if (this.config.tools.gau) {
      scanPromises.push(
        scanGau(capped, {} as StackInfo, this.config)
          .then((f) => {
            allFindings.push(...f);
            LOG.log(`Gau scan complete: ${f.length} findings`);
          })
          .catch((err) => {
            const msg = `Gau scan error: ${err}`;
            LOG.warn(msg);
            errors.push(msg);
          })
      );
    }

    if (this.config.tools.httpx) {
      scanPromises.push(
        scanHttpx(capped, {} as StackInfo, this.config)
          .then((f) => {
            allFindings.push(...f);
            LOG.log(`Httpx scan complete: ${f.length} findings`);
          })
          .catch((err) => {
            const msg = `Httpx scan error: ${err}`;
            LOG.warn(msg);
            errors.push(msg);
          })
      );
    }

    if (this.config.tools.gitleaks) {
      scanPromises.push(
        scanGitleaks(capped, {} as StackInfo, this.config)
          .then((f) => {
            allFindings.push(...f);
            LOG.log(`Gitleaks scan complete: ${f.length} findings`);
          })
          .catch((err) => {
            const msg = `Gitleaks scan error: ${err}`;
            LOG.warn(msg);
            errors.push(msg);
          })
      );
    }

    // Run all scan tools sequentially to avoid concurrent-crash issues
    for (const p of scanPromises) {
      await p;
    }

    // 6. Deduplicate findings
    const dedupedFindings = deduplicateFindings(allFindings);

    // 7. Compute summary
    const summary = {
      xss: dedupedFindings.filter((f) => f.type === 'xss').length,
      sql: dedupedFindings.filter((f) => f.type === 'sql').length,
      ssrf: dedupedFindings.filter((f) => f.type === 'ssrf').length,
      idor: dedupedFindings.filter((f) => f.type === 'idor').length,
      auth: dedupedFindings.filter((f) => f.type === 'auth').length,
      rce: dedupedFindings.filter((f) => f.type === 'rce').length,
      info: dedupedFindings.filter((f) => f.type === 'info' || f.type === 'nuclei' || f.type === 'api').length
    };

    const duration = Date.now() - startTime;

    LOG.log(
      `ScannerOrchestrator: scan complete in ${duration}ms – ` +
        `${dedupedFindings.length} findings (XSS:${summary.xss} SQL:${summary.sql} SSRF:${summary.ssrf} AUTH:${summary.auth} INFO:${summary.info})`
    );

    return {
      scanId,
      startedAt: new Date(startTime).toISOString(),
      duration,
      targetsScanned: capped.length,
      findings: dedupedFindings,
      summary,
      stackDetected: buildStackCounts(stackInfos),
      errors
    };
  }

  /**
   * Save scan result to output directory.
   */
  async saveScanResult(result: ScanRunResult): Promise<{ mdPath: string; jsonPath: string }> {
    const today = new Date().toISOString().split('T')[0];
    const dir = path.join(this.config.outputDir, today);
    await fs.promises.mkdir(dir, { recursive: true });

    const hash = result.scanId.slice(0, 12);
    const base = `scan-${hash}`;
    const mdPath = path.join(dir, `${base}.md`);
    const jsonPath = path.join(dir, `${base}.json`);

    await fs.promises.writeFile(jsonPath, JSON.stringify(result, null, 2), 'utf8');

    // Write markdown summary
    const md = renderScanMarkdown(result);
    await fs.promises.writeFile(mdPath, md, 'utf8');

    LOG.log(`Scan report saved: ${mdPath}`);
    return { mdPath, jsonPath };
  }

  /**
   * Store scan results in the SQLite DB.
   */
  storeInDb(result: ScanRunResult): void {
    if (!this.db) return;
    try {
      // Insert scan run
      const scanId = this.db.insertScanRun(
        result.scanId,
        result.startedAt,
        result.duration,
        result.targetsScanned,
        result.summary.xss + result.summary.sql + result.summary.ssrf + result.summary.idor + result.summary.auth + result.summary.rce + result.summary.info,
        result.errors.length
      );

      // Insert findings
      for (const f of result.findings) {
        this.db.insertScanFinding(
          scanId,
          f.url,
          f.type,
          f.severity,
          f.cvss,
          f.tool,
          f.description,
          f.evidence
        );
      }

      LOG.log(`Scan results stored in DB: scanId=${scanId}`);
    } catch (err) {
      LOG.error(`Failed to store scan results in DB: ${err}`);
    }
  }
}

function renderScanMarkdown(result: ScanRunResult): string {
  const lines: string[] = [];
  const severityEmoji: Record<string, string> = {
    CRITICAL: '🔴',
    HIGH: '🟠',
    MEDIUM: '🟡',
    LOW: '🟢'
  };

  lines.push(`# Active Scan Report – ${result.startedAt.split('T')[0]}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`| --- | --- |`);
  lines.push(`| Scan ID | ${result.scanId} |`);
  lines.push(`| Started | ${result.startedAt} |`);
  lines.push(`| Duration | ${Math.round(result.duration / 1000)}s |`);
  lines.push(`| Targets Scanned | ${result.targetsScanned} |`);
  lines.push(`| Total Findings | ${result.findings.length} |`);
  lines.push('');

  lines.push('### Findings by Category');
  lines.push('');
  lines.push(`| Category | Count |`);
  lines.push(`| --- | --- |`);
  lines.push(`| XSS | ${result.summary.xss} |`);
  lines.push(`| SQL Injection | ${result.summary.sql} |`);
  lines.push(`| SSRF | ${result.summary.ssrf} |`);
  lines.push(`| IDOR | ${result.summary.idor} |`);
  lines.push(`| Auth | ${result.summary.auth} |`);
  lines.push(`| RCE | ${result.summary.rce} |`);
  lines.push(`| Info/Nuclei | ${result.summary.info} |`);
  lines.push('');

  // Stack detected
  const techs = Object.entries(result.stackDetected).sort((a, b) => b[1] - a[1]);
  if (techs.length > 0) {
    lines.push('### Stack Detected');
    lines.push('');
    for (const [tech, count] of techs) {
      lines.push(`- **${tech}** (${count} target(s))`);
    }
    lines.push('');
  }

  // Findings table
  if (result.findings.length > 0) {
    lines.push('### Findings');
    lines.push('');
    lines.push('| # | Type | Severity | CVSS | URL | Description |');
    lines.push('| --- | --- | --- | --- | --- | --- |');
    for (let i = 0; i < Math.min(result.findings.length, 100); i++) {
      const f = result.findings[i];
      const desc = f.description.slice(0, 60) + (f.description.length > 60 ? '…' : '');
      const shortUrl = f.url.length > 60 ? f.url.slice(0, 60) + '…' : f.url;
      lines.push(`| ${i + 1} | ${f.type} | ${f.severity} | ${f.cvss} | ${shortUrl} | ${desc} |`);
    }
    if (result.findings.length > 100) {
      lines.push(`| … | (${result.findings.length - 100} more findings) | | | | |`);
    }
    lines.push('');
  }

  // Detailed findings by severity
  const sortedFindings = [...result.findings].sort((a, b) => {
    const sevOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return (sevOrder[a.severity] ?? 4) - (sevOrder[b.severity] ?? 4);
  });

  for (const f of sortedFindings.slice(0, 20)) {
    const emoji = severityEmoji[f.severity] ?? '⚪';
    const param = (f as AnyFinding & { param?: string }).param ?? '';
    const paramStr = param ? ` — param \`${param}\`` : '';
    lines.push(`#### ${emoji} [${f.severity}] ${f.type.toUpperCase()} at \`${f.url}\`${paramStr}`);
    lines.push('');
    lines.push(`- **Severity**: ${f.severity} (CVSS ${f.cvss})`);
    lines.push(`- **Tool**: ${f.tool}`);
    lines.push(`- **Description**: ${f.description}`);
    lines.push(`- **Evidence**: ${f.evidence}`);
    if (f.references.length > 0) {
      lines.push(`- **References**: ${f.references.map(r => `[link](${r})`).join(', ')}`);
    }
    lines.push('');
  }

  if (result.errors.length > 0) {
    lines.push('## Errors');
    lines.push('');
    for (const err of result.errors) {
      lines.push(`- ${err}`);
    }
    lines.push('');
  }

  lines.push(`_Generated at ${new Date().toISOString()}_`);

  return lines.join('\n');
}
