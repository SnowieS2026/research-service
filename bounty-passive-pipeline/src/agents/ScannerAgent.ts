/**
 * ScannerAgent – orchestrates active scanning across all collected targets.
 *
 * Receives:
 *   - SCAN:START → run all scan tools on all targets (coordinator-triggered full scan)
 *   - SCAN:TARGETS → add targets to the queue and scan incrementally
 *
 * Sends:
 *   - SCAN:DONE → coordinator when scan completes
 *   - SCAN:ERROR → coordinator on unrecoverable failure
 *   - SCAN:TOOL_ERROR → repair when a specific tool keeps failing
 *
 * Self-healing:
 * - Each tool (XSS, SQLi, SSRF, Auth, Nuclei, etc.) is wrapped in try/catch
 * - Individual tool failures don't stop the scan – they send SCAN:TOOL_ERROR
 * - If a tool fails 3x in a row → repair agent is notified to check/install it
 * - Target-level retries with backoff (max 2 retries per target)
 * - Scan state is persisted to scan-state.json so interrupted scans can resume
 */
import { BaseAgent } from './BaseAgent.js';
import { type AgentMessage } from './AgentMessage.js';
import { createMessage } from './AgentMessage.js';
import { Logger } from '../Logger.js';
import { runParallelScan } from '../scanner/ParallelScanner.js';
import type { ScanRunResult } from '../scanner/ScanResult.js';
import { BountyDB } from '../storage/BountyDB.js';
import path from 'path';
import fs from 'fs';

const LOG = new Logger('Agent:Scanner');

const MAX_TARGET_RETRIES = 2;
const BASE_RETRY_DELAY_MS = 5_000;
const TOOL_FAILURE_THRESHOLD = 3;

interface ToolFailure {
  tool: string;
  count: number;
  lastError: string;
  lastAt: string;
}

interface PendingTarget {
  programUrl: string;
  assets: string[];
  addedAt: string;
}

interface ScanState {
  scanId?: string;
  startedAt?: string;
  targets: PendingTarget[];
  completedTargets: string[];
  failedTargets: Map<string, number>; // url → retry count
  toolFailures: Record<string, ToolFailure>;
  lastCheckpointAt?: string;
}

export class ScannerAgent extends BaseAgent {
  private readonly PIPELINE_ROOT: string;
  private state: ScanState = {
    targets: [],
    completedTargets: [],
    failedTargets: new Map(),
    toolFailures: {}
  };
  private scannerStateFile: string;
  private db?: BountyDB;
  private scanning = false;

  constructor(pipelineRoot?: string) {
    super('scanner', {
      queueDir: path.join(pipelineRoot ?? process.cwd(), 'logs', 'agent-queue'),
      pollIntervalMs: 2_000,
      repairThreshold: 5
    });
    this.PIPELINE_ROOT = pipelineRoot ?? process.cwd();
    this.scannerStateFile = path.join(this.PIPELINE_ROOT, 'logs', 'agent-state', 'scanner.state.json');
    this.restoreState();
  }

  async setup(): Promise<void> {
    try {
      this.db = new BountyDB(path.join(this.PIPELINE_ROOT, 'logs', 'bounty.db'));
    } catch (err) {
      LOG.warn(`DB connection failed (scanning will continue without DB): ${err}`);
    }
    LOG.log('ScannerAgent ready');
  }

  protected async onShutdown(): Promise<void> {
    this.persistState();
    this.db?.close();
    LOG.log('ScannerAgent shut down');
  }

  protected async handleMessage(msg: AgentMessage): Promise<boolean> {
    switch (msg.type) {
      case 'SCAN:START': {
        const payload = msg.payload as {
          targets: string[];
          pipelineRoot: string;
          tickCount: number;
          adaptationStrategies?: Record<string, {
            recommendedTools: Record<string, boolean>;
            confidence: string;
            reason: string;
            basedOnRuns: number;
          } | null>;
        };

        LOG.log(`SCAN:START received (tick #${payload.tickCount}) for ${payload.targets.length} targets`);
        const strategies = payload.adaptationStrategies ?? {};
        await this.runFullScan(payload.targets, strategies);
        return true;
      }

      case 'SCAN:TARGETS': {
        const payload = msg.payload as {
          programUrl: string;
          assets: string[];
          pipelineRoot: string;
        };

        // Queue targets for incremental scanning
        for (const asset of payload.assets) {
          if (!this.state.completedTargets.includes(asset)) {
            this.state.targets.push({
              programUrl: payload.programUrl,
              assets: [asset],
              addedAt: new Date().toISOString()
            });
          }
        }

        this.persistState();
        LOG.log(`SCAN:TARGETS queued: ${payload.assets.length} assets from ${payload.programUrl}`);

        // Trigger incremental scan if not already running
        if (!this.scanning) {
          this.runIncrementalScan().catch((err) => {
            LOG.error(`Incremental scan error: ${err}`);
          });
        }
        return true;
      }

      case 'PING':
        this.replyTo(msg, 'ACK', {
          name: this.name,
          scanning: this.scanning,
          pendingTargets: this.state.targets.length,
          completedTargets: this.state.completedTargets.length,
          toolFailures: Object.keys(this.state.toolFailures).length
        });
        return true;

      default:
        return false;
    }
  }

