/**
 * AgentRunner — runs all agents as a single unified pipeline process.
 *
 * Usage:
 *   node dist/src/agents/run.js              # run all agents
 *   node dist/src/agents/run.js coordinator   # run coordinator only
 *   node dist/src/agents/run.js browser      # run browser agent only
 *
 * Each agent runs in its own async task, all sharing the same event loop.
 * The process exits gracefully on SIGTERM/SIGINT.
 *
 * Agent-to-agent communication happens entirely through the queue files
 * (logs/agent-queue/*.queue.jsonl), so there's no shared memory or
 * concurrent-write issues.
 */
import { CoordinatorAgent } from './CoordinatorAgent.js';
import { DiscoveryAgent } from './DiscoveryAgent.js';
import { BrowserAgent } from './BrowserAgent.js';
import { ScannerAgent } from './ScannerAgent.js';
import { ReporterAgent } from './ReporterAgent.js';
import { RepairAgent } from './RepairAgent.js';
import { AdaptationAgent } from './AdaptationAgent.js';
import { Logger } from '../Logger.js';
import { BountyDB } from '../storage/BountyDB.js';
import path from 'path';

const LOG = new Logger('AgentRunner');

const PIPELINE_ROOT = process.cwd();

async function getDb(): Promise<BountyDB | undefined> {
  try {
    return new BountyDB(path.join(PIPELINE_ROOT, 'logs', 'bounty.db'));
  } catch (err) {
    LOG.warn(`DB unavailable: ${err}`);
    return undefined;
  }
}

async function runAll(): Promise<void> {
  LOG.log('=== Starting all agents ===');

  const db = await getDb();

  // Start coordinator first (owns the scheduler)
  const coordinator = new CoordinatorAgent({
    watchIntervalMs: 1_800_000, // 30 min
    db,
    pipelineRoot: PIPELINE_ROOT
  });

  const discovery = new DiscoveryAgent(PIPELINE_ROOT);
  const browser = new BrowserAgent(PIPELINE_ROOT);
  const scanner = new ScannerAgent(PIPELINE_ROOT);
  const reporter = new ReporterAgent(PIPELINE_ROOT);
  const repair = new RepairAgent(PIPELINE_ROOT);
  const adaptation = new AdaptationAgent(PIPELINE_ROOT);

  // Setup all agents
  await Promise.all([
    coordinator.setup().catch((err) => LOG.error(`Coordinator setup failed: ${err}`)),
    discovery.setup().catch((err) => LOG.error(`Discovery setup failed: ${err}`)),
    browser.setup().catch((err) => LOG.error(`Browser setup failed: ${err}`)),
    scanner.setup().catch((err) => LOG.error(`Scanner setup failed: ${err}`)),
    reporter.setup().catch((err) => LOG.error(`Reporter setup failed: ${err}`)),
    repair.setup().catch((err) => LOG.error(`Repair setup failed: ${err}`)),
    adaptation.setup().catch((err) => LOG.error(`Adaptation setup failed: ${err}`))
  ]);

  // Start all agents (they begin polling their queues)
  coordinator.start();
  discovery.start();
  browser.start();
  scanner.start();
  reporter.start();
  repair.start();
  adaptation.start();

  LOG.log('All agents started — pipeline running');

  // Wait for shutdown signal
  await new Promise<void>((resolve) => {
    const shutdown = async (sig: string) => {
      LOG.log(`Received ${sig} — shutting down agents…`);
      await Promise.allSettled([
        coordinator.stop(),
        discovery.stop(),
        browser.stop(),
        scanner.stop(),
        reporter.stop(),
        repair.stop(),
        adaptation.stop()
      ]);
      db?.close();
      LOG.log('AgentRunner shutdown complete');
      resolve();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  });
}

async function runSingle(agentName: string): Promise<void> {
  LOG.log(`Running single agent: ${agentName}`);

  const db = await getDb();

  switch (agentName) {
    case 'coordinator': {
      const agent = new CoordinatorAgent({ db, pipelineRoot: PIPELINE_ROOT });
      await agent.setup();
      agent.start();
      await new Promise((r) => { process.on('SIGINT', r); process.on('SIGTERM', r); });
      await agent.stop();
      break;
    }
    case 'discovery': {
      const agent = new DiscoveryAgent(PIPELINE_ROOT);
      await agent.setup();
      agent.start();
      await new Promise((r) => { process.on('SIGINT', r); process.on('SIGTERM', r); });
      await agent.stop();
      break;
    }
    case 'browser': {
      const agent = new BrowserAgent(PIPELINE_ROOT);
      await agent.setup();
      agent.start();
      await new Promise((r) => { process.on('SIGINT', r); process.on('SIGTERM', r); });
      await agent.stop();
      break;
    }
    case 'scanner': {
      const agent = new ScannerAgent(PIPELINE_ROOT);
      await agent.setup();
      agent.start();
      await new Promise((r) => { process.on('SIGINT', r); process.on('SIGTERM', r); });
      await agent.stop();
      break;
    }
    case 'reporter': {
      const agent = new ReporterAgent(PIPELINE_ROOT);
      await agent.setup();
      agent.start();
      await new Promise((r) => { process.on('SIGINT', r); process.on('SIGTERM', r); });
      await agent.stop();
      break;
    }
    case 'repair': {
      const agent = new RepairAgent(PIPELINE_ROOT);
      await agent.setup();
      agent.start();
      await new Promise((r) => { process.on('SIGINT', r); process.on('SIGTERM', r); });
      await agent.stop();
      break;
    }
    case 'adaptation': {
      const agent = new AdaptationAgent(PIPELINE_ROOT);
      await agent.setup();
      agent.start();
      await new Promise((r) => { process.on('SIGINT', r); process.on('SIGTERM', r); });
      await agent.stop();
      break;
    }
    default:
      LOG.error(`Unknown agent: ${agentName}`);
      process.exit(1);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

const agentToRun = process.argv[2];

if (agentToRun) {
  runSingle(agentToRun).catch((err) => {
    LOG.error(`Fatal: ${err}`);
    process.exit(1);
  });
} else {
  runAll().catch((err) => {
    LOG.error(`Fatal: ${err}`);
    process.exit(1);
  });
}
