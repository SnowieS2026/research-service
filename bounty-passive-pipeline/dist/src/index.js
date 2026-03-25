import { loadConfig } from './config.js';
import { MetadataBrowser } from './browser/MetadataBrowser.js';
import { SnapshotManager } from './storage/SnapshotManager.js';
import { Reporter } from './Reporter.js';
import { Scheduler, sleep } from './Scheduler.js';
import { BountyDB } from './storage/BountyDB.js';
import { RunStateManager } from './storage/RunState.js';
import { discoverPrograms } from './ProgramDiscovery.js';
import { seedFromTargets } from './SeedingDiscovery.js';
import { supportedPlatforms, getAdapter } from './browser/parsers/PlatformAdapters.js';
import { Logger } from './Logger.js';
import { runParallelScan } from './scanner/ParallelScanner.js';
import path from 'path';
import fs from 'fs';
const LOG = new Logger('Pipeline');
function parseArgs() {
    const args = process.argv.slice(2);
    if (args.includes('--list-platforms')) {
        return { mode: 'list-platforms' };
    }
    if (args.includes('--discover-only')) {
        return { mode: 'discover-only' };
    }
    const scan = args.includes('--scan');
    if (args.includes('--once')) {
        return { mode: 'once', scan };
    }
    const programIdx = args.indexOf('--program');
    if (programIdx !== -1 && args[programIdx + 1]) {
        return { mode: 'single-program', programUrl: args[programIdx + 1], scan };
    }
    const platformIdx = args.indexOf('--platform');
    if (platformIdx !== -1 && args[platformIdx + 1]) {
        return { mode: 'single-platform', platform: args[platformIdx + 1], scan };
    }
    const agentIdx = args.indexOf('--agent');
    if (agentIdx !== -1 && args[agentIdx + 1]) {
        return { mode: 'agent', agentName: args[agentIdx + 1] };
    }
    const targetsIdx = args.indexOf('--targets');
    const targetUrls = targetsIdx !== -1 ? args.slice(targetsIdx + 1).filter((a) => !a.startsWith('--')) : undefined;
    const osintIdx = args.indexOf('--osint');
    if (osintIdx !== -1 && args[osintIdx + 1]) {
        return { mode: 'osint', osintType: args[osintIdx + 1], osintTarget: args[osintIdx + 2] };
    }
    return { mode: 'watch', scan };
}
async function runPipeline(cfg, cli) {
    const startTime = Date.now();
    const browser = new MetadataBrowser();
    const snapshotMgr = new SnapshotManager();
    const runState = new RunStateManager();
    let db;
    await browser.init();
    let runId = -1;
    if (cfg.ENABLE_DB) {
        db = new BountyDB(path.join(process.cwd(), 'logs', 'bounty.db'));
        runId = db.insertRun('all', 0, 0, 0, 0);
    }
    const reporter = new Reporter({ config: cfg, runId, db });
    let totalPrograms = 0;
    let totalChanges = 0;
    let totalReports = 0;
    const discoveredUrls = [];
    const allPlatforms = cfg.PLATFORM_ADAPTERS;
    for (const platform of allPlatforms) {
        // Discover programs from platform listing
        try {
            const result = await discoverPlatformPrograms(platform);
            discoveredUrls.push(...result);
        }
        catch (err) {
            LOG.warn(`Program discovery failed for ${platform}: ${err}`);
        }
    }
    // Filter out non-program URLs from discovery results (sign-in, listings, etc.)
    const PROGRAM_PATH_PREFIXES = ['/engagements/', '/programs/'];
    const filteredUrls = discoveredUrls.filter((url) => {
        const u = new URL(url);
        const path = u.pathname;
        // Must have a program path segment
        return PROGRAM_PATH_PREFIXES.some((p) => path.includes(p)) &&
            !path.includes('/user/') &&
            !path.includes('/sign_in') &&
            !path.includes('/login') &&
            !path.includes('/signup') &&
            !path.includes('/featured') &&
            !path.includes('/staff-picks') &&
            !path.includes('/settings') &&
            !path.includes('/search');
    });
    // Seed from explicit TARGET_PROGRAMS
    const seeded = seedFromTargets(cfg.TARGET_PROGRAMS);
    for (const seed of seeded) {
        if (!filteredUrls.includes(seed.url)) {
            filteredUrls.push(seed.url);
        }
    }
    totalPrograms = filteredUrls.length;
    LOG.log(`Pipeline: ${totalPrograms} programs to process`);
    const scanTargets = [];
    console.info(`[DEBUG] DRY_RUN=${cfg.DRY_RUN} scan=${cli.scan}`);
    for (const programUrl of discoveredUrls) {
        const platform = detectPlatform(programUrl);
        if (!platform || !allPlatforms.includes(platform)) {
            LOG.warn(`Skipping unsupported platform for: ${programUrl}`);
            continue;
        }
        try {
            const notification = await fetchAndDiff(browser, snapshotMgr, platform, programUrl);
            if (notification) {
                const hasChanges = notification.diff.addedFields.length > 0 ||
                    notification.diff.removedFields.length > 0 ||
                    notification.diff.changedFields.length > 0;
                if (hasChanges || notification.diff.oldHash === notification.diff.newHash) {
                    totalChanges++;
                    const paths = await reporter.process(notification);
                    if (paths) {
                        totalReports++;
                    }
                }
                // Always collect scope assets for active scanning (every tick, not just on changes)
                if (cli.scan) {
                    console.info(`[SCAN] ${programUrl} → ${notification.scope_assets.length} scope assets: ${JSON.stringify(notification.scope_assets.slice(0, 3))}`);
                    scanTargets.push(...notification.scope_assets);
                }
                runState.recordSnapshot(programUrl, notification.diff.newHash);
            }
            else {
                console.info(`[SCAN] ${programUrl} → NO NOTIFICATION (null)`);
            }
            // Rate limiting between programs (200ms for Bugcrowd/HackerOne listing pages, faster than the 2s config)
            if (cfg.RATE_LIMIT_DELAY_MS > 0) {
                await sleep(200);
            }
        }
        catch (err) {
            LOG.error(`Error processing ${programUrl}: ${err}`);
        }
    }
    console.info(`[SCAN] Total scan targets collected: ${scanTargets.length}`);
    // ── Active scanning ─────────────────────────────────────────────────────────
    if (cli.scan && scanTargets.length > 0 && !cfg.DRY_RUN) {
        await runActiveScan(cfg, scanTargets);
    }
    else if (cli.scan && scanTargets.length > 0 && cfg.DRY_RUN) {
        LOG.log(`[DRY_RUN] Would run active scan on ${scanTargets.length} targets`);
    }
    runState.recordProgramsSeen(discoveredUrls);
    runState.recordRun();
    const durationMs = Date.now() - startTime;
    if (db && cfg.ENABLE_DB && runId >= 0) {
        // Update run stats via direct SQLite (quick fix – insert new run record for stats)
        try {
            db.insertRun('all', totalPrograms, totalChanges, totalReports, durationMs);
        }
        catch {
            // ignore
        }
    }
    LOG.log(`Pipeline summary: ${totalPrograms} programs scanned, ` +
        `${totalChanges} changes found, ${totalReports} reports generated ` +
        `in ${durationMs}ms`);
    await browser.close();
}
async function discoverPlatformPrograms(platform) {
    const browser = new MetadataBrowser();
    await browser.init();
    try {
        const result = await discoverPrograms(platform);
        return result.programs;
    }
    finally {
        await browser.close();
    }
}
async function fetchAndDiff(browser, snapshotMgr, platform, programUrl) {
    const page = await browser.navigate(programUrl);
    const parser = getAdapter(platform);
    const program = await parser.parse(page, programUrl);
    const identifier = `${platform}-${extractProgramSlug(programUrl)}`;
    // Store new snapshot
    const newHash = await snapshotMgr.store(program, identifier);
    // Load previous snapshot
    const hashes = await snapshotMgr.list(identifier);
    const prevHash = hashes.find((h) => h !== newHash);
    const diffResult = {
        oldHash: prevHash ?? newHash,
        newHash,
        addedFields: [],
        removedFields: [],
        changedFields: []
    };
    let prevProg;
    if (prevHash && prevHash !== newHash) {
        prevProg = await snapshotMgr.load(identifier, prevHash);
        const { diffPrograms } = await import('./diff/ProgramDiffer.js');
        const diff = diffPrograms(prevProg, program, prevHash, newHash, identifier);
        diffResult.addedFields = diff.addedFields.map((f) => f.field);
        diffResult.removedFields = diff.removedFields.map((f) => f.field);
        diffResult.changedFields = diff.changedFields.map((f) => f.field);
    }
    return {
        ...program,
        prevProgram: prevProg,
        diff: diffResult
    };
}
function detectPlatform(url) {
    const lower = url.toLowerCase();
    if (lower.includes('bugcrowd.com'))
        return 'bugcrowd';
    if (lower.includes('hackerone.com'))
        return 'hackerone';
    if (lower.includes('intigriti.com'))
        return 'intigriti';
    if (lower.includes('standoff365.com'))
        return 'standoff365';
    return null;
}
function extractProgramSlug(url) {
    try {
        const u = new URL(url);
        const parts = u.pathname.split('/').filter(Boolean);
        if (parts.length >= 2 && parts[0] === 'programs') {
            return parts[1];
        }
        if (parts.length >= 1) {
            return parts[parts.length - 1];
        }
    }
    catch {
        // fall through
    }
    return 'unknown';
}
async function runDiscovery(cfg) {
    LOG.log('Running discovery pass…');
    const allPrograms = [];
    for (const platform of cfg.PLATFORM_ADAPTERS) {
        try {
            const result = await discoverPrograms(platform);
            allPrograms.push(...result.programs);
            LOG.log(`Discovery: ${result.programs.length} programs found on ${platform}`);
        }
        catch (err) {
            LOG.error(`Discovery failed for ${platform}: ${err}`);
        }
    }
    // Update TARGET_PROGRAMS in config file
    if (allPrograms.length > 0) {
        const configPath = path.join(process.cwd(), 'config.json');
        try {
            const raw = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(raw);
            config.TARGET_PROGRAMS = [...new Set(allPrograms)];
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
            LOG.log(`Discovery complete: ${allPrograms.length} programs seeded to config`);
        }
        catch (err) {
            LOG.error(`Failed to update config with discovered programs: ${err}`);
        }
    }
}
// ── Active scanning ────────────────────────────────────────────────────────────
async function runActiveScan(cfg, targets) {
    LOG.log(`Starting active scan on ${targets.length} targets…`);
    const db = cfg.ENABLE_DB ? new BountyDB(path.join(process.cwd(), 'logs', 'bounty.db')) : undefined;
    try {
        // Use ParallelScanner – each tool runs as an independent process so a slow
        // SQL scan can't timeout fast tools like XSS or nuclei
        const result = await runParallelScan(targets, {
            dryRun: cfg.SCANNER_DRY_RUN ?? true,
            tools: {
                dalfox: cfg.DALFOX_ENABLED ?? true,
                sqlmap: cfg.SQLMAP_ENABLED ?? true,
                nuclei: cfg.NUCLEI_ENABLED ?? true,
                ssrf: cfg.SSRF_ENABLED ?? true,
                auth: cfg.AUTH_ENABLED ?? true,
                api: cfg.API_ENABLED ?? true,
                subfinder: cfg.SUBFINDER_ENABLED ?? false,
                gau: cfg.GAU_ENABLED ?? false,
                httpx: cfg.HTTPX_ENABLED ?? false,
                gitleaks: cfg.GITLEAKS_ENABLED ?? false
            },
            nucleiTemplates: cfg.NUCLEI_TEMPLATES_DIR ?? '',
            rateLimitMs: cfg.RATE_LIMIT_DELAY_MS ?? 2000,
            timeoutPerTarget: cfg.SCANNER_TIMEOUT_MS ?? 300_000,
            maxTargetsPerRun: cfg.SCANNER_MAX_TARGETS ?? 20,
            outputDir: cfg.REPORTS_DIR ?? 'reports',
            sqlmapLevel: 2,
            sqlmapRisk: 1
        }, db);
        await deliverScanReport(result, cfg, db);
    }
    finally {
        db?.close();
    }
}
async function deliverScanReport(result, cfg, _db) {
    if (result.findings.length === 0) {
        LOG.log('Active scan complete – no findings');
        return;
    }
    const today = new Date().toISOString().split('T')[0];
    const hash = result.scanId.slice(0, 12);
    const dir = path.join(cfg.REPORTS_DIR ?? 'reports', today);
    fs.mkdirSync(dir, { recursive: true });
    const mdPath = path.join(dir, `scan-${hash}.md`);
    const jsonPath = path.join(dir, `scan-${hash}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf8');
    // Write markdown summary
    const lines = [];
    lines.push(`# Active Scan Report – ${result.startedAt.split('T')[0]}`);
    lines.push('');
    lines.push('## Summary');
    lines.push(`| Metric | Value |`);
    lines.push(`| --- | --- |`);
    lines.push(`| Scan ID | ${result.scanId} |`);
    lines.push(`| Duration | ${Math.round(result.duration / 1000)}s |`);
    lines.push(`| Targets | ${result.targetsScanned} |`);
    lines.push(`| Total Findings | ${result.findings.length} |`);
    lines.push('');
    lines.push('### Findings by Severity');
    const bySev = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    for (const f of result.findings) {
        if (f.severity in bySev)
            bySev[f.severity]++;
    }
    lines.push(`| Severity | Count |`);
    lines.push(`| --- | --- |`);
    for (const [sev, count] of Object.entries(bySev)) {
        if (count > 0)
            lines.push(`| ${sev} | ${count} |`);
    }
    lines.push('');
    lines.push('### Findings by Type');
    lines.push(`| Type | Count |`);
    lines.push(`| --- | --- |`);
    lines.push(`| XSS | ${result.summary.xss} |`);
    lines.push(`| SQL Injection | ${result.summary.sql} |`);
    lines.push(`| SSRF | ${result.summary.ssrf} |`);
    lines.push(`| IDOR | ${result.summary.idor} |`);
    lines.push(`| Auth | ${result.summary.auth} |`);
    lines.push(`| Info/Nuclei | ${result.summary.info} |`);
    lines.push('');
    // Stack detected
    const techs = Object.entries(result.stackDetected).sort((a, b) => b[1] - a[1]);
    if (techs.length > 0) {
        lines.push('### Stack Detected');
        for (const [tech, count] of techs)
            lines.push(`- **${tech}** (${count})`);
        lines.push('');
    }
    // Top 20 detailed findings
    const sorted = [...result.findings].sort((a, b) => {
        const o = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return (o[a.severity] ?? 4) - (o[b.severity] ?? 4);
    });
    lines.push('### Detailed Findings (Top 20)');
    lines.push('');
    for (let i = 0; i < Math.min(sorted.length, 20); i++) {
        const f = sorted[i];
        const emoji = { CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🟡', LOW: '🟢' };
        const param = f.param ?? '';
        const paramStr = param ? ` — \`${param}\`` : '';
        lines.push(`#### ${emoji[f.severity] ?? '⚪'} [${f.severity}] ${f.type.toUpperCase()} at \`${f.url}\`${paramStr}`);
        lines.push('');
        lines.push(`- **CVSS**: ${f.cvss} | **Tool**: ${f.tool}`);
        lines.push(`- **Description**: ${f.description}`);
        lines.push(`- **Evidence**: ${f.evidence}`);
        lines.push('');
    }
    fs.writeFileSync(mdPath, lines.join('\n'), 'utf8');
    LOG.log(`Active scan report saved: ${mdPath}`);
    // Send Telegram summary
    if (cfg.ENABLE_TELEGRAM && !cfg.DRY_RUN) {
        const summary = [
            `🛡️ *Active Scan Complete*`,
            `Targets: ${result.targetsScanned} | Findings: ${result.findings.length}`,
            `🔴 ${bySev.CRITICAL} 🟠 ${bySev.HIGH} 🟡 ${bySev.MEDIUM} 🟢 ${bySev.LOW}`,
            '',
            'Top findings:',
            ...sorted.slice(0, 5).map(f => `${f.severity === 'CRITICAL' ? '🔴' : f.severity === 'HIGH' ? '🟠' : '🟡'} [${f.severity}] ${f.type} – ${f.url.substring(0, 50)}`),
            '',
            `📄 Full report: \`${mdPath}\``
        ].join('\n');
        try {
            const { sessions_send } = await import('./sessions.js');
            await sessions_send('agent:main:main', summary);
        }
        catch (err) {
            LOG.error(`Failed to send scan Telegram notification: ${err}`);
        }
    }
}
// ── Main ──────────────────────────────────────────────────────────────────────
const cfg = loadConfig();
const cli = parseArgs();
switch (cli.mode) {
    case 'list-platforms': {
        const platforms = supportedPlatforms();
        console.info('Supported platforms:');
        for (const p of platforms) {
            console.info(`  - ${p}`);
        }
        break;
    }
    case 'discover-only': {
        await runDiscovery(cfg);
        break;
    }
    case 'once': {
        try {
            await runPipeline(cfg, cli);
        }
        catch (err) {
            console.error('[FATAL] runOnce error:', err);
            process.exit(1);
        }
        break;
    }
    case 'single-program': {
        const url = cli.programUrl;
        const platform = detectPlatform(url);
        if (!platform) {
            LOG.error(`Cannot determine platform for URL: ${url}`);
            process.exit(1);
        }
        // OKTA has wildcard scope — expand to real subdomains directly
        const oktaTargets = cli.scan
            ? [
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
            ]
            : [];
        if (oktaTargets.length > 0) {
            LOG.log(`OKTA wildcard scope: scanning ${oktaTargets.length} expanded targets`);
            await runActiveScan(cfg, oktaTargets);
        }
        else {
            cfg.PLATFORM_ADAPTERS = [platform];
            cfg.TARGET_PROGRAMS = [url];
            await runPipeline(cfg, cli);
        }
        break;
    }
    case 'single-platform': {
        const platform = cli.platform;
        if (!supportedPlatforms().includes(platform)) {
            LOG.error(`Unknown platform: ${platform}`);
            process.exit(1);
        }
        cfg.PLATFORM_ADAPTERS = [platform];
        await runPipeline(cfg, cli);
        break;
    }
    case 'watch': {
        LOG.log(`Starting in watch mode, interval=${cfg.WATCH_INTERVAL_MS}ms`);
        const scheduler = new Scheduler({
            intervalMs: cfg.WATCH_INTERVAL_MS,
            onTick: async () => {
                await runPipeline(cfg, cli);
            }
        });
        scheduler.start();
        break;
    }
    case 'osint': {
        const { runOsint } = await import('./osint/index.js');
        const { deliverOsintResult } = await import('./osint/deliver.js');
        const type = cli.osintType;
        const target = cli.osintTarget ?? '';
        if (!type || !target) {
            LOG.error('Usage: npm start -- --osint <type> <target>');
            process.exit(1);
        }
        const result = await runOsint({ type, target, flags: [] });
        await deliverOsintResult(result);
        break;
    }
    case 'agent': {
        // Run a single agent or all agents via AgentRunner
        const { CoordinatorAgent } = await import('./agents/CoordinatorAgent.js');
        const { DiscoveryAgent } = await import('./agents/DiscoveryAgent.js');
        const { BrowserAgent } = await import('./agents/BrowserAgent.js');
        const { ScannerAgent } = await import('./agents/ScannerAgent.js');
        const { ReporterAgent } = await import('./agents/ReporterAgent.js');
        const { RepairAgent } = await import('./agents/RepairAgent.js');
        const { BountyDB } = await import('./storage/BountyDB.js');
        const PIPELINE_ROOT = process.cwd();
        let db;
        try {
            db = new BountyDB(path.join(PIPELINE_ROOT, 'logs', 'bounty.db'));
        }
        catch { /* no DB */ }
        async function shutdownAgents(agents) {
            await Promise.allSettled(agents.map((a) => a.stop()));
            db?.close();
        }
        async function createAllAgents() {
            const coordinator = new CoordinatorAgent({ watchIntervalMs: 1_800_000, db, pipelineRoot: PIPELINE_ROOT });
            const discovery = new DiscoveryAgent(PIPELINE_ROOT);
            const browser = new BrowserAgent(PIPELINE_ROOT);
            const scanner = new ScannerAgent(PIPELINE_ROOT);
            const reporter = new ReporterAgent(PIPELINE_ROOT);
            const repair = new RepairAgent(PIPELINE_ROOT);
            await coordinator.setup();
            await discovery.setup();
            await browser.setup();
            await scanner.setup();
            await reporter.setup();
            await repair.setup();
            coordinator.start();
            discovery.start();
            browser.start();
            scanner.start();
            reporter.start();
            repair.start();
            return [coordinator, discovery, browser, scanner, reporter, repair];
        }
        if (cli.agentName) {
            let dbInstance;
            try {
                dbInstance = new BountyDB(path.join(PIPELINE_ROOT, 'logs', 'bounty.db'));
            }
            catch { /* no DB */ }
            const agents = {
                coordinator: new CoordinatorAgent({ pipelineRoot: PIPELINE_ROOT, db: dbInstance }),
                discovery: new DiscoveryAgent(PIPELINE_ROOT),
                browser: new BrowserAgent(PIPELINE_ROOT),
                scanner: new ScannerAgent(PIPELINE_ROOT),
                reporter: new ReporterAgent(PIPELINE_ROOT),
                repair: new RepairAgent(PIPELINE_ROOT)
            };
            const agent = agents[cli.agentName];
            if (!agent) {
                LOG.error(`Unknown agent: ${cli.agentName}`);
                process.exit(1);
            }
            await agent.setup();
            agent.start();
            LOG.log(`Agent '${cli.agentName}' started`);
            await new Promise((resolve) => {
                process.on('SIGTERM', async () => { await agent.stop(); resolve(); });
                process.on('SIGINT', async () => { await agent.stop(); resolve(); });
            });
        }
        else {
            // Run all agents
            const allAgents = await createAllAgents();
            LOG.log('All agents started in unified mode');
            await new Promise((resolve) => {
                process.on('SIGTERM', async () => { await shutdownAgents(allAgents); resolve(); });
                process.on('SIGINT', async () => { await shutdownAgents(allAgents); resolve(); });
            });
        }
        break;
    }
}
