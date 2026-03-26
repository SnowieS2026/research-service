/**
 * session-startup.ts — Run at session start to prime context from vector store
 *
 * Queries the agent_memory collection with topics relevant to this session,
 * then formats the top hits as a readable context summary printed to stdout.
 *
 * The parent OpenClaw session picks this up via sessions_history or output parsing.
 * Run via: npx tsx session-startup.ts
 *
 * For use in AGENTS.md startup:
 *   npx tsx -r ./session-startup.ts
 */

import { memory } from './src/vector-store.js';

interface SessionTopic {
  /** Human-readable label */
  label: string;
  /** Query passed to vector store */
  query: string;
  /** Max results to fetch */
  n?: number;
}

const SESSION_TOPICS: SessionTopic[] = [
  // Recent work
  { label: 'Recent sessions & tasks', query: 'recent work goals tasks session', n: 3 },
  // Vehicle OSINT
  { label: 'Vehicle OSINT', query: 'vehicle Mondeo AJ05RCF car valuation MOT advisory', n: 4 },
  // Bounty pipeline
  { label: 'Bounty pipeline', query: 'bounty pipeline scanner nuclei superhuman capital', n: 3 },
  // User context
  { label: 'User preferences', query: 'user preferences Infinitara timezone bounty hunting', n: 2 },
  // OpenClaw & setup
  { label: 'OpenClaw config', query: 'OpenClaw terminal stall gateway cron', n: 2 },
];

function formatHit(hit: { id: string; content: string; metadata: Record<string, unknown>; distance?: number }, maxLen = 300): string {
  const src = hit.metadata?.file ?? hit.metadata?.type ?? hit.id;
  const dist = hit.distance !== undefined ? ` (dist=${hit.distance.toFixed(3)})` : '';
  const text = hit.content.replace(/\n+/g, ' ').trim().slice(0, maxLen);
  return `[${src}]${dist} ${text}`;
}

async function main() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  SESSION STARTUP — Vector Memory     ║');
  console.log('╚══════════════════════════════════════╝\n');

  for (const topic of SESSION_TOPICS) {
    process.stdout.write(`▸ ${topic.label}... `);
    try {
      const hits = await memory.query(topic.query, topic.n ?? 3);
      if (hits.length === 0) {
        console.log('(no results)');
        continue;
      }
      console.log(`${hits.length} hits`);
      for (const hit of hits) {
        const line = formatHit(hit);
        console.log(`  ${line}`);
      }
      console.log();
    } catch (e: unknown) {
      console.error(`ERROR: ${(e as Error).message}`);
    }
  }

  // Final memory stats
  try {
    const cnt = await memory.count();
    console.log(`Total in agent_memory: ${cnt} documents\n`);
  } catch {}

  process.exit(0);
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
