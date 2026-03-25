/**
 * AgentMessage – typed message envelope for all inter-agent communication.
 * All messages are written to a queue file and acknowledged via a reply-to file
 * so agents can operate fully async without blocking on replies.
 */
import crypto from 'crypto';
export function createMessage(from, to, type, payload, opts) {
    return {
        id: crypto.randomUUID(),
        from,
        to,
        type,
        priority: opts?.priority ?? 'normal',
        payload,
        replyTo: opts?.replyTo,
        createdAt: new Date().toISOString(),
        ttl: opts?.ttl ?? 300_000,
        attempts: 0
    };
}
export function createReply(original, from, payload, type = 'ACK') {
    return createMessage(from, original.from, type, payload, {
        replyTo: original.id,
        priority: 'normal'
    });
}
