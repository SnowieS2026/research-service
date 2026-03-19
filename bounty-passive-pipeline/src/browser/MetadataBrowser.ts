import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { ALLOWLIST } from '../allowlist.js';
import { Logger } from '../Logger.js';
import fs from 'fs';
import path from 'path';

const LOG = new Logger('MetadataBrowser');

export class MetadataBrowser {
  private instance: Browser | undefined;
  private context: BrowserContext | undefined;
  private readonly timeoutMs = 30_000;

  constructor() {
    LOG.log('MetadataBrowser instantiated');
  }

  async init(): Promise<void> {
    this.instance = await chromium.launch({ headless: true, timeout: this.timeoutMs });
    this.context = await this.instance.newContext();
    LOG.log('MetadataBrowser initialised');
  }

  private isAllowed(url: string): boolean {
    if (url.startsWith('file://')) return true;
    try {
      const origin = new URL(url).origin;
      return ALLOWLIST.includes(origin);
    } catch {
      return false;
    }
  }

  async navigate(url: string): Promise<Page> {
    if (!this.isAllowed(url)) {
      throw new Error(`Navigation blocked – origin not on allowlist: ${url}`);
    }
    if (!this.context) throw new Error('Browser not initialised – call init() first');
    const page = await this.context.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: this.timeoutMs });
    return page;
  }

  async saveSnapshot(page: Page, identifier: string): Promise<void> {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const base = path.join(process.cwd(), 'fixtures', 'snapshots');
    await fs.promises.mkdir(base, { recursive: true });
    await page.screenshot({ path: path.join(base, `${identifier}-${ts}.png`) });
    const html = await page.content();
    await fs.promises.writeFile(path.join(base, `${identifier}-${ts}.html`), html, 'utf8');
    LOG.log(`Snapshot saved: ${identifier}-${ts}`);
  }

  async close(): Promise<void> {
    await this.context?.close();
    await this.instance?.close();
    LOG.log('MetadataBrowser closed');
  }
}
