import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { Logger } from './Logger.js';
const execAsync = promisify(exec);
const LOG = new Logger('Scheduler');
/**
 * Manages a continuous run loop with configurable interval,
 * last-run tracking, and graceful shutdown.
 */
export class Scheduler {
    intervalMs;
    onTick;
    onSignal;
    timer = null;
    shuttingDown = false;
    lastRunFile;
    running = false;
    constructor(opts) {
        this.intervalMs = opts.intervalMs;
        this.onTick = opts.onTick;
        this.onSignal = opts.onSignal;
        this.lastRunFile = path.join(process.cwd(), 'logs', 'last-run.json');
        this.setupSignalHandlers();
    }
    setupSignalHandlers() {
        const signals = ['SIGTERM', 'SIGINT', 'SIGQUIT'];
        for (const sig of signals) {
            process.on(sig, () => {
                LOG.log(`Received ${sig}, initiating graceful shutdown…`);
                this.stop();
                this.onSignal?.(sig);
            });
        }
    }
    /** Start the continuous watch loop. */
    start() {
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
    stop() {
        this.shuttingDown = true;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.running = false;
        LOG.log('Scheduler stopped');
    }
    /** Run once (also used internally for the immediate first tick). */
    async runOnce() {
        if (this.shuttingDown)
            return;
        const start = Date.now();
        LOG.log('Scheduler tick starting…');
        try {
            await this.onTick();
            const elapsed = Date.now() - start;
            this.recordRun(elapsed);
            LOG.log(`Scheduler tick completed in ${elapsed}ms`);
        }
        catch (err) {
            LOG.error(`Scheduler tick error: ${err}`);
        }
    }
    recordRun(durationMs) {
        try {
            fs.mkdirSync(path.dirname(this.lastRunFile), { recursive: true });
            const state = {
                lastRunAt: new Date().toISOString(),
                durationMs
            };
            fs.writeFileSync(this.lastRunFile, JSON.stringify(state, null, 2), 'utf8');
        }
        catch (err) {
            LOG.warn(`Failed to record run state: ${err}`);
        }
    }
    isRunning() {
        return this.running;
    }
}
/** Sleep utility for rate limiting. */
export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Runs a shell command and returns stdout.
 * Throws on non-zero exit code.
 */
export async function runCommand(cmd, cwd) {
    try {
        const { stdout } = await execAsync(cmd, { cwd, timeout: 120_000 });
        return stdout;
    }
    catch (err) {
        const e = err;
        const msg = e.stderr ?? e.stdout ?? String(err);
        throw new Error(`Command failed (${e.code}): ${msg}`);
    }
}
