/**
 * BrowserAgent – fetches program pages and computes diffs.
 *
 * Receives: BROWSER:FETCH from coordinator or discovery (fast-track)
 * Sends:
 *   - SNAPSHOT:DIFF → coordinator
 *   - BROWSER:ERROR → coordinator (on unrecoverable failure)
 *
 * Self-healing capabilities:
 * - Retries with exponential backoff on Playwright errors
 * - Browser context recovery on crash
 * - Automatic page.goto() retry on timeout/navigation
 * - Memory pressure detection → restarts browser after 50 pages
 */
import { BaseAgent } from './BaseAgent.js';
import { type AgentMessage, createMessage } from './AgentMessage.js';
import { Logger } from '../Logger.js';
import { MetadataBrowser } from '../browser/MetadataBrowser.js';
import { getAdapter } from '../browser/parsers/PlatformAdapters.js';
import { SnapshotManager } from '../storage/SnapshotManager.js';
import path from 'path';

const LOG = new Logger('Agent:Browser');

const MAX_PAGES_PER_CONTEXT = 50;
const BASE_RETRY_DELAY_MS = 2_000;
const MAX_RETRIES = 4;

export class BrowserAgent extends BaseAgent {
  private readonly PIPELINE_ROOT: string;
  private browser?: MetadataBrowser;
  private snapshotMgr?: SnapshotManager;
  private pagesProcessed = 0;
  private retryCounts = new Map<string, number>();

  constructor(pipelineRoot?: string) {
    super('browser', {
      queueDir: path.join(pipelineRoot ?? process.cwd(), 'logs', 'agent-queue'),
      pollIntervalMs: 1_500,
      repairThreshold: 5,
      repairCooloffMs: 20_000
    });
    this.PIPELINE_ROOT = pipelineRoot ?? process.cwd();
  }

  async setup(): Promise<void> {
    this.snapshotMgr = new SnapshotManager();
    await this.initBrowser();
    LOG.log('BrowserAgent ready');
  }

  private async initBrowser(): Promise<void> {
    if (this.browser) {
      try { await this.browser.close(); } catch { /* ignore */ }
    }
    this.browser = new MetadataBrowser();
    await this.browser.init();
    this.pagesProcessed = 0;
    LOG.log('Browser context initialized');
  }

  protected override async onShutdown(): Promise<void> {
    await this.browser?.close();
    LOG.log('BrowserAgent shut down');
  }

  protected override async handleMessage(msg: AgentMessage): Promise<boolean> {
    switch (msg.type) {
      case 'BROWSER:FETCH': {
        const payload = msg.payload as {
          programUrl: string;
          platform: string;
          fastTrack?: boolean;
          pipelineRoot: string;
          retryAttempt?: number;
        };
        await this.fetchAndDiff(payload.programUrl, payload.platform, payload.fastTrack ?? false, payload.retryAttempt ?? 0);
        return true;
      }

      case 'REPAIR:DONE': {
        const payload = msg.payload as { issueKey: string };
        LOG.log(`BrowserAgent received REPAIR:DONE for ${payload.issueKey}`);
        if (
          payload.issueKey.includes('browser') ||
          payload.issueKey.includes('Playwright') ||
          payload.issueKey.includes('Target closed') ||
          payload.issueKey.includes('Protocol error')
        ) {
          LOG.log('Recreating browser context after repair…');
          await this.initBrowser();
        }
        return true;
      }

      case 'PING':
        this.replyTo(msg, 'ACK', {
          name: this.name,
          pagesProcessed: this.pagesProcessed,
          pendingInQueue: this.queue.pendingCount(this.name)
        });
        return true;

      default:
        return false;
    }
  }

  // ── Core fetch logic ────────────────────────────────────────────────────────

  private async fetchAndDiff(programUrl: string, platform: string, isFastTrack: boolean, attempt: number): Promise<void> {
    const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);

    LOG.log(`BROWSER:FETCH ${programUrl} (attempt ${attempt + 1}, fastTrack=${isFastTrack})`);

