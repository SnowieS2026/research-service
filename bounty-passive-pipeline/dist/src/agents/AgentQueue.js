/**
 * AgentQueue – persistent FIFO queue backed by JSONL files.
 * Messages are written to <agentName>.queue.jsonl and acknowledged by
 * writing a <agentName>.acked.<messageId> sentinel file.
 *
 * This allows fully async, non-blocking communication between agents,
 * even across process restarts.
 */
import fs from 'fs';
import path from 'path';
import { Logger } from '../Logger.js';
const LOG = new Logger('AgentQueue');
// Max messages to keep in a queue file before rotating
const MAX_QUEUE_SIZE = 500;
export class AgentQueue {
    queueDir;
    constructor(queueDir) {
        this.queueDir = queueDir;
        fs.mkdirSync(this.queueDir, { recursive: true });
    }
    queuePath(agent) {
        return path.join(this.queueDir, `${agent}.queue.jsonl`);
    }
    ackPath(agent, msgId) {
        return path.join(this.queueDir, `${agent}.ack.${msgId}`);
    }
    stalePath(agent) {
        return path.join(this.queueDir, `${agent}.stale.jsonl`);
    }
    // ── Enqueue ──────────────────────────────────────────────────────────────────
    enqueue(msg) {
        const qm = { ...msg, status: 'queued' };
        const line = JSON.stringify(qm) + '\n';
        fs.appendFileSync(this.queuePath(msg.to), line, 'utf8');
        LOG.log(`[Queue:${msg.to}] ENQUEUE ${msg.type} from=${msg.from} id=${msg.id}`);
    }
    // ── Dequeue (non-blocking, atomic via rename) ─────────────────────────────────
    /**
     * Claim the next unacked message for `agent` by atomically renaming the queue
     * file to a temp, extracting the first line, and rewriting the remainder.
     * Returns null if the queue is empty.
     */
    dequeue(agent) {
        const qp = this.queuePath(agent);
        if (!fs.existsSync(qp))
            return null;
        let lines;
        try {
            const raw = fs.readFileSync(qp, 'utf8');
            lines = raw.split('\n').filter(Boolean);
        }
        catch {
            return null;
        }
        if (lines.length === 0)
            return null;
        // Find first unacked message
        for (let i = 0; i < lines.length; i++) {
            try {
                const qm = JSON.parse(lines[i]);
                if (qm.status !== 'queued')
                    continue;
                if (this.isStale(qm)) {
                    this.markStale(agent, qm);
                    continue;
                }
                if (this.isAcked(agent, qm.id)) {
                    // Already processed — skip
                    continue;
                }
                // Mark as delivered (update in-memory, rewrite remainder)
                qm.status = 'delivered';
                qm.deliveredAt = new Date().toISOString();
                qm.attempts = (qm.attempts ?? 0) + 1;
                const newLines = [JSON.stringify(qm), ...lines.slice(i + 1)];
                const tmp = qp + '.tmp';
                fs.writeFileSync(tmp, newLines.join('\n') + '\n', 'utf8');
                fs.renameSync(tmp, qp);
                LOG.log(`[Queue:${agent}] DEQUEUE ${qm.type} id=${qm.id} (attempt ${qm.attempts})`);
                return qm;
            }
            catch {
                continue;
            }
        }
        return null;
    }
    // ── Bulk dequeue — grab up to `limit` messages ────────────────────────────────
    dequeueAll(agent, limit = 50) {
        const messages = [];
        for (let i = 0; i < limit; i++) {
            const msg = this.dequeue(agent);
            if (!msg)
                break;
            messages.push(msg);
        }
        return messages;
    }
    // ── Acknowledge ───────────────────────────────────────────────────────────────
    ack(agent, msgId) {
        const qm = {
            id: msgId,
            from: agent,
            to: 'broadcast',
            type: 'ACK',
            priority: 'normal',
            payload: null,
            createdAt: new Date().toISOString(),
            status: 'acked',
            ackedAt: new Date().toISOString()
        };
        const line = JSON.stringify(qm) + '\n';
        fs.appendFileSync(this.ackPath(agent, msgId), line, 'utf8');
        LOG.log(`[Queue:${agent}] ACK id=${msgId}`);
    }
    ackReply(originalMsg, from, payload) {
        const qm = {
            id: crypto.randomUUID(),
            from,
            to: originalMsg.from,
            type: 'ACK',
            priority: 'normal',
            payload,
            replyTo: originalMsg.id,
            createdAt: new Date().toISOString(),
            ttl: 60_000,
            attempts: 0,
            status: 'acked',
            ackedAt: new Date().toISOString()
        };
        const line = JSON.stringify(qm) + '\n';
        fs.appendFileSync(this.queuePath(originalMsg.from), line, 'utf8');
    }
    // ── Retry / staleness ─────────────────────────────────────────────────────────
    isStale(qm) {
        const age = Date.now() - new Date(qm.createdAt).getTime();
        return age > (qm.ttl ?? 300_000);
    }
    isAcked(agent, msgId) {
        return fs.existsSync(this.ackPath(agent, msgId));
    }
    markStale(agent, qm) {
        qm.status = 'stale';
        const line = JSON.stringify(qm) + '\n';
        fs.appendFileSync(this.stalePath(agent), line, { flag: 'a' });
        LOG.log(`[Queue:${agent}] STALE id=${qm.id}`);
    }
    // ── Inspect ───────────────────────────────────────────────────────────────────
    /** Count messages waiting for `agent` (status=queued, not stale) */
    pendingCount(agent) {
        const qp = this.queuePath(agent);
        if (!fs.existsSync(qp))
            return 0;
        try {
            const raw = fs.readFileSync(qp, 'utf8');
            const lines = raw.split('\n').filter(Boolean);
            return lines.filter((l) => {
                try {
                    const qm = JSON.parse(l);
                    return qm.status === 'queued' && !this.isStale(qm) && !this.isAcked(agent, qm.id);
                }
                catch {
                    return false;
                }
            }).length;
        }
        catch {
            return 0;
        }
    }
    /** Return all queued message types for an agent (for debugging) */
    inspect(agent) {
        const qp = this.queuePath(agent);
        if (!fs.existsSync(qp))
            return [];
        try {
            const raw = fs.readFileSync(qp, 'utf8');
            return raw.split('\n').filter(Boolean).map((l) => {
                const qm = JSON.parse(l);
                return {
                    type: qm.type,
                    id: qm.id,
                    age: Date.now() - new Date(qm.createdAt).getTime(),
                    attempts: qm.attempts ?? 0
                };
            });
        }
        catch {
            return [];
        }
    }
    /** Rotate a queue file if it exceeds MAX_QUEUE_SIZE lines */
    rotateIfNeeded(agent) {
        const qp = this.queuePath(agent);
        if (!fs.existsSync(qp))
            return;
        try {
            const raw = fs.readFileSync(qp, 'utf8');
            const lines = raw.split('\n').filter(Boolean);
            if (lines.length < MAX_QUEUE_SIZE)
                return;
            const archive = qp + `.${Date.now()}.archive.jsonl`;
            fs.writeFileSync(archive, raw, 'utf8');
            fs.writeFileSync(qp, '', 'utf8'); // clear
            LOG.log(`[Queue:${agent}] Rotated ${lines.length} messages to ${archive}`);
        }
        catch (err) {
            LOG.warn(`[Queue:${agent}] Rotate failed: ${err}`);
        }
    }
}
