/**
 * GauScanner – Get All URLs from web archives (gau).
 * Runs `gau --subs <domain>` for each scope domain to fetch historically
 * scraped URLs from CommonCrawl, Wayback Machine, AlienVault OTX, etc.
 * Filters to HTML/JSON/API paths (no images, CSS, fonts, etc.).
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
import { type ScannerConfig } from './ScannerOrchestrator.js';
import { type InfoFinding, buildFindingId } from './ScanResult.js';
import { Logger } from '../Logger.js';
import { isToolAvailable } from './tool-utils.js';
import path from 'path';

const execFileP = promisify(execFile);
const LOG = new Logger('GauScanner');

// Extensions we want to keep (HTML, JSON, API, JS)
const INTERESTING_EXTENSIONS = new Set([
  '', '.html', '.htm', '.xhtml', '.xml',
  '.json', '.jsonp', '.js', '.ts',
  '.php', '.asp', '.aspx', '.jsp', '.jspx', '.do', '.action',
  '.yaml', '.yml', '.txt', '.csv',
  '.graphql', '.grpc'
]);

// Extensions to skip (static assets)
const SKIP_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.bmp', '.tiff',
  '.css', '.scss', '.sass', '.less', '.styl',
  '.woff', '.woff2', '.ttf', '.otf', '.eot', '.font',
  '.mp4', '.mp3', '.webm', '.wav', '.ogg', '.flac', '.avi', '.mov',
  '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z', '.bz2',
  '.exe', '.dmg', '.app', '.msi', '.deb', '.rpm',
  '.bin', '.dat', '.dump', '.sql', '.bak'
]);

function isInterestingUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const pathname = u.pathname.toLowerCase();

    // Skip common static asset extensions
    for (const ext of SKIP_EXTENSIONS) {
      if (pathname.endsWith(ext)) return false;
    }

    // Keep if no extension (e.g. /api/users) or interesting extension
    const lastSegment = pathname.split('/').pop() ?? '';
    const dotIdx = lastSegment.lastIndexOf('.');
    const ext = dotIdx >= 0 ? lastSegment.slice(dotIdx) : '';

    if (ext === '') return true; // no extension → likely a page or API path
    return INTERESTING_EXTENSIONS.has(ext);
  } catch {
    return false;
  }
}

/**
 * Extract the base domain from a scope asset URL.
 * e.g. https://*.okta.com/ or https://okta.com/ → okta.com
 */
function extractBaseDomain(url: string): string | null {
  try {
    const u = new URL(url);
    const hostname = u.hostname.toLowerCase();
    const base = hostname.startsWith('*.') ? hostname.slice(2) : hostname;
    if (!base.includes('.') || base.split('.').length < 2) return null;
    return base;
  } catch {
    return null;
  }
}

/**
 * Run gau for a single domain.
 * Returns an array of discovered URLs.
 */
async function runGau(domain: string, timeoutMs = 60_000): Promise<string[]> {
  const hasGau = await isToolAvailable('gau');
  if (!hasGau) {
    LOG.warn('gau not available – skipping URL enumeration');
    return [];
  }

  const args = ['--subs', domain];

  try {
    const { stdout } = await execFileP('gau', args, { signal: AbortSignal.timeout(timeoutMs) });
    const urls = stdout.split('\n').map((l) => l.trim()).filter(Boolean);
    return urls;
  } catch (err) {
    const e = err as Error & { name?: string; code?: string };
    if (e.name === 'TimeoutError' || e.code === 'ETIMEDOUT') {
      LOG.warn(`gau timeout on ${domain}`);
    }
    // gau exits non-zero when no results found – that's fine
    return [];
  }
}

/**
 * Scan targets for archived URLs using gau.
 * Returns info-severity findings for discovered endpoints.
 */
export async function scanGau(
  targets: string[],
  _stack: unknown,
  config: ScannerConfig
): Promise<InfoFinding[]> {
  const findings: InfoFinding[] = [];

  // Extract unique base domains from scope assets
  const baseDomains = new Set<string>();
  for (const target of targets) {
    try {
      new URL(target);
      const base = extractBaseDomain(target);
      if (base) baseDomains.add(base);
    } catch {
      // skip non-URL targets
    }
  }

  LOG.log(`GauScanner: ${baseDomains.size} base domains to query`);

  for (const domain of baseDomains) {
    if (config.dryRun) {
      LOG.log(`[DRY_RUN] gau --subs ${domain}`);
      continue;
    }

    const urls = await runGau(domain, config.timeoutPerTarget ?? 60_000);

    // Filter to interesting URLs
    const interesting = urls.filter(isInterestingUrl);
    LOG.log(`GauScanner: ${domain} → ${urls.length} total URLs, ${interesting.length} interesting`);

    for (const url of interesting) {
      findings.push({
        id: buildFindingId(url, '', 'info'),
        url,
        type: 'info',
        severity: 'LOW',
        cvss: 0,
        tool: 'gau',
        description: `Archived URL discovered: ${url}`,
        evidence: `Found via gau (CommonCrawl/Wayback/AlienVault OTX) for ${domain}`,
        createdAt: new Date().toISOString(),
        references: []
      });
    }

    // Rate limit between domains
    await new Promise((r) => setTimeout(r, config.rateLimitMs));
  }

  LOG.log(`GauScanner: ${findings.length} URL findings`);
  return findings;
}
