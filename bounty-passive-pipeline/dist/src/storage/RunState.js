import fs from 'fs';
import path from 'path';
import { Logger } from '../Logger.js';
const LOG = new Logger('RunState');
const STATE_FILE = path.join(process.cwd(), 'logs', 'last-run.json');
const DEFAULT_STATE = {
    lastRunAt: '',
    lastProgramsSeen: [],
    lastSnapshots: {},
    version: 1
};
export class RunStateManager {
    state;
    constructor() {
        this.state = this.load();
    }
    load() {
        try {
            if (fs.existsSync(STATE_FILE)) {
                const raw = fs.readFileSync(STATE_FILE, 'utf8');
                const parsed = JSON.parse(raw);
                LOG.log(`RunState loaded from ${STATE_FILE}`);
                return { ...DEFAULT_STATE, ...parsed };
            }
        }
        catch (err) {
            LOG.warn(`Failed to load RunState: ${err}`);
        }
        return { ...DEFAULT_STATE };
    }
    persist() {
        try {
            const dir = path.dirname(STATE_FILE);
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2), 'utf8');
        }
        catch (err) {
            LOG.error(`Failed to persist RunState: ${err}`);
        }
    }
    getState() {
        return { ...this.state };
    }
    recordRun() {
        this.state.lastRunAt = new Date().toISOString();
        this.persist();
    }
    recordProgramsSeen(programs) {
        this.state.lastProgramsSeen = [...new Set(programs)];
        this.persist();
    }
    recordSnapshot(programUrl, hash) {
        this.state.lastSnapshots[programUrl] = {
            hash,
            fetchedAt: new Date().toISOString()
        };
        this.persist();
    }
    getLastSnapshot(programUrl) {
        return this.state.lastSnapshots[programUrl];
    }
    getLastRunAt() {
        return this.state.lastRunAt;
    }
    /** Returns true if a program was seen in the last run. */
    wasSeenLastRun(programUrl) {
        return this.state.lastProgramsSeen.includes(programUrl);
    }
    reset() {
        this.state = { ...DEFAULT_STATE };
        this.persist();
        LOG.log('RunState reset');
    }
}
