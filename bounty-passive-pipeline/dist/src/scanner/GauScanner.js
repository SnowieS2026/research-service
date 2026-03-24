import { buildFindingId } from './ScanResult.js';
import { Logger } from '../Logger.js';
import { isToolAvailable } from './tool-utils.js';
import { spawn } from 'child_process';
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
function isInterestingUrl(url) {
    try {
        const u = new URL(url);
        const pathname = u.pathname.toLowerCase();
        for (const ext of SKIP_EXTENSIONS) {
            if (pathname.endsWith(ext))
                return false;
        }
        const lastSegment = pathname.split('/').pop() ?? '';
        const dotIdx = lastSegment.lastIndexOf('.');
        const ext = dotIdx >= 0 ? lastSegment.slice(dotIdx) : '';
        if (ext === '')
            return true;
        return INTERESTING_EXTENSIONS.has(ext);
    }
    catch {
        return false;
    }
}
function extractBaseDomain(url) {
    try {
        const u = new URL(url);
        const hostname = u.hostname.toLowerCase();
        const base = hostname.startsWith('*.') ? hostname.slice(2) : hostname;
        if (!base.includes('.') || base.split('.').length < 2)
            return null;
        return base;
    }
    catch {
        return null;
    }
}
/** Gau binary path */
const GAU_BIN = 'C:\\Users\\bryan\\go\\bin\\gau.exe';
/**
 * Run gau for a single domain.
 * Uses spawn() directly with event-based stdout collection.
 * gau requires --providers flag — without it, defaults fail and produce 0 results.
 */
async function runGau(domain, timeoutMs = 60_000) {
    const hasGau = await isToolAvailable(GAU_BIN);
    if (!hasGau) {
        LOG.warn('gau not available – skipping URL enumeration');
        return [];
    }
    // CRITICAL: --providers is required. Without it, gau produces 0 results.
    const args = [
        '--providers', 'wayback,commoncrawl,otx,urlscan',
        domain
    ];
    return new Promise((resolve) => {
        const chunks = [];
        let killed = false;
        const proc = spawn(GAU_BIN, args, {
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: false,
            windowsHide: true,
        });
        proc.stdout?.on('data', (d) => chunks.push(d));
        // Suppress .gau.toml config warnings on stderr
        proc.stderr?.on('data', (d) => {
            const s = d.toString();
            if (s.includes('.gau.toml'))
                return; // suppress config warning
        });
        const timer = setTimeout(() => {
            killed = true;
            try {
                proc.kill('SIGKILL');
            }
            catch { /* ignore */ }
            LOG.warn(`gau timeout on ${domain}`);
            resolve([]);
        }, timeoutMs);
        proc.on('close', () => {
            if (killed)
                return;
            clearTimeout(timer);
            const stdout = Buffer.concat(chunks).toString('utf8');
            const urls = stdout.split('\n').map((l) => l.trim()).filter(Boolean);
            resolve(urls);
        });
        proc.on('error', () => {
            if (killed)
                return;
            clearTimeout(timer);
            resolve([]);
        });
    });
}
export async function scanGau(targets, _stack, config) {
    const findings = [];
    const baseDomains = new Set();
    for (const raw of targets) {
        const target = typeof raw === 'string' ? raw : raw.url;
        if (!target)
            continue;
        try {
            new URL(target);
        }
        catch {
            continue;
        }
        const base = extractBaseDomain(target);
        if (base)
            baseDomains.add(base);
    }
    LOG.log(`GauScanner: ${baseDomains.size} base domains to query`);
    for (const domain of baseDomains) {
        if (config.dryRun) {
            LOG.log(`[DRY_RUN] gau ${domain}`);
            continue;
        }
        const urls = await runGau(domain, config.timeoutPerTarget ?? 60_000);
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
                evidence: `Found via gau (wayback/commoncrawl/otx/urlscan) for ${domain}`,
                createdAt: new Date().toISOString(),
                references: []
            });
        }
        await new Promise((r) => setTimeout(r, config.rateLimitMs));
    }
    LOG.log(`GauScanner: ${findings.length} URL findings`);
    return findings;
}