    try {
      if (this.pagesProcessed >= MAX_PAGES_PER_CONTEXT) {
        LOG.log('Memory pressure – restarting browser context');
        await this.initBrowser();
      }

      await this.fetchWithRetry(programUrl, platform);
      this.retryCounts.delete(programUrl);
      this.pagesProcessed++;

    } catch (err) {
      const errMsg = String(err);
      const newAttempt = attempt + 1;

      LOG.warn(`BROWSER:FETCH ${programUrl} failed (attempt ${newAttempt}): ${errMsg}`);

      if (newAttempt < MAX_RETRIES) {
        this.retryCounts.set(programUrl, newAttempt);
        LOG.log(`Retrying ${programUrl} in ${delay}ms…`);
        await sleep(delay);
        this.send('browser', 'BROWSER:FETCH', {
          programUrl,
          platform,
          fastTrack: isFastTrack,
          pipelineRoot: this.PIPELINE_ROOT,
          retryAttempt: newAttempt
        });
      } else {
        LOG.error(`Max retries exceeded for ${programUrl}`);
        this.retryCounts.delete(programUrl);

        if (
          errMsg.includes('Target closed') ||
          errMsg.includes('Execution context') ||
          errMsg.includes('Protocol error') ||
          errMsg.includes('browser')
        ) {
          LOG.warn('Browser crash detected – recreating context');
          await this.initBrowser();
        }

        this.send('coordinator', 'BROWSER:ERROR', { programUrl, platform, error: errMsg, attempts: newAttempt });
      }
    }
  }

  private async fetchWithRetry(programUrl: string, platform: string): Promise<void> {
    if (!this.browser || !this.snapshotMgr) throw new Error('Browser not initialized');

    const page = await this.browser.navigate(programUrl);
    try { await page.waitForSelector('body', { timeout: 10_000 }); } catch { /* ignore */ }
    await sleep(2_000);

    const adapter = getAdapter(platform);
    const program = await adapter.parse(page, programUrl);

    const identifier = `${platform}-${extractSlug(programUrl)}`;
    const newHash = await this.snapshotMgr.store(program as any, identifier);

    const hashes = await this.snapshotMgr.list(identifier);
    const prevHash = hashes.find((h: string) => h !== newHash);

    let addedFields: any[] = [];
    let removedFields: any[] = [];
    let changedFields: any[] = [];

    if (prevHash && prevHash !== newHash) {
      const prevProg = await this.snapshotMgr.load(identifier, prevHash);
      const { diffPrograms } = await import('../diff/ProgramDiffer.js');
      const diff = diffPrograms(prevProg as any, program as any, prevHash, newHash, identifier);
      addedFields = diff.addedFields;
      removedFields = diff.removedFields;
      changedFields = diff.changedFields;
    }

    const hasChanges = addedFields.length > 0 || removedFields.length > 0 || changedFields.length > 0;
    const scopeAssets = extractScopeAssets(program as any);

    LOG.log(`SNAPSHOT:DIFF for ${programUrl}: ${hasChanges ? 'CHANGES' : 'no changes'} (${scopeAssets.length} assets)`);

    this.send('coordinator', 'SNAPSHOT:DIFF', {
      programUrl,
      platform,
      programName: (program as any).program_name ?? programUrl,
      hasChanges,
      newHash,
      prevHash: prevHash ?? null,
      addedFields,
      removedFields,
      changedFields,
      scopeAssets,
      errors: []
    });

    if (hasChanges && scopeAssets.length > 0) {
      this.send('scanner', 'SCAN:TARGETS', { programUrl, assets: scopeAssets, pipelineRoot: this.PIPELINE_ROOT });
    }
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractSlug(url: string): string {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    if (parts.length >= 2 && (parts[0] === 'engagements' || parts[0] === 'programs')) return parts[1];
    return parts[parts.length - 1] ?? 'unknown';
  } catch { return 'unknown'; }
}

function extractScopeAssets(program: any): string[] {
  const assets: string[] = [];
  if (Array.isArray(program.assets)) {
    for (const a of program.assets) {
      if (typeof a === 'string') assets.push(a);
      else if (a.url) assets.push(a.url);
      else if (a.target) assets.push(a.target);
    }
  }
  if (Array.isArray(program.scope)) {
    for (const s of program.scope) {
      if (typeof s === 'string') assets.push(s);
      else if (s.asset) assets.push(s.asset);
      else if (s.target) assets.push(s.target);
      else if (s.identifier) assets.push(s.identifier);
    }
  }
  if (program.program_url) assets.push(program.program_url);
  return [...new Set(assets.filter(Boolean))];
}
