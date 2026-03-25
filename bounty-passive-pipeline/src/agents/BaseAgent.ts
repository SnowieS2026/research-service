/**
 * BaseAgent – foundation for all pipeline agents.
 *
 * Responsibilities:
 * - Own a message queue (via AgentQueue)
 * - Run a processing loop (async iteration over queued messages)
 * - Handle retries with exponential backoff
 * - Call subclass hooks for each message type
 * - Publish repair requests when unrecoverable errors occur
 * - Send ACK replies automatically
 *
 * Subclasses implement `setup()` (optional async init) and
 * `handleMessage(msg)` returning true if handled, false otherwise.
 * The agent's `name` property determines which queue it reads from.
 */
import { AgentQueue } from './AgentQueue.js';
import {
  type AgentName,
  type AgentMessage,
  type QueuedMessage,
  createMessage,
  createReply
} from './AgentMessage.js';
import { Logger } from '../Logger.js';
import fs from 'fs';
import path from 'path';

export interface AgentConfig {
  name: AgentName;
  queueDir: string;
  pollIntervalMs: number;
  maxRetries: number;
  repairThreshold: number;  // consecutive errors before REPAIR:ISSUE is sent
  repairCooloffMs: number;  // don't re-send repair for same issue within this window
}

export const DEFAULT_AGENT_CONFIG: Omit<AgentConfig, 'name'> = {
  queueDir: 'logs/agent-queue',
  pollIntervalMs: 2_000,
  maxRetries: 3,
  repairThreshold: 3,
  repairCooloffMs: 30_000
};

export abstract class BaseAgent {
  protected readonly name: AgentName;
  protected readonly queue: AgentQueue;
  protected readonly log: Logger;
  protected readonly config: AgentConfig;

  private running = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private consecutiveErrors = 0;
  private lastRepairSent: Record<string, number> = {};
  private stateFile: string;

  constructor(name: AgentName, config?: Partial<AgentConfig>) {
    this.name = name;
    this.config = { ...DEFAULT_AGENT_CONFIG, ...config, name };
    this.queue = new AgentQueue(this.config.queueDir);
    this.log = new Logger(`Agent:${name}`);
    this.stateFile = path.join(this.config.queueDir.replace('agent-queue', 'agent-state'), `${name}.state.json`);
    this.ensureStateDir();
  }

