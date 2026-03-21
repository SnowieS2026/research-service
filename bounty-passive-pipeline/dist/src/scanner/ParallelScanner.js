/**
 * ParallelScanner - runs each scan tool as an independent child process.
 *
 * Architecture:
 * 1. Run discovery ONCE, save endpoints to logs/scan-state.json
 * 2. Spawn one `node run-tool.ts <tool>` child process per enabled scanner
 * 3. Each tool runs independently and writes its results to logs/scan-results/<tool>-result.json
 * 4. Coordinator polls for results and merges when all complete
 *
 * Each child process runs in its own Node.js instance - no shared memory,
 * no one tool's timeout affecting another.
 */
import { DiscoveryScanner, extractQueryParams } from './DiscoveryScanner.js';
import { deduplicateFindings } from './ScanResult.js';
import { Logger } from '../Logger.js';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PIPELINE_ROOT = path.resolve(__dirname, '../../..');
const STATE_FILE = 'logs/scan-state.json';
const RESULTS_DIR = 'logs/scan-results';
const LOG = new Logger('ParallelScanner');
const TOOL_FILES = {
    xss: 'xss-result.json',
    sql: 'sql-result.json',
    ssrf: 'ssrf-result.json',
    auth: 'auth-result.json',
    api: 'api-result.json',
    nuclei: 'nuclei-result.json',
    subfinder: 'subfinder-result.json',
    gau: 'gau-result.json',
    httpx: 'httpx-result.json',
    gitleaks: 'gitleaks-result.json'
};
const RESULT_POLL_MS = 10_000;
const MAX_WAIT_MS = 25 * 60 * 1000;
const SPAWN_DELAY_MS = 2_000;
function getScannerConfig() {
    return {
        dryRun: process.env.SCANNER_DRY_RUN === 'true',
        tools: {
            dalfox: process.env.DALFOX_ENABLED !== 'false',
            sqlmap: process.env.SQLMAP_ENABLED !== 'false',
            nuclei: process.env.NUCLEI_ENABLED !== 'false',
            ssrf: process.env.SSRF_ENABLED !== 'false',
            auth: process.env.AUTH_ENABLED !== 'false',
            api: process.env.API_ENABLED !== 'false',
            subfinder: process.env.SUBFINDER_ENABLED !== 'false',
            gau: process.env.GAU_ENABLED !== 'false',
            httpx: process.env.HTTPX_ENABLED !== 'false',
            gitleaks: process.env.GITLEAKS_ENABLED !== 'false'
        },
        nucleiTemplates: process.env.NUCLEI_TEMPLATES_DIR ?? '',
        rateLimitMs: Number(process.env.RATE_LIMIT_DELAY_MS ?? 2000),
        timeoutPerTarget: Number(process.env.SCANNER_TIMEOUT_MS ?? 300_000),
        maxTargetsPerRun: 10,
        outputDir: path.join(PIPELINE_ROOT, 'reports'),
        sqlmapLevel: 2,
        sqlmapRisk: 1
    };
}
async function readToolResult(tool) {
    const file = path.join(PIPELINE_ROOT, RESULTS_DIR, TOOL_FILES[tool] ?? `${tool}-result.json`);
    try {
        const raw = await fs.promises.readFile(file, 'utf8');
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
async function waitForTool(tool) {
    const deadline = Date.now() + MAX_WAIT_MS;
    while (Date.now() < deadline) {
        const result = await readToolResult(tool);
        if (result)
            return result;
        await new Promise((r) => setTimeout(r, RESULT_POLL_MS));
    }
    return null;
}
/**
 * Spawn a single tool runner as a detached child process.
 */
function spawnTool(tool) {
    const child = spawn('node', [
        path.join(PIPELINE_ROOT, 'dist/src/scanner/run-tool.js'),
        tool
    ], {
        cwd: PIPELINE_ROOT,
        detached: true,
        stdio: 'pipe',
        windowsHide: true,
        env: {
            ...process.env,
            SCANNER_DRY_RUN: 'false',
            DALFOX_ENABLED: 'true',
            SQLMAP_ENABLED: 'true',
            NUCLEI_ENABLED: 'true',
            SSRFS_ENABLED: 'true',
            AUTH_ENABLED: 'true',
            API_ENABLED: 'true'
        }
    });
    child.stdout?.on('data', (chunk) => {
        process.stdout.write(`[${tool}] ${chunk}`);
    });
    child.stderr?.on('data', (chunk) => {
        process.stderr.write(`[${tool}-err] ${chunk}`);
    });
    child.on('error', (err) => {
        LOG.warn(`[ParallelScanner:${tool}] process error: ${err.message}`);
    });
    child.unref();
    LOG.log(`[ParallelScanner] Spawned ${tool} (pid ${child.pid})`);
}
/**
 * Main parallel scan: discovery -> spawn tools -> collect results.
 */
async function runParallelScan(targets, _config, db) {
    const startTime = Date.now();
    const scanId = `scan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const startedAt = new Date().toISOString();
    LOG.log(`[ParallelScanner] Starting scan ${scanId} on ${targets.length} targets`);
    // Setup
    await fs.promises.mkdir(path.join(PIPELINE_ROOT, RESULTS_DIR), { recursive: true });
    // Clear old results
    for (const f of Object.values(TOOL_FILES)) {
        try {
            await fs.promises.unlink(path.join(PIPELINE_ROOT, RESULTS_DIR, f));
        }
        catch { /* noop */ }
    }
    // Discovery (run once)
    const discoveryScanner = new DiscoveryScanner();
    const seen = new Set();
    const filtered = targets.filter((t) => {
        try {
            const n = new URL(t).href;
            if (seen.has(n))
                return false;
            seen.add(n);
            return true;
        }
        catch {
            return false;
        }
    });
    const capped = filtered.slice(0, 10); // max 10 targets
    const discoveryResults = [];
    for (const target of capped) {
        try {
            const results = await discoveryScanner.scan([target], path.join(PIPELINE_ROOT, 'reports'));
            discoveryResults.push(...results);
        }
        catch (err) {
            LOG.warn(`Discovery failed for ${target}: ${err}`);
        }
        await new Promise((r) => setTimeout(r, 2000));
    }
    await discoveryScanner.close();
    // Convert scope assets to endpoints directly
    // Every scope asset becomes a scan target even if DiscoveryScanner found no endpoints.
    // Wildcard scopes (e.g. *.okta.com) will never yield crawled endpoints.
    const scopeEndpoints = capped.map((url) => {
        const params = extractQueryParams(url);
        return {
            url,
            method: 'GET',
            params,
            formFields: [],
            inJS: false,
            source: 'html'
        };
    });
    // Merge crawled endpoints with scope endpoints, deduplicating by URL
    const allEndpoints = [...scopeEndpoints];
    const seenE = new Set(capped);
    for (const result of discoveryResults) {
        for (const ep of result.endpoints) {
            if (!seenE.has(ep.url)) {
                seenE.add(ep.url);
                allEndpoints.push(ep);
            }
        }
    }
    const stackInfos = discoveryResults.map((r) => r.stackInfo);
    // Save shared state
    const sharedState = { scanId, startedAt, targets: capped, endpoints: allEndpoints, stackInfos };
    await fs.promises.writeFile(path.join(PIPELINE_ROOT, STATE_FILE), JSON.stringify(sharedState, null, 2), 'utf8');
    LOG.log(`[ParallelScanner] Discovery done: ${allEndpoints.length} endpoints, ${capped.length} targets`);
    // Spawn tools
    const enabledTools = ['xss', 'sql', 'ssrf', 'auth', 'api', 'nuclei', 'subfinder', 'gau', 'httpx', 'gitleaks'];
    const spawned = [];
    for (const tool of enabledTools) {
        spawnTool(tool);
        spawned.push(tool);
        await new Promise((r) => setTimeout(r, SPAWN_DELAY_MS));
    }
    LOG.log(`[ParallelScanner] Spawned ${spawned.length} tools`);
    // Collect results (wait for ALL tools in parallel)
    const allFindings = [];
    const allErrors = [];
    const resultPromises = spawned.map(async (tool) => {
        LOG.log(`[ParallelScanner] Waiting for ${tool}...`);
        const result = await waitForTool(tool);
        return { tool, result };
    });
    const results = await Promise.all(resultPromises);
    for (const { tool, result } of results) {
        if (result) {
            allFindings.push(...result.findings);
            allErrors.push(...result.errors);
            LOG.log(`[ParallelScanner] ${tool}: ${result.findings.length} findings in ${result.duration}ms`);
        }
        else {
            allErrors.push(`${tool} timed out`);
            LOG.warn(`[ParallelScanner] ${tool} timed out`);
        }
    }
    // Merge
    const deduped = deduplicateFindings(allFindings);
    const summary = {
        xss: deduped.filter((f) => f.type === 'xss').length,
        sql: deduped.filter((f) => f.type === 'sql').length,
        ssrf: deduped.filter((f) => f.type === 'ssrf').length,
        idor: deduped.filter((f) => f.type === 'idor').length,
        auth: deduped.filter((f) => f.type === 'auth').length,
        rce: deduped.filter((f) => f.type === 'rce').length,
        info: deduped.filter((f) => ['info', 'nuclei', 'api'].includes(f.type)).length
    };
    const duration = Date.now() - startTime;
    LOG.log(`[ParallelScanner] Done: ${deduped.length} findings in ${duration}ms`);
    // DB
    if (db) {
        try {
            const rid = db.insertScanRun(scanId, startedAt, duration, capped.length, deduped.length, allErrors.length);
            for (const f of deduped) {
                db.insertScanFinding(rid, f.url, f.type, f.severity, f.cvss, f.tool, f.description, f.evidence);
            }
        }
        catch (err) {
            LOG.error(`[ParallelScanner] DB error: ${err}`);
        }
    }
    return {
        scanId,
        startedAt,
        duration,
        targetsScanned: capped.length,
        findings: deduped,
        summary,
        stackDetected: Object.fromEntries(stackInfos.flatMap((s) => s.technologies.map((t) => [t.name, stackInfos.filter((si) => si.technologies.some((st) => st.name === t.name)).length]))),
        errors: allErrors
    };
}
/**
 * Entry point: `node dist/src/scanner/ParallelScanner.js [targetUrl...]`
 */
async function main() {
    const targets = process.argv.length > 2
        ? process.argv.slice(2)
        : ['https://bugcrowd.com/engagements/okta'];
    const config = getScannerConfig();
    const result = await runParallelScan(targets, config);
    console.log(JSON.stringify(result, null, 2));
}
export { runParallelScan };
main().catch((err) => {
    console.error('[ParallelScanner] Fatal:', err);
    process.exit(1);
});
