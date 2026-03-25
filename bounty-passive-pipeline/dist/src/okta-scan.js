/**
 * okta-scan.js — Dedicated comprehensive OKTA vulnerability scan.
 *
 * Usage:
 *   node dist/src/okta-scan.js                    # full scan (uses okta-probe subdomains)
 *   node dist/src/okta-scan.js --targets ...      # scan specific URLs
 *
 * This bypasses discovery and goes straight to active scanning on
 * the OKTA scope. Subdomains come from Certificate Transparency,
 * DNS enumeration, and the OKTA Bugcrowd scope definition.
 */
import { runParallelScan } from './scanner/ParallelScanner.js';
import { BountyDB } from './storage/BountyDB.js';
import { Logger } from './Logger.js';
import { loadConfig } from './config.js';
import path from 'path';
import fs from 'fs';
const LOG = new Logger('OktaScan');
// ── OKTA scope — expanded from Bugcrowd + manual research ─────────────────────
const OKTA_SCOPE = [
    // Primary domains
    'https://okta.com',
    'https://www.okta.com',
    'https://login.okta.com',
    'https://accounts.okta.com',
    'https://KMq.okta.com',
    'https://developer.okta.com',
    'https://clients.okta.com',
    'https://goto.okta.com',
    'https://preview.okta.com',
    'https://dev.okta.com',
    'https://okta-cx.com',
    'https://www.okta-cx.com',
    'https://KMq.okta-cx.com',
    // OAuth/OIDC endpoints (primary targets)
    'https://okta.com/oauth2/v1/authorize',
    'https://okta.com/oauth2/v1/token',
    'https://okta.com/oauth2/v1/introspect',
    'https://okta.com/oauth2/v1/userinfo',
    'https://okta.com/oauth2/v1/keys',
    'https://okta.com/oauth2/default/.well-known/openid-configuration',
    'https://accounts.okta.com/.well-known/openid-configuration',
    'https://login.okta.com/.well-known/openid-configuration',
    // SAML endpoints
    'https://okta.com/app/-/saml/sso',
    'https://okta.com/app/okta/saml/sso',
    'https://okta.com/app/okta/update-password',
    // API portals
    'https://developer.okta.com/docs/reference/',
    'https://developer.okta.com/api-docs/',
    // Misc endpoints
    'https://okta.com/.well-known/oauth-authorization-server',
    'https://okta.com/.well-known/okta-configuration',
    'https://okta.com/api/v1/',
    'https://okta.com/api/v1/users',
    'https://okta.com/api/v1/groups',
    'https://okta.com/api/v1/apps',
    // IdP endpoints
    'https://okta.com/idp/login',
    'https://okta.com/idp/slo',
    // Legacy
    'https://okta.com/login',
    'https://okta.com/login/do-login',
    'https://okta.com/login/login.htm',
    'https://okta.com/login/sign-in',
    // Password reset
    'https://okta.com/login/password/reset',
    'https://accounts.okta.com/login/password/reset',
    // Account recovery
    'https://okta.com/login/forgot-password',
    'https://okta.com/login/unlock',
    // MFA/SSO
    'https://okta.com/login/sso',
    'https://okta.com/login/mfa',
    'https://okta.com/login/verify',
    // Mobile
    'https://m.okta.com/',
    'https://mobile.okta.com/',
    // Admin
    'https://okta.com/admin/',
    'https://okta.com/oidc/connect/authorize',
    'https://okta.com/oidc/connect/token',
];
// ── Load subdomains discovered by okta-probe.py ────────────────────────────────
function loadProbeSubdomains() {
    const probeFiles = [
        path.join(process.cwd(), 'reports', 'osint', '2026-03-25', 'okta-probe.json'),
        path.join(process.cwd(), 'reports', 'osint', 'latest', 'okta-probe.json'),
    ];
    for (const fp of probeFiles) {
        if (fs.existsSync(fp)) {
            try {
                const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
                if (data.live_hosts && Array.isArray(data.live_hosts)) {
                    LOG.log(`Loaded ${data.live_hosts.length} subdomains from probe report`);
                    return data.live_hosts.map((h) => (h.startsWith('http') ? h : `https://${h}`));
                }
            }
            catch { /* ignore */ }
        }
    }
    return [];
}
// ── Build final target list ────────────────────────────────────────────────────
function buildTargets(args) {
    const fromArgs = args.filter((a) => a.startsWith('http'));
    const fromScope = OKTA_SCOPE;
    const fromProbe = loadProbeSubdomains();
    const all = [...fromArgs, ...fromScope, ...fromProbe];
    const seen = new Set();
    const unique = [];
    for (const t of all) {
        if (seen.has(t))
            continue;
        seen.add(t);
        unique.push(t);
    }
    LOG.log(`Total targets: ${unique.length} (args=${fromArgs.length}, scope=${fromScope.length}, probe=${fromProbe.length})`);
    return unique;
}
// ── Run scan ─────────────────────────────────────────────────────────────────
async function runScan(targets) {
    if (targets.length === 0) {
        LOG.error('No targets to scan');
        return;
    }
    // Deduplicate and filter
    const filtered = targets.filter((t) => {
        try {
            new URL(t);
            return true;
        }
        catch {
            return false;
        }
    });
    const unique = [...new Set(filtered)];
    LOG.log(`Scanning ${unique.length} unique targets`);
    const cfg = loadConfig();
    const db = new BountyDB(path.join(process.cwd(), 'logs', 'bounty.db'));
    try {
        const result = await runParallelScan(unique, {
            dryRun: false,
            tools: {
                dalfox: true,
                sqlmap: true,
                nuclei: true,
                ssrf: true,
                auth: true,
                api: true,
                subfinder: true,
                gau: true,
                httpx: true,
                gitleaks: false // No source code repos in scope
            },
            nucleiTemplates: cfg.NUCLEI_TEMPLATES_DIR ?? '',
            rateLimitMs: 1_000, // Slower for OKTA to be respectful
            timeoutPerTarget: 300_000,
            maxTargetsPerRun: Math.min(unique.length, 20),
            outputDir: path.join(process.cwd(), 'reports', 'osint', '2026-03-25'),
            sqlmapLevel: 2,
            sqlmapRisk: 1
        }, db);
        // Save report
        const today = new Date().toISOString().split('T')[0];
        const dir = path.join(process.cwd(), 'reports', 'osint', today);
        fs.mkdirSync(dir, { recursive: true });
        const hash = result.scanId.slice(0, 12);
        fs.writeFileSync(path.join(dir, `okta-scan-${hash}.json`), JSON.stringify(result, null, 2), 'utf8');
        // Write markdown summary
        const sevEmoji = { CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🟡', LOW: '🟢' };
        const mdLines = [
            `# OKTA Active Scan Report — ${today}`,
            '',
            '## Summary',
            `| Metric | Value |`,
            `| --- | --- |`,
            `| Scan ID | ${result.scanId} |`,
            `| Duration | ${Math.round(result.duration / 1000)}s |`,
            `| Targets | ${result.targetsScanned} |`,
            `| Total Findings | ${result.findings.length} |`,
            '',
            `| Severity | Count |`,
            `| --- | --- |`,
            ...['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => `| ${s} | ${result.findings.filter((f) => f.severity === s).length} |`),
            '',
            '## Findings',
            '',
        ];
        if (result.findings.length > 0) {
            const sorted = [...result.findings].sort((a, b) => {
                const o = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
                return (o[a.severity] ?? 4) - (o[b.severity] ?? 4);
            });
            mdLines.push(`| # | Severity | Type | URL | Description |`);
            mdLines.push(`| --- | --- | --- | --- | --- |`);
            for (let i = 0; i < sorted.length; i++) {
                const f = sorted[i];
                const urlShort = f.url.length > 60 ? f.url.slice(0, 60) + '…' : f.url;
                const desc = f.description.slice(0, 60);
                mdLines.push(`| ${i + 1} | ${f.severity} | ${f.type} | ${urlShort} | ${desc} |`);
            }
            mdLines.push('');
            mdLines.push('## Detailed Findings');
            mdLines.push('');
            for (const f of sorted.slice(0, 30)) {
                const emoji = sevEmoji[f.severity] ?? '⚪';
                const param = f.param ?? '';
                const paramStr = param ? ` (param: ${param})` : '';
                mdLines.push(`### ${emoji} [${f.severity}] ${f.type.toUpperCase()} at \`${f.url}\`${paramStr}`);
                mdLines.push('');
                mdLines.push(`- **CVSS**: ${f.cvss} | **Tool**: ${f.tool}`);
                mdLines.push(`- **Description**: ${f.description}`);
                mdLines.push(`- **Evidence**: ${f.evidence}`);
                if (f.references?.length)
                    mdLines.push(`- **References**: ${f.references.join(', ')}`);
                mdLines.push('');
            }
        }
        else {
            mdLines.push('No findings. Target scope may be well-hardened or scanners may need tuning.');
        }
        mdLines.push(`_Generated at ${new Date().toISOString()}_`);
        const mdPath = path.join(dir, `okta-scan-${hash}.md`);
        fs.writeFileSync(mdPath, mdLines.join('\n'), 'utf8');
        LOG.log(`OKTA scan report: ${mdPath}`);
        console.info(`\n✅ OKTA scan complete: ${result.findings.length} findings\n`);
        const bySev = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
        for (const f of result.findings) {
            if (f.severity in bySev)
                bySev[f.severity]++;
        }
        console.info(`🔴 ${bySev.CRITICAL}  🟠 ${bySev.HIGH}  🟡 ${bySev.MEDIUM}  🟢 ${bySev.LOW}`);
        console.info(`\nReport: ${mdPath}`);
    }
    finally {
        db.close();
    }
}
// ── Main ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const targets = buildTargets(args);
await runScan(targets);
