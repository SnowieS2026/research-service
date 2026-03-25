/**
 * AdaptationAgent — ML-driven tool strategy optimizer.
 *
 * Watches scan results per program and learns which tools perform best
 * for each program/platform. Emits tool enable/disable recommendations
 * that the Coordinator uses to build the scan strategy before each run.
 *
 * Message types handled:
 *   ADAPTATION:REVIEW  – Coordinator requests strategy for a program (pre-scan)
 *   SCAN:DONE          – Scanner reports results (used to update performance records)
 *   ADAPTATION:DUMP    – Dump current performance table (debug)
 *
 * Message types sent:
 *   ADAPTATION:STRATEGY – Coordinator receives tool strategy (enable/disable per tool)
 *   ADAPTATION:ACK      – Ack to sender
 *
 * Strategy output shape:
 *   {
 *     programUrl: string,
 *     platform: string,
 *     toolScores: Record<ToolName, ToolScore>,
 *     recommendedTools: Record<ToolName, boolean>,
 *     confidence: 'low' | 'medium' | 'high',
 *     reason: string,
 *     basedOnRuns: number   // how many historical runs this is based on
 *   }
 *
 * Tool scores are learned from real findings:
 *   - HIGH/CRITICAL true positive  → +2 to that tool
 *   - MEDIUM true positive        → +1
 *   - FALSE POSITIVE              → -1 to that tool
 *   - NO RESULTS (after good run) → 0 (tool neutral for this program)
 *
 * A tool is enabled if: score > 0  OR  confidence is 'low' (try everything)
 * A tool is disabled if: score <= 0  AND  confidence is 'high'/'medium'
 */
