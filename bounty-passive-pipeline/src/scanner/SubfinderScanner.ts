/**
 * Subfinder scanner – passive subdomain enumeration using ProjectDiscovery's subfinder.
 * Runs against each wildcard scope domain (e.g. *.okta.com → okta.com).
 * Returns discovered subdomains as info-severity findings.
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
import { type ScannerConfig } from './ScannerOrchestrator.js';
import { type InfoFinding, buildFindingId } from './ScanResult.js';
import { Logger } from '../Logger.js';
import { isToolAvailable } from './tool-utils.js';
import path from 'path';
import fs from 'fs';
import os from 'os';

const execFileP = promisify(execFile);
const LOG = new Logger('SubfinderScanner');

// Static asset extensions to skip when filtering scope assets
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

/**
 * Extract the base domain from a scope asset URL.
 * e.g. https://*.okta.com/ or https://okta.com/ → okta.com
 *      https://example.com/path → example.com
 */
function extractBaseDomain(url: string): string | null {
  try {
    const u = new URL(url);
    const hostname = u.hostname.toLowerCase();
    // Strip wildcard prefix
    const base = hostname.startsWith('*.') ? hostname.slice(2) : hostname;
    // Basic sanity check: must have at least one dot
    if (!base.includes('.')) return null;
    // Skip single-label domains (localhost, etc.)
    if (base.split('.').length < 2) return null;
    return base;
  } catch {
    return null;
  }
}

/**
 * Run subfinder for a single domain.
 * Returns an array of subdomain strings.
 */
async function runSubfinder(domain: string, timeoutMs = 60_000): Promise<string[]> {
  const hasSubfinder = await isToolAvailable('subfinder');
  if (!hasSubfinder) {
    LOG.warn('subfinder not available – skipping subdomain enumeration');
    return [];
  }

  const tmpDir = os.tmpdir();
  const outFile = path.join(tmpDir, `subfinder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.txt`);

  const args = ['-d', domain, '-silent', '-o', outFile];

  try {
    await execFileP('subfinder', args, { signal: AbortSignal.timeout(timeoutMs) });
  } catch (err) {
    const e = err as Error & { name?: string; code?: string };
    if (e.name === 'TimeoutError' || e.code === 'ETIMEDOUT') {
      LOG.warn(`subfinder timeout on ${domain}`);
    }
    // Non-zero exit is expected even on success if no subdomains found
  }

  try {
    const content = await fs.promises.readFile(outFile, 'utf8');
    await fs.promises.unlink(outFile).catch(() => {});
    const subdomains = content.split('\n').map((l) => l.trim()).filter(Boolean);
    return subdomains;
  } catch {
    await fs.promises.unlink(outFile).catch(() => {});
    return [];
  }
}

/**
 * Scan targets for subdomains using subfinder.
 * Extracts base domains from wildcard scope assets and runs subfinder against each.
 */
export async function scanSubfinder(
  targets: string[],
  _stack: unknown,
  config: ScannerConfig
): Promise<InfoFinding[]> {
  const findings: InfoFinding[] = [];

  // Filter to only URL-like scope assets (not git:github.com/org/repo)
  const urlTargets = targets.filter((t) => {
    try {
      new URL(t);
      return !isStaticAsset(t) && !t.startsWith('git@') && !t.includes(':');
    } catch {
      return false;
    }
  });

  // Extract unique base domains from wildcard scopes
  const baseDomains = new Set<string>();
  for (const target of urlTargets) {
    const base = extractBaseDomain(target);
    if (base) baseDomains.add(base);
  }

  LOG.log(`SubfinderScanner: ${baseDomains.size} base domains to enumerate`);

  for (const domain of baseDomains) {
    if (config.dryRun) {
      LOG.log(`[DRY_RUN] subfinder -d ${domain}`);
      continue;
    }

    const subdomains = await runSubfinder(domain, config.timeoutPerTarget ?? 60_000);
    LOG.log(`SubfinderScanner: ${domain} → ${subdomains.length} subdomains`);

    for (const subdomain of subdomains) {
      findings.push({
        id: buildFindingId(`https://${subdomain}`, '', 'info'),
        url: `https://${subdomain}`,
        type: 'info',
        severity: 'LOW',
        cvss: 0,
        tool: 'subfinder',
        description: `Subdomain discovered: ${subdomain}`,
        evidence: `Found via passive subdomain enumeration against ${domain}`,
        createdAt: new Date().toISOString(),
        references: []
      });
    }

    // Rate limit between domains
    await new Promise((r) => setTimeout(r, config.rateLimitMs));
  }

  LOG.log(`SubfinderScanner: ${findings.length} subdomain findings`);
  return findings;
}
