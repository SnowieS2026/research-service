import fs from 'fs';
import path from 'path';
import { Logger } from '../Logger.js';

const LOG = new Logger('RunState');
const STATE_FILE = path.join(process.cwd(), 'logs', 'last-run.json');

export interface ProgramSnapshotRef {
  hash: string;
  fetchedAt: string;
}

export interface RunState {
  lastRunAt: string;
  lastProgramsSeen: string[];
  lastSnapshots: Record<string, ProgramSnapshotRef>;
  version: number;
}

const DEFAULT_STATE: RunState = {
  lastRunAt: '',
  lastProgramsSeen: [],
  lastSnapshots: {},
  version: 1
};

export class RunStateManager {
  private state: RunState;

  constructor() {
    this.state = this.load();
  }

  private load(): RunState {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const raw = fs.readFileSync(STATE_FILE, 'utf8');
        const parsed = JSON.parse(raw) as Partial<RunState>;
        LOG.log(`RunState loaded from ${STATE_FILE}`);
        return { ...DEFAULT_STATE, ...parsed };
      }
    } catch (err) {
      LOG.warn(`Failed to load RunState: ${err}`);
    }
    return { ...DEFAULT_STATE };
  }

  private persist(): void {
    try {
      const dir = path.dirname(STATE_FILE);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2), 'utf8');
    } catch (err) {
      LOG.error(`Failed to persist RunState: ${err}`);
    }
  }

  getState(): RunState {
    return { ...this.state };
  }

  recordRun(): void {
    this.state.lastRunAt = new Date().toISOString();
    this.persist();
  }

  recordProgramsSeen(programs: string[]): void {
    this.state.lastProgramsSeen = [...new Set(programs)];
    this.persist();
  }

  recordSnapshot(programUrl: string, hash: string): void {
    this.state.lastSnapshots[programUrl] = {
      hash,
      fetchedAt: new Date().toISOString()
    };
    this.persist();
  }

  getLastSnapshot(programUrl: string): ProgramSnapshotRef | undefined {
    return this.state.lastSnapshots[programUrl];
  }

  getLastRunAt(): string {
    return this.state.lastRunAt;
  }

  /** Returns true if a program was seen in the last run. */
  wasSeenLastRun(programUrl: string): boolean {
    return this.state.lastProgramsSeen.includes(programUrl);
  }

  reset(): void {
    this.state = { ...DEFAULT_STATE };
    this.persist();
    LOG.log('RunState reset');
  }
}
