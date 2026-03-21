/**
 * HttpxScanner – fast HTTP probing using ProjectDiscovery's httpx.
 * Takes a list of domains, probes them with httpx for status codes,
 * titles, and other metadata, and returns findings for interesting responses.
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
import { buildFindingId } from './ScanResult.js';
import { Logger } from '../Logger.js';
import { isToolAvailable } from './tool-utils.js';
import path from 'path';
import fs from 'fs';
import os from 'os';
const execFileP = promisify(execFile);
const LOG = new Logger('HttpxScanner');
// Static asset extensions to skip
const STATIC_EXTENSIONS = new Set([
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
    '.css', '.scss', '.sass', '.less',
    '.woff', '.woff2', '.ttf', '.otf', '.eot',
    '.mp4', '.mp3', '.webm', '.wav',
    '.pdf', '.zip', '.tar', '.gz', '.rar',
    '.exe', '.dmg', '.app'
]);
function isStaticAsset(url) {
    try {
        const u = new URL(url);
        return STATIC_EXTENSIONS.has(path.extname(u.pathname).toLowerCase());
    }
    catch {
        return false;
    }
}
// Interesting titles that suggest the page is noteworthy (not a default 404/error page)
const INTERESTING_TITLE_KEYWORDS = new Set([
    'admin', 'dashboard', 'login', 'signin', 'sign in', 'console',
    'cpanel', 'phpmyadmin', 'wp-admin', 'administrator', 'auth',
    'portal', 'management', 'internal', 'private', 'restricted',
    'api', 'graphql', 'swagger', 'openapi', 'docs',
    'debug', 'trace', 'error', 'exception', 'stack',
    'test', 'staging', 'dev', 'develop', 'preview',
    'beta', 'v1', 'v2', 'v3', 'backup', 'old', 'archive',
    'upload', 'files', 'manage', 'settings', 'config',
    'git', '.git', 'svn', 'env', '.env', 'credentials'
]);
function isInterestingTitle(title) {
    if (!title)
        return false;
    const lower = title.toLowerCase();
    // Match any keyword
    return INTERESTING_TITLE_KEYWORDS.has(lower) ||
        INTERESTING_TITLE_KEYWORDS.has(lower.replace(/\s+/g, ''));
}
function isInterestingStatus(statusCode) {
    // Non-200 can be interesting (redirects, auth walls, errors with content)
    // 404 is expected for most URLs – skip it
    // 3xx (except 301/302 to interesting locations), 4xx (except 404), 5xx
    if (statusCode === 404)
        return false;
    if (statusCode >= 500)
        return true; // 5xx often expose debug/error pages
    if (statusCode >= 400 && statusCode < 500)
        return true; // 401, 403, etc. can be interesting
    if (statusCode >= 300 && statusCode < 400)
        return true; // redirects
    return false;
}
/**
 * Probe a list of domains with httpx.
 * Returns parsed httpx results.
 */
async function runHttpx(domains, timeoutMs = 120_000) {
    const hasHttpx = await isToolAvailable('httpx');
    if (!hasHttpx) {
        LOG.warn('httpx not available – skipping HTTP probing');
        return [];
    }
    const tmpDir = os.tmpdir();
    const inFile = path.join(tmpDir, `httpx-in-${Date.now()}.txt`);
    const outFile = path.join(tmpDir, `httpx-out-${Date.now()}.jsonl`);
    // Write domains to input file (one per line)
    await fs.promises.writeFile(inFile, domains.join('\n'), 'utf8');
    const args = [
        '-l', inFile,
        '-title', '-status-code', '-silent',
        '-json', '-o', outFile
    ];
    try {
        await execFileP('httpx', args, { signal: AbortSignal.timeout(timeoutMs) });
    }
    catch (err) {
        const e = err;
        if (e.name === 'TimeoutError' || e.code === 'ETIMEDOUT') {
            LOG.warn(`httpx timeout`);
        }
        // Non-zero exit is expected
    }
    const results = [];
    try {
        const content = await fs.promises.readFile(outFile, 'utf8');
        for (const line of content.split('\n').filter(Boolean)) {
            try {
                const parsed = JSON.parse(line);
                results.push({
                    url: parsed.url ?? parsed.input ?? '',
                    statusCode: parsed.status_code ?? parsed.statuscode ?? 0,
                    title: parsed.title ?? parsed.title_text ?? null,
                    finalUrl: parsed.final_url ?? parsed.finalurl ?? undefined
                });
            }
            catch {
                // skip malformed lines
            }
        }
    }
    catch {
        // No output file
    }
    // Cleanup
    await fs.promises.unlink(inFile).catch(() => { });
    await fs.promises.unlink(outFile).catch(() => { });
    return results;
}
/**
 * Extract base domain from a scope asset.
 */
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
/**
 * Scan targets with httpx for fast HTTP probing.
 * Returns info-severity findings for URLs with interesting status codes or titles.
 */
export async function scanHttpx(targets, _stack, config) {
    const findings = [];
    // Filter to URL-like scope assets
    const urlTargets = targets.filter((t) => {
        try {
            new URL(t);
            return !isStaticAsset(t) && !t.startsWith('git@') && !t.includes(':');
        }
        catch {
            return false;
        }
    });
    // Extract unique base domains from wildcard scopes
    const baseDomains = new Set();
    for (const target of urlTargets) {
        const base = extractBaseDomain(target);
        if (base)
            baseDomains.add(base);
    }
    LOG.log(`HttpxScanner: probing ${baseDomains.size} base domains`);
    // Convert to http://domain and https://domain variants
    const domainsToProbe = [];
    for (const domain of baseDomains) {
        domainsToProbe.push(`http://${domain}`);
        domainsToProbe.push(`https://${domain}`);
    }
    if (config.dryRun) {
        for (const d of domainsToProbe) {
            LOG.log(`[DRY_RUN] httpx -l ${d}`);
        }
        return [];
    }
    const results = await runHttpx(domainsToProbe, config.timeoutPerTarget ?? 120_000);
    for (const result of results) {
        if (!result.url)
            continue;
        const url = result.finalUrl ?? result.url;
        // Skip static assets
        if (isStaticAsset(url))
            continue;
        const isInteresting = isInterestingStatus(result.statusCode) || isInterestingTitle(result.title);
        if (isInteresting) {
            findings.push({
                id: buildFindingId(url, '', 'info'),
                url,
                type: 'info',
                severity: 'LOW',
                cvss: 0,
                tool: 'httpx',
                description: `HTTP probing: ${result.statusCode}${result.title ? ` – ${result.title}` : ''} at ${url}`,
                evidence: `httpx found ${result.statusCode}${result.title ? ` title="${result.title}"` : ''} for ${url}`,
                createdAt: new Date().toISOString(),
                references: []
            });
        }
    }
    LOG.log(`HttpxScanner: ${findings.length} interesting HTTP findings`);
    return findings;
}
