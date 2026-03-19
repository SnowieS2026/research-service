import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { Logger } from './Logger.js';

const execAsync = promisify(exec);

const LOG = new Logger('Scheduler');

export interface SchedulerOptions {
  intervalMs: number;
  onTick: () => Promise<void>;
  onSignal?: (signal: string) => void;
}

/**
 * Manages a continuous run loop with configurable interval,
 * last-run tracking, and graceful shutdown.
 */
export class Scheduler {
  private intervalMs: number;
  private onTick: () => Promise<void>;
  private onSignal?: (signal: string) => void;
  private timer: ReturnType<typeof setInterval> | null = null;
  private shuttingDown = false;
  private lastRunFile: string;
  private running = false;

  constructor(opts: SchedulerOptions) {
    this.intervalMs = opts.intervalMs;
    this.onTick = opts.onTick;
    this.onSignal = opts.onSignal;
    this.lastRunFile = path.join(process.cwd(), 'logs', 'last-run.json');
    this.setupSignalHandlers();
  }

  private setupSignalHandlers(): void {
    const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGQUIT'];
    for (const sig of signals) {
      process.on(sig, () => {
        LOG.log(`Received ${sig}, initiating graceful shutdown…`);
        this.stop();
        this.onSignal?.(sig);
      });
    }
  }

  /** Start the continuous watch loop. */
  start(): void {
    if (this.running) {
      LOG.warn('Scheduler already running');
      return;
    }
    this.running = true;
    LOG.log(`Scheduler starting, interval=${this.intervalMs}ms`);

    // Run immediately on start
    this.runOnce().catch((err) => LOG.error(`Initial tick failed: ${err}`));

    this.timer = setInterval(() => {
      this.runOnce().catch((err) => LOG.error(`Tick failed: ${err}`));
    }, this.intervalMs);
  }

  /** Stop the loop. */
  stop(): void {
    this.shuttingDown = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.running = false;
    LOG.log('Scheduler stopped');
  }

  /** Run once (also used internally for the immediate first tick). */
  async runOnce(): Promise<void> {
    if (this.shuttingDown) return;
    const start = Date.now();
    LOG.log('Scheduler tick starting…');

    try {
      await this.onTick();
      const elapsed = Date.now() - start;
      this.recordRun(elapsed);
      LOG.log(`Scheduler tick completed in ${elapsed}ms`);
    } catch (err) {
      LOG.error(`Scheduler tick error: ${err}`);
    }
  }

  private recordRun(durationMs: number): void {
    try {
      fs.mkdirSync(path.dirname(this.lastRunFile), { recursive: true });
      const state = {
        lastRunAt: new Date().toISOString(),
        durationMs
      };
      fs.writeFileSync(this.lastRunFile, JSON.stringify(state, null, 2), 'utf8');
    } catch (err) {
      LOG.warn(`Failed to record run state: ${err}`);
    }
  }

  isRunning(): boolean {
    return this.running;
  }
}

/** Sleep utility for rate limiting. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs a shell command and returns stdout.
 * Throws on non-zero exit code.
 */
export async function runCommand(cmd: string, cwd?: string): Promise<string> {
  try {
    const { stdout } = await execAsync(cmd, { cwd, timeout: 120_000 });
    return stdout;
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; code?: number };
    const msg = e.stderr ?? e.stdout ?? String(err);
    throw new Error(`Command failed (${e.code}): ${msg}`);
  }
}
