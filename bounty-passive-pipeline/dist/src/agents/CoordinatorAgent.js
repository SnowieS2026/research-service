/**
 * CoordinatorAgent — the pipeline conductor.
 *
 * Responsibilities:
 * - Owns the top-level Scheduler (watch mode with configurable interval)
 * - Manages pipeline state transitions: IDLE → DISCOVERY → BROWSER → SCANNING → REPORTS → IDLE
 * - Sends REPAIR:ISSUE → listens for REPAIR:DONE and retries the failed step
 * - Tracks which programs have been processed via run-state.json
 * - Sends periodic heartbeat PINGs to all agents
 * - Spawns sub-agent processes via sessions_spawn / exec
 *
 * State machine:
 *
 *  IDLE ──(on tick)──► DISCOVERY
 *  DISCOVERY ──(DISCOVER:DONE)──► BROWSER
 *  BROWSER ──(all SNAPSHOT:DIFF done)──► SCANNER
 *  SCANNER ──(SCAN:DONE)──► REPORTER
 *  REPORTER ──(done)──► IDLE
 *
 * Any phase can transition to REPAIR if a REPAIR:ISSUE arrives.
 * After REPAIR:DONE the phase retries from the failed step.
 */
import { BaseAgent } from './BaseAgent.js';
import { createMessage } from './AgentMessage.js';
import { Scheduler } from '../Scheduler.js';
import { RunStateManager } from '../storage/RunState.js';
import path from 'path';
import fs from 'fs';
export class CoordinatorAgent extends BaseAgent {
    scheduler;
    db;
    runState;
    phaseCtx = {
        programs: [],
        scopeAssets: new Map(),
        pendingDiffs: new Set(),
        completedDiffs: new Set(),
        pendingScans: new Set(),
        completedScans: new Set(),
        scanReportPaths: [],
        repairAttempts: new Map()
    };
    phase = 'IDLE';
    tickCount = 0;
    WATCH_INTERVAL_MS;
    PIPELINE_ROOT;
    heartbeatTimer;
    constructor(opts = {}) {
        const root = opts.pipelineRoot ?? process.cwd();
        super('coordinator', {
            queueDir: path.join(root, 'logs', 'agent-queue'),
            pollIntervalMs: 1_000,
            repairThreshold: 2,
            repairCooloffMs: 15_000
        });
        this.PIPELINE_ROOT = root;
        this.WATCH_INTERVAL_MS = opts.watchIntervalMs ?? 1_800_000; // 30 min default
        this.db = opts.db;
        this.runState = new RunStateManager();
        this.log.log(`CoordinatorAgent init (watch interval=${this.WATCH_INTERVAL_MS}ms, root=${this.PIPELINE_ROOT})`);
    }
    // ── Lifecycle ────────────────────────────────────────────────────────────────
    async setup() {
        this.log.log('Coordinator setting up…');
        // Load prior state if any
        const stateFile = path.join(this.PIPELINE_ROOT, 'logs', 'agent-state', 'coordinator.state.json');
        if (fs.existsSync(stateFile)) {
            try {
                const s = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
                this.tickCount = s.tickCount ?? 0;
                this.log.log(`Restored state: phase=${s.phase}, tickCount=${s.tickCount}`);
            }
            catch { /* ignore */ }
        }
        // Start heartbeat
        this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), 60_000);
        this.log.log('Coordinator setup complete');
    }
    async onShutdown() {
        if (this.heartbeatTimer)
            clearInterval(this.heartbeatTimer);
        this.scheduler?.stop();
        this.savePersistentState();
        this.log.log('Coordinator shutdown complete');
    }
    // ── State machine ─────────────────────────────────────────────────────────────
    async transitionTo(newPhase, ctx) {
        const prev = this.phase;
        this.phase = newPhase;
        this.log.log(`Phase transition: ${prev} → ${newPhase}`);
        if (ctx) {
            Object.assign(this.phaseCtx, ctx);
        }
        this.savePersistentState();
        switch (newPhase) {
            case 'DISCOVERY':
                await this.runDiscoveryPhase();
                break;
            case 'BROWSER':
                await this.runBrowserPhase();
                break;
            case 'SCANNING':
                await this.runScanningPhase();
                break;
            case 'REPORTER':
                await this.runReporterPhase();
                break;
            case 'IDLE':
                this.runIdle();
                break;
            case 'REPAIR':
                // Handled by handleMessage when REPAIR:DONE comes in
                break;
        }
    }
    // ── Phase: IDLE (wait for next tick) ─────────────────────────────────────────
    runIdle() {
        this.log.log(`IDLE – scheduling next tick in ${this.WATCH_INTERVAL_MS}ms`);
        this.scheduler?.stop();
        this.scheduler = new Scheduler({
            intervalMs: this.WATCH_INTERVAL_MS,
            onTick: () => this.onSchedulerTick()
        });
        this.scheduler.start();
        this.savePersistentState({ lastTickAt: new Date().toISOString() });
    }
    async onSchedulerTick() {
        this.tickCount++;
        this.log.log(`[Tick #${this.tickCount}] Scheduler triggered`);
        this.savePersistentState({ tickCount: this.tickCount });
        await this.transitionTo('DISCOVERY');
    }
    // ── Phase: DISCOVERY ───────────────────────────────────────────────────────────
    async runDiscoveryPhase() {
        this.log.log('=== PHASE: DISCOVERY ===');
        this.phaseCtx.programs = [];
        this.phaseCtx.scopeAssets = new Map();
        this.phaseCtx.pendingDiffs.clear();
        this.phaseCtx.completedDiffs.clear();
        this.phaseCtx.pendingScans.clear();
        this.phaseCtx.completedScans.clear();
        this.phaseCtx.scanReportPaths = [];
        const msg = createMessage('coordinator', 'discovery', 'DISCOVER:START', {
            platforms: ['bugcrowd', 'hackerone', 'intigriti', 'standoff365'],
            tickCount: this.tickCount,
            pipelineRoot: this.PIPELINE_ROOT
        }, { priority: 'high' });
        this.queue.enqueue(msg);
        this.log.log('DISCOVERY:START sent to discovery agent');
    }
    // ── Phase: BROWSER ────────────────────────────────────────────────────────────
    async runBrowserPhase() {
        this.log.log(`=== PHASE: BROWSER (${this.phaseCtx.programs.length} programs) ===`);
        if (this.phaseCtx.programs.length === 0) {
            this.log.log('No programs discovered – skipping to IDLE');
            await this.transitionTo('IDLE');
            return;
        }
        // Send fetch requests for each program to the browser agent
        for (const programUrl of this.phaseCtx.programs) {
            const platform = detectPlatform(programUrl);
            if (!platform) {
                this.log.warn(`Unknown platform for ${programUrl} – skipping`);
                continue;
            }
            const msg = createMessage('coordinator', 'browser', 'BROWSER:FETCH', {
                programUrl,
                platform,
                pipelineRoot: this.PIPELINE_ROOT
            }, { priority: 'normal' });
            this.queue.enqueue(msg);
            this.phaseCtx.pendingDiffs.add(programUrl);
        }
        this.log.log(`BROWSER:FETCH sent for ${this.phaseCtx.pendingDiffs.size} programs`);
    }
    // ── Phase: SCANNING ───────────────────────────────────────────────────────────
    async runScanningPhase() {
        this.log.log(`=== PHASE: SCANNING ===`);
        const allAssets = [...this.phaseCtx.scopeAssets.values()].flat();
        if (allAssets.length === 0) {
            this.log.log('No scope assets to scan – skipping to REPORTER');
            await this.transitionTo('REPORTER');
            return;
        }
        const uniqueAssets = [...new Set(allAssets)].slice(0, 20); // cap at 20
        // ── Get per-program tool strategy from AdaptationAgent ──────────────────
        const strategyResults = await this.queryAdaptationForPrograms();
        // Log what the adaptation agent recommended
        for (const [programUrl, strategy] of Object.entries(strategyResults)) {
            if (strategy) {
                const enabled = Object.entries(strategy.recommendedTools)
                    .filter(([, e]) => e)
                    .map(([t]) => t)
                    .join(', ');
                const disabled = Object.entries(strategy.recommendedTools)
                    .filter(([, e]) => !e)
                    .map(([t]) => t)
                    .join(', ');
                this.log.log(`ADAPTATION: ${programUrl} — confidence=${strategy.confidence} — ` +
                    `ON: ${enabled || 'none'} — OFF: ${disabled || 'none'}`);
            }
            else {
                this.log.log(`ADAPTATION: ${programUrl} — no data, using defaults`);
            }
        }
        const msg = createMessage('coordinator', 'scanner', 'SCAN:START', {
            targets: uniqueAssets,
            pipelineRoot: this.PIPELINE_ROOT,
            tickCount: this.tickCount,
            adaptationStrategies: strategyResults
        }, { priority: 'high' });
        this.queue.enqueue(msg);
        this.log.log(`SCAN:START sent for ${uniqueAssets.length} targets`);
    }
    /**
     * Query AdaptationAgent for tool strategy for each program we've discovered.
     * Returns a map of programUrl → ToolStrategy (or null if no data).
     */
    async queryAdaptationForPrograms() {
        const results = {};
        for (const programUrl of this.phaseCtx.programs) {
            const platform = detectPlatform(programUrl) ?? 'unknown';
            // Send ADAPTATION:REVIEW and wait for response
            const reviewMsg = createMessage('coordinator', 'adaptation', 'ADAPTATION:REVIEW', {
                programUrl,
                platform
            }, { priority: 'normal' });
            this.queue.enqueue(reviewMsg);
            // Poll for response (adaptation agent writes to coordinator queue)
            const strategy = await this.waitForStrategyResponse(reviewMsg.id, 5_000);
            results[programUrl] = strategy;
        }
        return results;
    }
    waitForStrategyResponse(requestId, timeoutMs) {
        return new Promise((resolve) => {
            const deadline = Date.now() + timeoutMs;
            const check = () => {
                // Look for ADAPTATION:STRATEGY in coordinator queue that replies to our request
                const queuePath = path.join(this.PIPELINE_ROOT, 'logs', 'agent-queue', 'coordinator.queue.jsonl');
                try {
                    if (fs.existsSync(queuePath)) {
                        const lines = fs.readFileSync(queuePath, 'utf8').split('\n').filter(Boolean);
                        for (const line of lines) {
                            try {
                                const msg = JSON.parse(line);
                                if (msg.type === 'ADAPTATION:STRATEGY' && msg.replyTo === requestId) {
                                    return resolve(msg.payload);
                                }
                            }
                            catch { /* skip */ }
                        }
                    }
                }
                catch { /* ignore */ }
                if (Date.now() < deadline) {
                    setTimeout(check, 500);
                }
                else {
                    resolve(null);
                }
            };
            check();
        });
    }
    // ── Phase: REPORTER ───────────────────────────────────────────────────────────
    async runReporterPhase() {
        this.log.log('=== PHASE: REPORTER ===');
        const changesFound = this.phaseCtx.completedDiffs.size;
        const reportsGenerated = this.phaseCtx.scanReportPaths.length;
        if (changesFound === 0 && reportsGenerated === 0) {
            this.log.log('No changes or scan reports – nothing to report');
            await this.transitionTo('IDLE');
            return;
        }
        // Send all accumulated data to reporter for summary generation
        const msg = createMessage('coordinator', 'reporter', 'REPORT:GENERATE', {
            completedDiffs: [...this.phaseCtx.completedDiffs],
            scopeAssets: Object.fromEntries(this.phaseCtx.scopeAssets),
            scanReportPaths: this.phaseCtx.scanReportPaths,
            tickCount: this.tickCount,
            pipelineRoot: this.PIPELINE_ROOT
        }, { priority: 'normal' });
        this.queue.enqueue(msg);
        this.log.log('REPORT:GENERATE sent to reporter agent');
    }
    // ── Message handling ──────────────────────────────────────────────────────────
    async handleMessage(msg) {
        switch (msg.type) {
            case 'DISCOVER:DONE': {
                const payload = msg.payload;
                this.phaseCtx.programs = payload.programs;
                this.log.log(`DISCOVER:DONE – ${payload.programs.length} programs (${payload.newPrograms.length} new)`);
                if (payload.errors.length > 0) {
                    this.log.warn(`Discovery errors: ${payload.errors.join('; ')}`);
                }
                await this.transitionTo('BROWSER');
                return true;
            }
            case 'SNAPSHOT:DIFF': {
                const payload = msg.payload;
                this.phaseCtx.pendingDiffs.delete(payload.programUrl);
                this.phaseCtx.completedDiffs.add(payload.programUrl);
                if (payload.scopeAssets.length > 0) {
                    this.phaseCtx.scopeAssets.set(payload.programUrl, payload.scopeAssets);
                }
                this.log.log(`SNAPSHOT:DIFF ${payload.programUrl} – ${payload.hasChanges ? 'CHANGES' : 'no changes'} (${payload.scopeAssets.length} assets)`);
                if (payload.hasChanges) {
                    // Forward to reporter immediately so they can start generating
                    this.send('reporter', 'REPORT:GENERATE', {
                        programUrl: payload.programUrl,
                        changes: payload.changes,
                        scopeAssets: payload.scopeAssets,
                        pipelineRoot: this.PIPELINE_ROOT
                    }, 'high');
                }
                if (this.phaseCtx.pendingDiffs.size === 0) {
                    this.log.log('All browser diffs complete – transitioning to SCANNING');
                    await this.transitionTo('SCANNING');
                }
                return true;
            }
            case 'BROWSER:ERROR': {
                const payload = msg.payload;
                this.log.error(`BROWSER:ERROR for ${payload.programUrl}: ${payload.error}`);
                this.phaseCtx.pendingDiffs.delete(payload.programUrl);
                this.phaseCtx.completedDiffs.add(payload.programUrl); // treat as done to avoid blocking
                if (this.phaseCtx.pendingDiffs.size === 0) {
                    await this.transitionTo('SCANNING');
                }
                return true;
            }
            case 'SCAN:DONE': {
                const payload = msg.payload;
                this.phaseCtx.scanReportPaths.push(...payload.reportPaths);
                this.log.log(`SCAN:DONE – ${payload.findingsCount} findings, reports: ${payload.reportPaths.join(', ')}`);
                // Forward to adaptation agent for learning
                this.send('adaptation', 'SCAN:DONE', {
                    scanId: payload.scanId,
                    programUrl: payload.programUrl ?? this.phaseCtx.programs[0] ?? 'unknown',
                    platform: payload.platform ?? detectPlatform(this.phaseCtx.programs[0] ?? '') ?? 'unknown',
                    toolsRun: payload.toolsRun ?? [],
                    findings: payload.findings ?? [],
                    errors: payload.errors ?? []
                });
                // Notify reporter of scan results
                this.send('reporter', 'REPORT:GENERATE', {
                    scanResults: payload,
                    pipelineRoot: this.PIPELINE_ROOT
                }, 'high');
                await this.transitionTo('REPORTER');
                return true;
            }
            case 'SCAN:ERROR': {
                const payload = msg.payload;
                this.log.error(`SCAN:ERROR: ${payload.error}`);
                // Don't block on scan errors – move to reporter
                await this.transitionTo('REPORTER');
                return true;
            }
            case 'REPORT:DONE': {
                const payload = msg.payload;
                this.log.log(`REPORT:DONE – ${payload.reportPaths.length} reports, notified=${payload.notified}`);
                this.savePersistentState({
                    totalReportsGenerated: this.phaseCtx.scanReportPaths.length,
                    totalChangesFound: this.phaseCtx.completedDiffs.size
                });
                await this.transitionTo('IDLE');
                return true;
            }
            case 'REPAIR:DONE': {
                const payload = msg.payload;
                this.log.log(`REPAIR:DONE for ${payload.issueKey}: fixed=${payload.fixed}`);
                // Retry the last failed phase
                this.phaseCtx.repairAttempts.delete(payload.issueKey);
                this.log.log('Retrying last failed phase after repair…');
                // Return to previous phase based on what was being done
                switch (this.phase) {
                    case 'BROWSER':
                        await this.runBrowserPhase();
                        break;
                    case 'SCANNING':
                        await this.runScanningPhase();
                        break;
                    default:
                        await this.transitionTo('IDLE');
                }
                return true;
            }
            case 'REPAIR:FAIL': {
                const payload = msg.payload;
                this.log.error(`REPAIR:FAIL for ${payload.issueKey} after ${payload.attempts} attempts: ${payload.error}`);
                // After max repair attempts, log and move on
                this.phaseCtx.repairAttempts.set(payload.issueKey, payload.attempts);
                await this.transitionTo('IDLE');
                return true;
            }
            case 'ADAPTATION:STRATEGY': {
                // Async response from adaptation agent (handled via waitForStrategyResponse)
                // but also needed when sent directly without replyTo
                const payload = msg.payload;
                this.log.log(`ADAPTATION:STRATEGY received for ${payload.programUrl}: ` +
                    `confidence=${payload.confidence}, basedOnRuns=${payload.basedOnRuns}`);
                return true;
            }
            case 'PING': {
                // Respond with current state
                this.replyTo(msg, 'ACK', {
                    name: this.name,
                    phase: this.phase,
                    tickCount: this.tickCount,
                    pendingDiffs: this.phaseCtx.pendingDiffs.size,
                    pendingScans: this.phaseCtx.pendingScans.size,
                    uptime: process.uptime()
                });
                return true;
            }
            default:
                return false;
        }
    }
    // ── Heartbeat ────────────────────────────────────────────────────────────────
    sendHeartbeat() {
        this.savePersistentState({ heartbeatAt: new Date().toISOString() });
    }
    // ── Persistence ───────────────────────────────────────────────────────────────
    savePersistentState(extra = {}) {
        try {
            const state = {
                phase: this.phase,
                tickCount: this.tickCount,
                lastTickAt: extra.lastTickAt,
                lastCompletedAt: new Date().toISOString(),
                totalProgramsProcessed: this.phaseCtx.completedDiffs.size,
                totalChangesFound: this.phaseCtx.completedDiffs.size,
                totalReportsGenerated: this.phaseCtx.scanReportPaths.length,
                lastError: this.phaseCtx.lastError,
                ...extra
            };
            const dir = path.join(this.PIPELINE_ROOT, 'logs', 'agent-state');
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(path.join(dir, 'coordinator.state.json'), JSON.stringify(state, null, 2), 'utf8');
        }
        catch (err) {
            this.log.warn(`Failed to save coordinator state: ${err}`);
        }
    }
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
