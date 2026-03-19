import { chromium } from 'playwright';
import { ALLOWLIST } from '../allowlist.js';
import { Logger } from '../Logger.js';
import fs from 'fs';
import path from 'path';
const LOG = new Logger('MetadataBrowser');
export class MetadataBrowser {
    instance;
    context;
    timeoutMs = 30_000;
    constructor() {
        LOG.log('MetadataBrowser instantiated');
    }
    async init() {
        this.instance = await chromium.launch({ headless: true, timeout: this.timeoutMs });
        this.context = await this.instance.newContext();
        LOG.log('MetadataBrowser initialised');
    }
    isAllowed(url) {
        if (url.startsWith('file://'))
            return true;
        try {
            const origin = new URL(url).origin;
            return ALLOWLIST.includes(origin);
        }
        catch {
            return false;
        }
    }
    async navigate(url) {
        if (!this.isAllowed(url)) {
            throw new Error(`Navigation blocked – origin not on allowlist: ${url}`);
        }
        if (!this.context)
            throw new Error('Browser not initialised – call init() first');
        const page = await this.context.newPage();
        await page.goto(url, { waitUntil: 'networkidle', timeout: this.timeoutMs });
        return page;
    }
    async saveSnapshot(page, identifier) {
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        const base = path.join(process.cwd(), 'fixtures', 'snapshots');
        await fs.promises.mkdir(base, { recursive: true });
        await page.screenshot({ path: path.join(base, `${identifier}-${ts}.png`) });
        const html = await page.content();
        await fs.promises.writeFile(path.join(base, `${identifier}-${ts}.html`), html, 'utf8');
        LOG.log(`Snapshot saved: ${identifier}-${ts}`);
    }
    async close() {
        await this.context?.close();
        await this.instance?.close();
        LOG.log('MetadataBrowser closed');
    }
}
