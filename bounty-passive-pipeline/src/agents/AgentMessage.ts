/**
 * AgentMessage – typed message envelope for all inter-agent communication.
 * All messages are written to a queue file and acknowledged via a reply-to file
 * so agents can operate fully async without blocking on replies.
 */
import crypto from 'crypto';

export type AgentName =
  | 'coordinator'
  | 'discovery'
  | 'browser'
  | 'scanner'
  | 'reporter'
  | 'repair'
  | 'adaptation';

export type MessagePriority = 'low' | 'normal' | 'high' | 'critical';

export type MessageType =
  // Discovery
  | 'DISCOVER:START'
  | 'DISCOVER:DONE'
  | 'DISCOVER:PROGRAM'
  | 'DISCOVER:NEW_PROGRAMS'
  // Browser / snapshot
  | 'BROWSER:FETCH'
  | 'BROWSER:DONE'
  | 'BROWSER:ERROR'
  | 'SNAPSHOT:DIFF'
  // Scanner
  | 'SCAN:TARGETS'
  | 'SCAN:START'
  | 'SCAN:DONE'
  | 'SCAN:ERROR'
  | 'SCAN:TOOL_ERROR'
  // Reporter
  | 'REPORT:GENERATE'
  | 'REPORT:DONE'
  | 'REPORT:FAIL'
  // Repair
  | 'REPAIR:ISSUE'
  | 'REPAIR:START'
  | 'REPAIR:DONE'
  | 'REPAIR:FAIL'
  // Adaptation
  | 'ADAPTATION:REVIEW'
  | 'ADAPTATION:STRATEGY'
  | 'ADAPTATION:QUERY'
  | 'ADAPTATION:DUMP'
  | 'ADAPTATION:ACK'
  // Lifecycle
  | 'PING'
  | 'ACK';

export interface AgentMessage {
  id: string;          // unique message id
  from: AgentName;    // sender
  to: AgentName | 'broadcast'; // recipient
  type: MessageType;
  priority: MessagePriority;
  payload: unknown;    // typed per MessageType
  replyTo?: string;    // id of message being replied to
  createdAt: string;  // ISO timestamp
  ttl?: number;        // ms before this message is considered stale (default: 5 min)
  attempts?: number;  // delivery attempt count
}

export interface QueuedMessage extends AgentMessage {
  status: 'queued' | 'delivered' | 'acked' | 'failed' | 'stale';
  deliveredAt?: string;
  ackedAt?: string;
}

export function createMessage(
  from: AgentName,
  to: AgentName | 'broadcast',
  type: MessageType,
  payload: unknown,
  opts?: Partial<Pick<AgentMessage, 'priority' | 'replyTo' | 'ttl'>>
): AgentMessage {
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

export function createReply(
  original: AgentMessage,
  from: AgentName,
  payload: unknown,
  type: MessageType = 'ACK'
): AgentMessage {
  return createMessage(from, original.from, type, payload, {
    replyTo: original.id,
    priority: 'normal'
  });
}