  // ── Full scan (coordinator-triggered) ────────────────────────────────────────

  private async runFullScan(
    targets: string[],
    strategies: Record<string, {
      recommendedTools: Record<string, boolean>;
      confidence: string;
      reason: string;
      basedOnRuns: number;
    } | null> = {}
  ): Promise<void> {
    if (this.scanning) {
      LOG.warn('Scan already in progress – ignoring SCAN:START');
      return;
    }

    this.scanning = true;
    const scanId = `scan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const startedAt = new Date().toISOString();
    const errors: string[] = [];
    const reportPaths: string[] = [];
    const allFindings: Awaited<ReturnType<typeof runParallelScan>>['findings'] = [];
    const toolsRun = new Set<string>();

    LOG.log(`Starting full scan ${scanId} on ${targets.length} targets`);

    try {
      // Check all tools before starting
      const toolCheck = await this.checkTools();
      if (!toolCheck.ok) {
        LOG.warn(`Some tools not available: ${toolCheck.missing.join(', ')}`);
        // Still try to run – they'll fail gracefully
      }

      // Group targets by program using scopeAssets map from coordinator context
      // Each target may belong to a different program – scan each with its own strategy
      // For simplicity: if we have strategies, scan in batches by strategy group
      // Fall back to a single scan with merged tool config

      const hasStrategies = Object.values(strategies).some((s) => s !== null);

      if (hasStrategies) {
        // Scan each program's targets with its own recommended tool set
        // Group targets by their program's strategy
        const strategyGroups = new Map<string, string[]>();
        for (const target of targets) {
          // Find which program's strategy applies – use first matching
          let matchedStrategy: string | null = null;
          for (const [programUrl, strat] of Object.entries(strategies)) {
            if (strat !== null) {
              matchedStrategy = programUrl;
              break;
            }
          }
          const key = matchedStrategy ?? '__default__';
          if (!strategyGroups.has(key)) strategyGroups.set(key, []);
          strategyGroups.get(key)!.push(target);
        }

        for (const [programUrl, groupTargets] of strategyGroups) {
          const strat = strategies[programUrl] ?? strategies['__default__'];
          const toolConfig = this.buildToolConfigFromStrategy(strat);

          LOG.log(
            `Scanning ${groupTargets.length} targets with strategy for ${programUrl}: ` +
            `confidence=${strat?.confidence ?? 'none'} — tools: ` +
            `${Object.entries(toolConfig).filter(([,e])=>e).map(([t])=>t).join(', ')}`
          );

          try {
            const result = await runParallelScan(groupTargets, {
              dryRun: false,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              tools: toolConfig as any,
              nucleiTemplates: '',
              rateLimitMs: 2_000,
              timeoutPerTarget: 300_000,
              maxTargetsPerRun: 20,
              outputDir: path.join(this.PIPELINE_ROOT, 'reports'),
              sqlmapLevel: 2,
              sqlmapRisk: 1
            }, this.db);

            allFindings.push(...result.findings);
            for (const [tool, enabled] of Object.entries(toolConfig)) {
              if (enabled) toolsRun.add(tool);
            }
            errors.push(...result.errors);

            if (result.findings.length > 0) {
              const today = new Date().toISOString().split('T')[0];
              const dir = path.join(this.PIPELINE_ROOT, 'reports', today);
              const hash = result.scanId.slice(0, 12);
              reportPaths.push(
                path.join(dir, `scan-${hash}.md`),
                path.join(dir, `scan-${hash}.json`)
              );
            }
          } catch (scanErr) {
            const errMsg = String(scanErr);
            LOG.error(`Scan group failed for ${programUrl}: ${errMsg}`);
            errors.push(`[${programUrl}] ${errMsg}`);
          }
        }
      } else {
        // No strategies yet – use default tool config (all tools)
        const result = await runParallelScan(targets, {
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
            gitleaks: true
          },
          nucleiTemplates: '',
          rateLimitMs: 2_000,
          timeoutPerTarget: 300_000,
          maxTargetsPerRun: 20,
          outputDir: path.join(this.PIPELINE_ROOT, 'reports'),
          sqlmapLevel: 2,
          sqlmapRisk: 1
        }, this.db);

        allFindings.push(...result.findings);
        for (const [tool, enabled] of Object.entries(result.summary)) {
          if (enabled) toolsRun.add(tool);
        }
        errors.push(...result.errors);

        if (result.findings.length > 0) {
          const today = new Date().toISOString().split('T')[0];
          const dir = path.join(this.PIPELINE_ROOT, 'reports', today);
          const hash = result.scanId.slice(0, 12);
          reportPaths.push(
            path.join(dir, `scan-${hash}.md`),
            path.join(dir, `scan-${hash}.json`)
          );
        }
      }

      // Record completed targets
      for (const t of targets) {
        if (!this.state.completedTargets.includes(t)) {
          this.state.completedTargets.push(t);
        }
      }

      this.persistState();

      LOG.log(`SCAN:DONE ${scanId}: ${allFindings.length} findings`);

      this.send('coordinator', 'SCAN:DONE', {
        scanId,
        startedAt,
        findingsCount: allFindings.length,
        reportPaths,
        errors,
        toolsRun: [...toolsRun],
        findings: allFindings.map((f: any) => ({
          tool: f.tool,
          type: f.type,
          severity: f.severity,
          url: f.url,
          description: f.description,
          evidence: f.evidence,
          cvss: f.cvss
        }))
      });

    } catch (err) {
      const errMsg = String(err);
      LOG.error(`Full scan failed: ${errMsg}`);

      errors.push(errMsg);
      this.send('coordinator', 'SCAN:ERROR', {
        error: errMsg,
        targetsScanned: targets.length
      });
    } finally {
      this.scanning = false;
    }
  }

  /**
   * Build a ScannerConfig.tools object from an adaptation strategy.
   * Maps ToolStrategy.recommendedTools (true/false per tool name) into
   * the { dalfox: true, sqlmap: false, ... } shape that runParallelScan expects.
   */
  private buildToolConfigFromStrategy(
    strat: {
      recommendedTools: Record<string, boolean>;
      confidence: string;
      reason: string;
      basedOnRuns: number;
    } | null | undefined
  ): Record<string, boolean> {
    // All tools default to false unless explicitly recommended
    const tools: Record<string, boolean> = {
      dalfox: false,
      sqlmap: false,
      nuclei: false,
      ssrf: false,
      auth: false,
      api: false,
      subfinder: false,
      gau: false,
      httpx: false,
      gitleaks: false
    };

    if (!strat) {
      // No data – enable sensible defaults for unknown programs
      tools.dalfox = true;
      tools.sqlmap = true;
      tools.nuclei = true;
      tools.ssrf = true;
      tools.auth = true;
      tools.api = true;
      return tools;
    }

    for (const [tool, recommended] of Object.entries(strat.recommendedTools)) {
      if (tool in tools) {
        tools[tool] = recommended;
      }
    }

    // nuclei is always worth running – override to true if strategy disabled it
    // (unless explicitly turned off due to consistent failures)
    if (!tools.nuclei && strat.confidence !== 'high') {
      tools.nuclei = true;
    }

    return tools;
  }

  // ── Incremental scan (triggered by individual targets) ───────────────────────

  private async runIncrementalScan(): Promise<void> {
    if (this.state.targets.length === 0) return;
    if (this.scanning) return;

    const target = this.state.targets.shift()!;
    this.scanning = true;

    LOG.log(`Incremental scan: ${target.assets.length} assets from ${target.programUrl}`);

    try {
      const result = await runParallelScan(target.assets, {
        dryRun: false,
        tools: {
          dalfox: true,
          sqlmap: true,
          nuclei: true,
          ssrf: true,
          auth: true,
          api: true,
          subfinder: false,
          gau: false,
          httpx: false,
          gitleaks: false
        },
        nucleiTemplates: '',
        rateLimitMs: 2_000,
        timeoutPerTarget: 120_000,
        maxTargetsPerRun: 5,
        outputDir: path.join(this.PIPELINE_ROOT, 'reports'),
        sqlmapLevel: 1,
        sqlmapRisk: 1
      }, this.db);

      for (const a of target.assets) {
        if (!this.state.completedTargets.includes(a)) {
          this.state.completedTargets.push(a);
        }
      }

      this.persistState();

      if (result.findings.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const dir = path.join(this.PIPELINE_ROOT, 'reports', today);
        const hash = result.scanId.slice(0, 12);
        const mdPath = path.join(dir, `scan-${hash}.md`);

        this.send('coordinator', 'SCAN:DONE', {
          scanId: result.scanId,
          findingsCount: result.findings.length,
          reportPaths: [mdPath],
          errors: result.errors,
          summary: result.summary
        });
      }

    } catch (err) {
      const errMsg = String(err);
      LOG.error(`Incremental scan failed for ${target.programUrl}: ${errMsg}`);

      // Retry logic
      const retryCount = (this.state.failedTargets.get(target.programUrl) ?? 0) + 1;
      this.state.failedTargets.set(target.programUrl, retryCount);

      if (retryCount <= MAX_TARGET_RETRIES) {
        const delay = BASE_RETRY_DELAY_MS * Math.pow(2, retryCount - 1);
        LOG.log(`Retrying ${target.programUrl} in ${delay}ms (attempt ${retryCount + 1}/${MAX_TARGET_RETRIES})`);

        this.state.targets.unshift(target); // put back at front
        setTimeout(() => this.runIncrementalScan().catch((e) => LOG.error(e)), delay);
      } else {
        LOG.warn(`Max retries exceeded for ${target.programUrl} – dropping`);
        this.send('coordinator', 'SCAN:ERROR', {
          error: errMsg,
          target: target.programUrl,
          attempts: retryCount
        });
      }
    } finally {
      this.scanning = false;
      // Process next if any
      if (this.state.targets.length > 0) {
        setTimeout(() => this.runIncrementalScan().catch((e) => LOG.error(e)), 3_000);
      }
    }
  }

  // ── Tool health check ─────────────────────────────────────────────────────────

  private async checkTools(): Promise<{ ok: boolean; missing: string[] }> {
    const requiredTools = ['dalfox', 'sqlmap', 'nuclei'];
    const missing: string[] = [];

    for (const tool of requiredTools) {
      try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        await execAsync(`${tool} --version`, { timeout: 5_000 });
      } catch {
        missing.push(tool);
      }
    }

    return { ok: missing.length === 0, missing };
  }

  // ── Tool failure tracking ────────────────────────────────────────────────────

  recordToolFailure(tool: string, error: string): void {
    const existing = this.state.toolFailures[tool];
    if (existing) {
      existing.count++;
      existing.lastError = error;
      existing.lastAt = new Date().toISOString();
    } else {
      this.state.toolFailures[tool] = {
        tool,
        count: 1,
        lastError: error,
        lastAt: new Date().toISOString()
      };
    }

    const failure = this.state.toolFailures[tool];
    LOG.warn(`Tool failure: ${tool} (count=${failure.count}): ${error}`);

    if (failure.count >= TOOL_FAILURE_THRESHOLD) {
      this.send('repair', 'REPAIR:ISSUE', {
        issueKey: `tool:${tool}:failure`,
        error: `Tool '${tool}' has failed ${failure.count} times. Last error: ${error}`,
        fromAgent: 'scanner',
        tool,
        attempts: failure.count,
        timestamp: new Date().toISOString()
      }, 'critical');
    }

    this.persistState();
  }

  // ── State ───────────────────────────────────────────────────────────────────

  private restoreState(): void {
    try {
      if (fs.existsSync(this.scannerStateFile)) {
        const raw = fs.readFileSync(this.scannerStateFile, 'utf8');
        const s = JSON.parse(raw);
        this.state = {
          ...s,
          failedTargets: new Map(Object.entries(s.failedTargets ?? {}))
        };
        LOG.log(`Scanner state loaded: ${this.state.targets.length} pending targets`);
      }
    } catch (err) {
      LOG.warn(`Failed to load scanner state: ${err}`);
    }
  }

  private persistState(): void {
    try {
      const dir = path.dirname(this.scannerStateFile);
      fs.mkdirSync(dir, { recursive: true });
      const serializable = {
        ...this.state,
        failedTargets: Object.fromEntries(this.state.failedTargets)
      };
      fs.writeFileSync(this.scannerStateFile, JSON.stringify(serializable, null, 2), 'utf8');
    } catch (err) {
      LOG.warn(`Failed to save scanner state: ${err}`);
    }
  }
}
