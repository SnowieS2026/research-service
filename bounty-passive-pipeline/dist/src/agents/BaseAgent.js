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
import { createMessage, createReply } from './AgentMessage.js';
import { Logger } from '../Logger.js';
import fs from 'fs';
import path from 'path';
export const DEFAULT_AGENT_CONFIG = {
    queueDir: 'logs/agent-queue',
    pollIntervalMs: 2_000,
    maxRetries: 3,
    repairThreshold: 3,
    repairCooloffMs: 30_000
};
export class BaseAgent {
    name;
    queue;
    log;
    config;
    running = false;
    pollTimer = null;
    consecutiveErrors = 0;
    lastRepairSent = {};
    stateFile;
    constructor(name, config) {
        this.name = name;
        this.config = { ...DEFAULT_AGENT_CONFIG, ...config, name };
        this.queue = new AgentQueue(this.config.queueDir);
        this.log = new Logger(`Agent:${name}`);
        this.stateFile = path.join(this.config.queueDir.replace('agent-queue', 'agent-state'), `${name}.state.json`);
        this.ensureStateDir();
    }
    ensureStateDir() {
        const dir = path.dirname(this.stateFile);
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });
    }
    // ── Lifecycle ────────────────────────────────────────────────────────────────
    /** Start the agent's polling loop. Call once per process. */
    start() {
        if (this.running)
            return;
        this.running = true;
        this.log.log(`Starting agent ${this.name} (poll=${this.config.pollIntervalMs}ms)`);
        this.poll();
        this.pollTimer = setInterval(() => this.poll(), this.config.pollIntervalMs);
    }
    /** Stop the agent gracefully. */
    async stop() {
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
    async poll() {
        if (!this.running)
            return;
        try {
            await this.processMessages();
        }
        catch (err) {
            this.log.error(`Poll error: ${err}`);
        }
    }
    async processMessages() {
        const messages = this.queue.dequeueAll(this.name, 20);
        if (messages.length === 0)
            return;
        this.log.log(`[${this.name}] Processing ${messages.length} message(s)`);
        for (const qm of messages) {
            try {
                const msg = qm;
                const handled = await this.handleMessage(msg);
                if (!handled && msg.type !== 'ACK' && msg.type !== 'PING') {
                    this.log.warn(`[${this.name}] Unhandled message type: ${msg.type} from=${msg.from} id=${msg.id}`);
                }
                // Auto-acknowledge
                this.queue.ack(this.name, msg.id);
                this.consecutiveErrors = 0;
            }
            catch (err) {
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
    // ── Outbound messaging ───────────────────────────────────────────────────────
    /**
     * Send a message to another agent (or broadcast).
     * The message is written to the recipient's queue file immediately.
     */
    send(to, type, payload, priority) {
        const msg = createMessage(this.name, to, type, payload, { priority });
        this.queue.enqueue(msg);
    }
    /**
     * Reply to a specific message.
     */
    replyTo(original, type, payload) {
        const msg = createReply(original, this.name, payload, type);
        this.queue.enqueue(msg);
    }
    /**
     * Broadcast to all known agents.
     */
    broadcast(type, payload) {
        const agents = ['coordinator', 'discovery', 'browser', 'scanner', 'reporter', 'repair'];
        for (const agent of agents) {
            if (agent !== this.name) {
                this.send(agent, type, payload);
            }
        }
    }
    // ── Repair ───────────────────────────────────────────────────────────────────
    async sendRepairRequest(issueKey, error, failingMsg) {
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
    saveState(extra = {}) {
        try {
            const existing = {};
            if (fs.existsSync(this.stateFile)) {
                try {
                    Object.assign(existing, JSON.parse(fs.readFileSync(this.stateFile, 'utf8')));
                }
                catch { /* ignore */ }
            }
            const state = {
                ...existing,
                ...extra,
                lastPollAt: new Date().toISOString(),
                consecutiveErrors: this.consecutiveErrors
            };
            fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2), 'utf8');
        }
        catch (err) {
            this.log.warn(`Failed to save state: ${err}`);
        }
    }
    loadState() {
        try {
            if (fs.existsSync(this.stateFile)) {
                return JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
            }
        }
        catch { /* ignore */ }
        return {};
    }
}
