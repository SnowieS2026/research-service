import { chromium } from 'playwright';
import { allowlist } from './allowlist';
import { Logger } from '../../../src/Logger';
import fs from 'fs';
import path from 'path';
const LOG = new Logger('MetadataBrowser');
export class MetadataBrowser {
    instance;
    context;
    allowlist;
    timeoutMs = 30_000;
    constructor() {
        this.allowlist = allowlist;
        LOG.log('MetadataBrowser instantiated');
    }
    async init() {
        this.instance = await chromium.launch({
            headless: true,
            timeout: this.timeoutMs
        });
        this.context = await this.instance.newContext();
        LOG.log('MetadataBrowser context created');
    }
    isAllowed(url) {
        try {
            const host = new URL(url).origin;
            return this.allowlist.includes(host);
        }
        catch {
            return false;
        }
    }
    async navigate(url, retry = 0) {
        if (!this.isAllowed(url)) {
            throw new Error(`Navigation blocked – URL ${url} not on allowlist`);
        }
        const page = await this.context.newPage();
        await page.goto(url, { waitUntil: 'networkidle' });
        return page;
    }
    async captureSnapshot(url, identifier) {
        const page = await this.navigate(url);
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        const base = path.join(process.cwd(), 'fixtures', 'snapshots');
        await fs.promises.mkdir(base, { recursive: true });
        await page.screenshot({ path: path.join(base, `${identifier}-${ts}.png`) });
        const html = await page.content();
        await fs.promises.writeFile(path.join(base, `${identifier}-${ts}.html`), html);
        LOG.log(`Snapshot stored: ${identifier}-${ts}`);
    }
    async close() {
        await this.context?.close();
        await this.instance.close();
        LOG.log('MetadataBrowser closed');
    }
}
