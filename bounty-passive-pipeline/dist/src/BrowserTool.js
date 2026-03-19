import { MetadataBrowser } from './browser/MetadataBrowser.js';
import { BugcrowdParser } from './browser/parsers/BugcrowdParser.js';
import { SnapshotManager } from './storage/SnapshotManager.js';
import { diffPrograms } from './diff/ProgramDiffer.js';
import { Logger } from './Logger.js';
import path from 'path';
const LOG = new Logger('BrowserTool');
/**
 * Orchestrates: browser → parser → snapshot → diff.
 * Produces a DiffNotification ready for the notifier.
 */
export class BrowserTool {
    browser;
    snapshotMgr;
    constructor() {
        this.browser = new MetadataBrowser();
        this.snapshotMgr = new SnapshotManager();
        LOG.log('BrowserTool constructed');
    }
    async init() {
        await this.browser.init();
    }
    async shutdown() {
        await this.browser.close();
    }
    /**
     * Load a local HTML fixture and process it through the full pipeline.
     * @param fixturePath Absolute path to a local HTML file (file:// URL)
     */
    async processFixture(fixturePath) {
        const identifier = path.parse(fixturePath).name;
        // 1. Navigate (local fixture via file://)
        const page = await this.browser.navigate(fixturePath);
        // 2. Parse with BugcrowdParser
        const parser = new BugcrowdParser(LOG);
        const program = await parser.parse(page, fixturePath);
        // 3. Store snapshot → get deterministic hash
        const hash = await this.snapshotMgr.store(program, identifier);
        // 4. Load previous snapshot for same identifier (if any)
        const prevHashes = await this.snapshotMgr.list(identifier);
        const prevHash = prevHashes.find((h) => h !== hash);
        let diffResult = {
            oldHash: prevHash ?? hash,
            newHash: hash,
            addedFields: [],
            removedFields: [],
            changedFields: []
        };
        if (prevHash && prevHash !== hash) {
            const prevProg = (await this.snapshotMgr.load(identifier, prevHash));
            const diff = diffPrograms(prevProg, program, prevHash, hash, identifier);
            diffResult = {
                oldHash: diff.oldHash,
                newHash: diff.newHash,
                addedFields: diff.addedFields.map((f) => f.field),
                removedFields: diff.removedFields.map((f) => f.field),
                changedFields: diff.changedFields.map((f) => f.field)
            };
            LOG.log(`Diff for ${identifier}: +${diff.addedFields.length} ~${diff.changedFields.length} -${diff.removedFields.length}`);
        }
        // 5. Build notification payload
        const notification = {
            ...program,
            diff: diffResult
        };
        LOG.log(`Notification produced for ${identifier}: ${JSON.stringify(notification.diff)}`);
        return notification;
    }
}
