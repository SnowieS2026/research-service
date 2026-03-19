import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Logger } from '../Logger.js';
const LOG = new Logger('SnapshotManager');
const STORE = path.join(process.cwd(), 'logs', 'snapshots');
export class SnapshotManager {
    constructor() {
        LOG.log('SnapshotManager initialised');
    }
    /** Store a snapshot and return its deterministic SHA-256 hash. */
    async store(data, identifier) {
        const json = JSON.stringify(data);
        const hash = crypto.createHash('sha256').update(json).digest('hex');
        const dest = path.join(STORE, `${identifier}-${hash}.json`);
        await fs.promises.mkdir(STORE, { recursive: true });
        await fs.promises.writeFile(dest, json, 'utf8');
        LOG.log(`Snapshot stored: ${dest}`);
        return hash;
    }
    /** Load a snapshot by its hash (filename = identifier-hash.json). */
    async load(identifier, hash) {
        const file = path.join(STORE, `${identifier}-${hash}.json`);
        const content = await fs.promises.readFile(file, 'utf8');
        return JSON.parse(content);
    }
    /** List all hashes stored for a given identifier. */
    async list(identifier) {
        let files = [];
        try {
            files = await fs.promises.readdir(STORE);
        }
        catch {
            return [];
        }
        return files
            .filter(f => f.startsWith(`${identifier}-`) && f.endsWith('.json'))
            .map(f => f.replace(`${identifier}-`, '').replace('.json', ''));
    }
}
