/**
 * run-tool.js – standalone tool runner, run as: node run-tool.js <tool>
 *
 * Each tool scanner runs as an independent process.
 * Loads shared endpoints from logs/scan-state.json, runs the scanner,
 * writes results to logs/scan-results/<tool>-result.json, then exits.
 *
 * This ensures a slow SQL scan doesn't block fast XSS results.
 */
import { loadConfig } from '../config.js';
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
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Pipeline root is three levels up from dist/src/scanner/
const PIPELINE_ROOT = path.resolve(__dirname, '../../..');
const STATE_FILE = path.join(PIPELINE_ROOT, 'logs/scan-state.json');
const RESULTS_DIR = path.join(PIPELINE_ROOT, 'logs/scan-results');
async function main() {
    const tool = process.argv[2];
    if (!tool) {
        console.error('Usage: node run-tool.js <xss|sql|ssrf|auth|api|nuclei>');
        process.exit(1);
    }
    console.log(`[run-tool:${tool}] Starting...`);
    // Load shared state
    let state;
    try {
        const raw = await fs.promises.readFile(STATE_FILE, 'utf8');
        state = JSON.parse(raw);
    }
    catch (err) {
        console.error(`[run-tool:${tool}] Failed to load state file: ${err}`);
        process.exit(1);
    }
    // Load config
    const cfg = loadConfig();
    const outputDir = path.join(PIPELINE_ROOT, 'reports');
    await fs.promises.mkdir(outputDir, { recursive: true });
    await fs.promises.mkdir(RESULTS_DIR, { recursive: true });
    const config = {
        dryRun: cfg.SCANNER_DRY_RUN ?? false,
        tools: {
            dalfox: cfg.DALFOX_ENABLED ?? true,
            sqlmap: cfg.SQLMAP_ENABLED ?? true,
            nuclei: cfg.NUCLEI_ENABLED ?? true,
            ssrf: cfg.SSRF_ENABLED ?? true,
            auth: cfg.AUTH_ENABLED ?? true,
            api: cfg.API_ENABLED ?? true,
            subfinder: cfg.SUBFINDER_ENABLED ?? true,
            gau: cfg.GAU_ENABLED ?? true,
            httpx: cfg.HTTPX_ENABLED ?? true,
            gitleaks: cfg.GITLEAKS_ENABLED ?? true
        },
        nucleiTemplates: cfg.NUCLEI_TEMPLATES_DIR ?? '',
        rateLimitMs: cfg.RATE_LIMIT_DELAY_MS ?? 2000,
        timeoutPerTarget: cfg.SCANNER_TIMEOUT_MS ?? 300_000,
        maxTargetsPerRun: 10,
        outputDir,
        sqlmapLevel: 2,
        sqlmapRisk: 1
    };
    const endpoints = state.endpoints;
    const paramEndpoints = endpoints.filter((e) => e.params.length > 0);
    const stackInfo = state.stackInfos[0] ?? {};
    const findings = [];
    const errors = [];
    const start = Date.now();
    try {
        switch (tool) {
            case 'xss':
                if (config.tools.dalfox) {
                    findings.push(...await scanForXSS(paramEndpoints, stackInfo, config));
                }
                break;
            case 'sql':
                if (config.tools.sqlmap) {
                    // Limit SQLi to top 10 endpoints to avoid timeout
                    findings.push(...await scanForSQLi(paramEndpoints.slice(0, 10), stackInfo, config));
                }
                break;
            case 'ssrf':
                if (config.tools.ssrf) {
                    findings.push(...await scanForSSRF(paramEndpoints, stackInfo, config));
                }
                break;
            case 'auth': {
                if (config.tools.auth) {
                    const authTargets = [
                        ...paramEndpoints,
                        ...endpoints.filter((e) => e.formFields.some((f) => f.type === 'password'))
                    ];
                    findings.push(...await scanForAuthIssues(authTargets, stackInfo, config));
                }
                break;
            }
            case 'api':
                if (config.tools.api) {
                    findings.push(...await scanAPI(endpoints, stackInfo, config));
                }
                break;
            case 'nuclei':
                if (config.tools.nuclei) {
                    const stackTechs = state.stackInfos.flatMap((s) => s.technologies.map((t) => t.name));
                    findings.push(...await runNuclei(state.targets, stackTechs, config));
                }
                break;
            case 'subfinder':
                if (config.tools.subfinder) {
                    findings.push(...await scanSubfinder(state.targets, {}, config));
                }
                break;
            case 'gau':
                if (config.tools.gau) {
                    findings.push(...await scanGau(state.targets, {}, config));
                }
                break;
            case 'httpx':
                if (config.tools.httpx) {
                    findings.push(...await scanHttpx(state.targets, {}, config));
                }
                break;
            case 'gitleaks':
                if (config.tools.gitleaks) {
                    findings.push(...await scanGitleaks(state.targets, {}, config));
                }
                break;
            default:
                errors.push(`Unknown tool: ${tool}`);
        }
        console.log(`[run-tool:${tool}] Found ${findings.length} findings in ${Date.now() - start}ms`);
    }
    catch (err) {
        const msg = `${tool} scan error: ${err}`;
        console.error(`[run-tool:${tool}] ${msg}`);
        errors.push(msg);
    }
    const result = {
        tool,
        findings,
        errors,
        duration: Date.now() - start,
        savedAt: new Date().toISOString()
    };
    const resultFile = path.join(RESULTS_DIR, `${tool}-result.json`);
    await fs.promises.writeFile(resultFile, JSON.stringify(result, null, 2), 'utf8');
    console.log(`[run-tool:${tool}] Results written to ${resultFile}`);
    console.log(`DONE:${tool}`);
}
main().catch((err) => {
    console.error(`[run-tool] Fatal: ${err}`);
    process.exit(1);
});