  private ensureStateDir(): void {
    const dir = path.dirname(this.stateFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  /** Start the agent's polling loop. Call once per process. */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.log.log(`Starting agent ${this.name} (poll=${this.config.pollIntervalMs}ms)`);
    this.poll();
    this.pollTimer = setInterval(() => this.poll(), this.config.pollIntervalMs);
  }

  /** Stop the agent gracefully. */
  async stop(): Promise<void> {
    this.log.log(`Stopping agent ${this.name}…`);
    this.running = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    await this.onShutdown?.();
    this.saveState({ status: 'stopped', stoppedAt: new Date().toISOString() });
  }

  // ── Message processing ───────────────────────────────────────────────────────

  private async poll(): Promise<void> {
    if (!this.running) return;
    try {
      await this.processMessages();
    } catch (err) {
      this.log.error(`Poll error: ${err}`);
    }
  }

  private async processMessages(): Promise<void> {
    const messages = this.queue.dequeueAll(this.name, 20);
    if (messages.length === 0) return;

    this.log.log(`[${this.name}] Processing ${messages.length} message(s)`);

    for (const qm of messages) {
      try {
        const msg = qm as AgentMessage;
        const handled = await this.handleMessage(msg);

        if (!handled && msg.type !== 'ACK' && msg.type !== 'PING') {
          this.log.warn(`[${this.name}] Unhandled message type: ${msg.type} from=${msg.from} id=${msg.id}`);
        }

        // Auto-acknowledge
        this.queue.ack(this.name, msg.id);
        this.consecutiveErrors = 0;

      } catch (err) {
        const errMsg = String(err);
        this.log.error(`[${this.name}] Error handling ${qm.type}: ${errMsg}`);
        this.consecutiveErrors++;

        // Check if we should send a repair request
        if (this.consecutiveErrors >= this.config.repairThreshold) {
          const issueKey = `${qm.type}:${errMsg.slice(0, 80)}`;
          const now = Date.now();
          const last = this.lastRepairSent[issueKey] ?? 0;
          if (now - last > this.config.repairCooloffMs) {
            this.lastRepairSent[issueKey] = now;
            await this.sendRepairRequest(issueKey, errMsg, qm);
            this.consecutiveErrors = 0; // reset after repair request
          }
        }

        // Still ack to avoid infinite retry loops for now
        this.queue.ack(this.name, qm.id);
      }
    }

    this.queue.rotateIfNeeded(this.name);
  }

  // ── Subclass hooks ───────────────────────────────────────────────────────────

  /**
   * Handle a single message. Return true if the message was handled (including
   * as a no-op / intentional ignore). Return false to signal unhandled.
   * Throw to signal an error that should trigger a repair request.
   */
  protected abstract handleMessage(msg: AgentMessage): Promise<boolean>;

  /**
   * Override for async initialization (e.g., opening browser, DB connections).
   * Called once before the poll loop starts.
   */
  public async setup?(): Promise<void>;

  /**
   * Override for graceful shutdown logic.
   */
  protected async onShutdown?(): Promise<void>;

  // ── Outbound messaging ───────────────────────────────────────────────────────

  /**
   * Send a message to another agent (or broadcast).
   * The message is written to the recipient's queue file immediately.
   */
  protected send(to: AgentName | 'broadcast', type: AgentMessage['type'], payload: unknown, priority?: AgentMessage['priority']): void {
    const msg = createMessage(this.name, to, type, payload, { priority });
    this.queue.enqueue(msg);
  }

  /**
   * Reply to a specific message.
   */
  protected replyTo(original: AgentMessage, type: AgentMessage['type'], payload: unknown): void {
    const msg = createReply(original, this.name, payload, type);
    this.queue.enqueue(msg);
  }

  /**
   * Broadcast to all known agents.
   */
  protected broadcast(type: AgentMessage['type'], payload: unknown): void {
    const agents: AgentName[] = ['coordinator', 'discovery', 'browser', 'scanner', 'reporter', 'repair'];
    for (const agent of agents) {
      if (agent !== this.name) {
        this.send(agent, type, payload);
      }
    }
  }

  // ── Repair ───────────────────────────────────────────────────────────────────

  private async sendRepairRequest(issueKey: string, error: string, failingMsg: QueuedMessage): Promise<void> {
    this.log.warn(`[${this.name}] Sending REPAIR:ISSUE (consecutive errors=${this.consecutiveErrors}): ${issueKey}`);
    this.send('repair', 'REPAIR:ISSUE', {
      issueKey,
      error,
      fromAgent: this.name,
      failingMessageType: failingMsg.type,
      failingMessageId: failingMsg.id,
      failingPayload: failingMsg.payload,
      timestamp: new Date().toISOString()
    }, 'critical');
  }

  // ── State persistence ────────────────────────────────────────────────────────

  protected saveState(extra: Record<string, unknown> = {}): void {
    try {
      const existing: Record<string, unknown> = {};
      if (fs.existsSync(this.stateFile)) {
        try {
          Object.assign(existing, JSON.parse(fs.readFileSync(this.stateFile, 'utf8')));
        } catch { /* ignore */ }
      }
      const state = {
        ...existing,
        ...extra,
        lastPollAt: new Date().toISOString(),
        consecutiveErrors: this.consecutiveErrors
      };
      fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2), 'utf8');
    } catch (err) {
      this.log.warn(`Failed to save state: ${err}`);
    }
  }

  protected loadState(): Record<string, unknown> {
    try {
      if (fs.existsSync(this.stateFile)) {
        return JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
      }
    } catch { /* ignore */ }
    return {};
  }
}