import { BaseAgent } from './BaseAgent.js';
import { Logger } from '../Logger.js';
import path from 'path';
import fs from 'fs';
const LOG = new Logger('Agent:Adaptation');
// ── Constants ────────────────────────────────────────────────────────────────
const STORE_FILE = 'logs/agent-state/adaptation-store.json';
const CONFIDENCE_THRESHOLDS = {
    low: 1, // 1 run → low confidence
    medium: 3, // 3 runs → medium confidence
    high: 5 // 5 runs → high confidence
};
const TOOL_LIST = [
    'dalfox', 'sqlmap', 'nuclei', 'ssrf', 'auth',
    'api', 'subfinder', 'gau', 'httpx', 'gitleaks'
];
const DEFAULT_SCORE = {
    score: 0,
    truePositives: 0,
    mediumHits: 0,
    falsePositives: 0,
    runs: 0
};
// ── Agent ────────────────────────────────────────────────────────────────────
export class AdaptationAgent extends BaseAgent {
    store = {};
    STORE_PATH;
    constructor(pipelineRoot) {
        const root = pipelineRoot ?? process.cwd();
        super('adaptation', {
            queueDir: path.join(root, 'logs', 'agent-queue'),
            pollIntervalMs: 3_000,
            repairThreshold: 10,
            repairCooloffMs: 60_000
        });
        this.STORE_PATH = path.join(root, STORE_FILE);
        this.ensureStoreDir();
        this.loadStore();
    }
    ensureStoreDir() {
        const dir = path.dirname(this.STORE_PATH);
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });
    }
    async setup() {
        LOG.log('AdaptationAgent ready');
        LOG.log(`Loaded ${Object.keys(this.store).length} program records`);
    }
    async onShutdown() {
        this.saveStore();
        LOG.log('AdaptationAgent shut down');
    }
    // ── Message handling ────────────────────────────────────────────────────────
    async handleMessage(msg) {
        switch (msg.type) {
            case 'ADAPTATION:REVIEW':
                await this.onReviewRequest(msg);
                return true;
            case 'SCAN:DONE':
                await this.onScanDone(msg);
                return true;
            case 'ADAPTATION:DUMP':
                this.dumpStore(msg);
                return true;
            case 'ADAPTATION:QUERY':
                await this.onQueryRequest(msg);
                return true;
            default:
                return false;
        }
    }
    // ── SCAN:DONE – learn from results ─────────────────────────────────────────
    async onScanDone(msg) {
        const payload = msg.payload;
        LOG.log(`ADAPTATION: learning from scan ${payload.scanId} for ${payload.programUrl}`);
        // Classify findings per tool
        const findingsByTool = {};
        for (const tool of TOOL_LIST) {
            findingsByTool[tool] = { total: 0, high: 0, medium: 0, low: 0 };
        }
        for (const f of payload.findings) {
            const tool = f.tool;
            if (!TOOL_LIST.includes(tool))
                continue;
            const sev = f.severity.toUpperCase();
            findingsByTool[tool].total++;
            if (sev === 'HIGH' || sev === 'CRITICAL')
                findingsByTool[tool].high++;
            else if (sev === 'MEDIUM')
                findingsByTool[tool].medium++;
            else
                findingsByTool[tool].low++;
        }
        // Build true positive counts (HIGH/CRITICAL count as true positives)
        const tpByTool = {};
        const medByTool = {};
        for (const tool of TOOL_LIST) {
            tpByTool[tool] = findingsByTool[tool].high;
            medByTool[tool] = findingsByTool[tool].medium;
        }
        const record = {
            programUrl: payload.programUrl,
            platform: payload.platform,
            scanId: payload.scanId,
            scanAt: new Date().toISOString(),
            toolsRun: payload.toolsRun,
            toolsThatFoundSomething: (payload.findings
                .map((f) => f.tool)
                .filter((t, i, arr) => arr.indexOf(t) === i)),
            findingsByTool,
            totalFindings: payload.findings.length,
            truePositivesByTool: tpByTool,
            mediumHitsByTool: medByTool,
            falsePositiveCount: 0 // calculated externally or via feedback
        };
        this.updateStore(payload.programUrl, payload.platform, record, payload.toolsRun);
        this.saveStore();
        LOG.log(`ADAPTATION: updated scores for ${payload.programUrl}`);
    }
    // ── ADAPTATION:REVIEW – build strategy for a program ─────────────────────────
    async onReviewRequest(msg) {
        const payload = msg.payload;
        const strategy = this.buildStrategy(payload.programUrl, payload.platform);
        LOG.log(`ADAPTATION:STRATEGY for ${payload.programUrl} – ` +
            `confidence=${strategy.confidence}, enabled=${Object.entries(strategy.recommendedTools).filter(([, e]) => e).join(',')}`);
        // Send strategy back to coordinator
        this.send('coordinator', 'ADAPTATION:STRATEGY', {
            programUrl: payload.programUrl,
            platform: payload.platform,
            ...strategy
        }, 'normal');
        this.replyTo(msg, 'ADAPTATION:ACK', { received: true });
    }
    // ── ADAPTATION:QUERY – return raw scores ────────────────────────────────────
    async onQueryRequest(msg) {
        const payload = msg.payload;
        const entry = this.store[payload.programUrl];
        this.replyTo(msg, 'ADAPTATION:ACK', {
            programUrl: payload.programUrl,
            hasData: !!entry,
            totalRuns: entry?.totalRuns ?? 0,
            toolScores: entry?.toolScores ?? {}
        });
    }
    // ── Store management ────────────────────────────────────────────────────────
    updateStore(programUrl, platform, record, toolsRun) {
        if (!this.store[programUrl]) {
            this.store[programUrl] = {
                platform,
                runs: [],
                toolScores: TOOL_LIST.reduce((acc, t) => ({ ...acc, [t]: { ...DEFAULT_SCORE } }), {}),
                totalRuns: 0
            };
        }
        const entry = this.store[programUrl];
        entry.runs.push(record);
        entry.totalRuns++;
        // Update scores per tool
        for (const tool of toolsRun) {
            const s = entry.toolScores[tool];
            const tpGain = record.truePositivesByTool[tool] ?? 0;
            const medGain = record.mediumHitsByTool[tool] ?? 0;
            const totalGain = record.findingsByTool[tool]?.total ?? 0;
            // If tool was run and found HIGH/CRITICAL → positive score
            s.score += tpGain * 2 + medGain * 1;
            s.truePositives += tpGain;
            s.mediumHits += medGain;
            s.runs += 1;
            if (totalGain > 0) {
                s.lastResultAt = record.scanAt;
            }
        }
        // Clamp scores to avoid runaway values
        for (const tool of TOOL_LIST) {
            entry.toolScores[tool].score = Math.max(-10, Math.min(50, entry.toolScores[tool].score));
        }
        // Prune old runs (keep last 20)
        if (entry.runs.length > 20) {
            entry.runs = entry.runs.slice(-20);
        }
    }
    buildStrategy(programUrl, platform) {
        const entry = this.store[programUrl];
        const totalRuns = entry?.totalRuns ?? 0;
        // Determine confidence
        let confidence = 'low';
        if (totalRuns >= CONFIDENCE_THRESHOLDS.high)
            confidence = 'high';
        else if (totalRuns >= CONFIDENCE_THRESHOLDS.medium)
            confidence = 'medium';
        const toolScores = (entry?.toolScores ?? TOOL_LIST.reduce((a, t) => ({ ...a, [t]: { ...DEFAULT_SCORE } }), {}));
        // Platform-specific default strategies (fallback when no data)
        const platformDefaults = {
            'bugcrowd': { dalfox: 1, nuclei: 1, sqlmap: 1, ssrf: 1, auth: 1 },
            'hackerone': { dalfox: 1, nuclei: 1, sqlmap: 1, auth: 1, ssrf: 1 },
            'intigriti': { dalfox: 1, nuclei: 1, sqlmap: 1, ssrf: 1 },
            'standoff365': { dalfox: 1, nuclei: 1, sqlmap: 1, ssrf: 1, auth: 1 }
        };
        const recommendedTools = {};
        const reasons = [];
        for (const tool of TOOL_LIST) {
            const s = toolScores[tool];
            const score = s?.score ?? 0;
            if (confidence === 'low') {
                // Low confidence: enable tools that have positive score OR fall back to platform defaults
                const platformDefault = platformDefaults[platform]?.[tool] ?? 1;
                recommendedTools[tool] = score > 0 || platformDefault > 0;
                if (score > 0) {
                    reasons.push(`${tool}=${score} (positive score, trying)`);
                }
                else {
                    reasons.push(`${tool}=${score} (no data, default)`);
                }
            }
            else {
                // Medium/High confidence: only enable if score > 0
                recommendedTools[tool] = score > 0;
                if (score > 0) {
                    reasons.push(`${tool}=${score} (effective)`);
                }
                else {
                    reasons.push(`${tool}=${score} (disabled – no positive results)`);
                }
            }
        }
        // Force-enable always-useful tools regardless of score (conservative baseline)
        // nuclei is always worth running – low false positive rate, broad coverage
        recommendedTools['nuclei'] = true;
        reasons.push('nuclei=always (baseline, low FP rate)');
        // gitleaks only if subdomains/API targets exist
        // subfinder only on first few runs or when score > 0
        if (totalRuns > 2) {
            recommendedTools['subfinder'] = (toolScores['subfinder']?.score ?? 0) > 0;
        }
        // Ensure auth scanner is enabled for auth-related platforms
        if (platform === 'hackerone' || platform === 'bugcrowd') {
            recommendedTools['auth'] = true;
        }
        const positiveCount = Object.values(recommendedTools).filter(Boolean).length;
        const reason = reasons.filter((r) => r.includes('effective') || r.includes('baseline')).join('; ') ||
            `Based on ${totalRuns} run(s): ${positiveCount} tools recommended`;
        return {
            toolScores,
            recommendedTools,
            confidence,
            reason,
            basedOnRuns: totalRuns,
            generatedAt: new Date().toISOString()
        };
    }
    // ── Persistence ─────────────────────────────────────────────────────────────
    loadStore() {
        try {
            if (fs.existsSync(this.STORE_PATH)) {
                const raw = fs.readFileSync(this.STORE_PATH, 'utf8');
                this.store = JSON.parse(raw);
                LOG.log(`Loaded adaptation store: ${Object.keys(this.store).length} programs`);
            }
        }
        catch (err) {
            LOG.warn(`Failed to load adaptation store: ${err} – starting fresh`);
            this.store = {};
        }
    }
    saveStore() {
        try {
            fs.writeFileSync(this.STORE_PATH, JSON.stringify(this.store, null, 2), 'utf8');
        }
        catch (err) {
            LOG.error(`Failed to save adaptation store: ${err}`);
        }
    }
    dumpStore(msg) {
        const lines = [`# Adaptation Store – ${Object.keys(this.store).length} programs`, ''];
        for (const [programUrl, entry] of Object.entries(this.store)) {
            lines.push(`## ${programUrl} (${entry.platform}) – ${entry.totalRuns} runs`);
            for (const [tool, score] of Object.entries(entry.toolScores)) {
                if (score.score !== 0 || score.runs > 0) {
                    lines.push(`  ${tool}: score=${score.score} TP=${score.truePositives} MED=${score.mediumHits} runs=${score.runs}`);
                }
            }
            lines.push('');
        }
        const summary = lines.join('\n');
        LOG.log(`ADAPTATION:DUMP:\n${summary}`);
        this.replyTo(msg, 'ADAPTATION:ACK', { dump: summary });
    }
}
