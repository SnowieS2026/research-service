/**
 * DiscoveryAgent – discovers bug bounty programs across all configured platforms.
 *
 * Receives: DISCOVER:START from coordinator
 * Sends:
 *   - DISCOVER:DONE → coordinator
 *   - BROWSER:FETCH → browser (direct fast-track for new programs)
 */
import { BaseAgent } from './BaseAgent.js';
import { Logger } from '../Logger.js';
import { MetadataBrowser } from '../browser/MetadataBrowser.js';
import { SnapshotManager } from '../storage/SnapshotManager.js';
import { RunStateManager } from '../storage/RunState.js';
import { seedFromTargets } from '../SeedingDiscovery.js';
import path from 'path';
import fs from 'fs';
const LOG = new Logger('Agent:Discovery');
export class DiscoveryAgent extends BaseAgent {
    PIPELINE_ROOT;
    browser;
    snapshotMgr;
    runState;
    constructor(pipelineRoot) {
        super('discovery', {
            queueDir: path.join(pipelineRoot ?? process.cwd(), 'logs', 'agent-queue'),
            pollIntervalMs: 3_000,
            repairThreshold: 3
        });
        this.PIPELINE_ROOT = pipelineRoot ?? process.cwd();
    }
    async setup() {
        this.log.log('DiscoveryAgent setting up…');
        this.browser = new MetadataBrowser();
        await this.browser.init();
        this.snapshotMgr = new SnapshotManager();
        this.runState = new RunStateManager();
        this.log.log('DiscoveryAgent ready');
    }
    async onShutdown() {
        await this.browser?.close();
        this.log.log('DiscoveryAgent shut down');
    }
    async handleMessage(msg) {
        switch (msg.type) {
            case 'DISCOVER:START': {
                const payload = msg.payload;
                LOG.log(`DISCOVER:START (tick #${payload.tickCount})`);
                const errors = [];
                try {
                    const results = await Promise.allSettled(payload.platforms.map((platform) => this.discoverPlatform(platform)));
                    const allPrograms = [];
                    const newPrograms = [];
                    const seenUrls = new Set();
                    for (const result of results) {
                        if (result.status === 'rejected') {
                            errors.push(String(result.reason));
                            continue;
                        }
                        const { programs, new: newProgs } = result.value;
                        for (const p of programs) {
                            if (!seenUrls.has(p)) {
                                seenUrls.add(p);
                                allPrograms.push(p);
                            }
                        }
                        for (const p of newProgs) {
                            if (!seenUrls.has(p)) {
                                seenUrls.add(p);
                                newPrograms.push(p);
                            }
                        }
                    }
                    // Seed from TARGET_PROGRAMS
                    const seeded = seedFromTargets(this.loadTargetPrograms());
                    for (const s of seeded) {
                        if (!seenUrls.has(s.url)) {
                            seenUrls.add(s.url);
                            allPrograms.push(s.url);
                        }
                    }
                    const filteredPrograms = this.filterProgramUrls(allPrograms);
                    const filteredNew = this.filterProgramUrls(newPrograms);
                    LOG.log(`DISCOVER:DONE – ${filteredPrograms.length} programs (${filteredNew.length} new)`);
                    this.send('coordinator', 'DISCOVER:DONE', { programs: filteredPrograms, newPrograms: filteredNew, errors }, 'high');
                    // Fast-track new programs to browser
                    if (filteredNew.length > 0) {
                        for (const programUrl of filteredNew) {
                            const platform = detectPlatform(programUrl);
                            if (!platform)
                                continue;
                            this.send('browser', 'BROWSER:FETCH', {
                                programUrl, platform, fastTrack: true, pipelineRoot: this.PIPELINE_ROOT
                            });
                        }
                        LOG.log(`Fast-tracked ${filteredNew.length} new programs to browser`);
                    }
                }
                catch (err) {
                    const errMsg = String(err);
                    LOG.error(`DISCOVER:START failed: ${errMsg}`);
                    this.send('coordinator', 'DISCOVER:DONE', { programs: [], newPrograms: [], errors: [errMsg] }, 'high');
                }
                return true;
            }
            default:
                return false;
        }
    }
    // ── Platform discovery ────────────────────────────────────────────────────────
    async discoverPlatform(platform) {
        if (!this.browser)
            throw new Error('Browser not initialized');
        try {
            return await this.runBrowserDiscovery(platform);
        }
        catch (err) {
            LOG.warn(`${platform}: discovery failed (${err})`);
            return { programs: [], new: [] };
        }
    }
    async runBrowserDiscovery(platform) {
        if (!this.browser)
            throw new Error('Browser not initialized');
        const baseUrls = this.getPlatformBaseUrls(platform);
        const programs = [];
        for (const baseUrl of baseUrls) {
            try {
                LOG.log(`Discovery: ${baseUrl}`);
                const page = await this.browser.navigate(baseUrl);
                await page.waitForSelector('body', { timeout: 8_000 }).catch(() => { });
                await new Promise((r) => setTimeout(r, 1_500)); // allow SPA to render
                const html = await page.content();
                const found = this.parseHtmlPrograms(html, platform);
                programs.push(...found);
                LOG.log(`${platform} at ${baseUrl}: ${found.length} programs`);
            }
            catch (err) {
                LOG.warn(`Discovery failed for ${baseUrl}: ${err}`);
            }
        }
        const newPrograms = this.findNewPrograms(programs, platform);
        return { programs, new: newPrograms };
    }
    parseHtmlPrograms(html, platform) {
        switch (platform) {
            case 'bugcrowd': return this.parseBugcrowd(html);
            case 'hackerone': return this.parseHackerone(html);
            case 'intigriti': return this.parseIntigriti(html);
            case 'standoff365': return this.parseStandoff(html);
            default: return [];
        }
    }
    parseBugcrowd(html) {
        const urls = [];
        const re = /href="(\/engagements\/[a-z0-9-]+)"/gi;
        let m;
        while ((m = re.exec(html)) !== null)
            urls.push(`https://bugcrowd.com${m[1]}`);
        return [...new Set(urls)];
    }
    parseHackerone(html) {
        const urls = [];
        const re = /href="(\/programs\/[a-z0-9_-]+)"/gi;
        let m;
        while ((m = re.exec(html)) !== null)
            urls.push(`https://hackerone.com${m[1]}`);
        return [...new Set(urls)];
    }
    parseIntigriti(html) {
        const urls = [];
        const re = /href="(\/programs\/[a-z0-9_-]+\/[a-z0-9_-]+)"/gi;
        let m;
        while ((m = re.exec(html)) !== null)
            urls.push(`https://app.intigriti.com${m[1]}`);
        return [...new Set(urls)];
    }
    parseStandoff(html) {
        const urls = [];
        const re = /href="(\/programs\/[a-z0-9_-]+)"/gi;
        let m;
        while ((m = re.exec(html)) !== null)
            urls.push(`https://bugbounty.standoff365.com/en-US${m[1]}`);
        return [...new Set(urls)];
    }
    getPlatformBaseUrls(platform) {
        switch (platform) {
            case 'bugcrowd':
                return ['https://bugcrowd.com/programs', 'https://bugcrowd.com/engagements/featured'];
            case 'hackerone':
                return ['https://hackerone.com/programs'];
            case 'intigriti':
                return ['https://www.intigriti.com/researchers/bug-bounty-programs'];
            case 'standoff365':
                return ['https://bugbounty.standoff365.com/en-US/'];
            default:
                return [];
        }
    }
    filterProgramUrls(urls) {
        const PREFIXES = ['/engagements/', '/programs/'];
        return urls.filter((url) => {
            try {
                const u = new URL(url);
                const p = u.pathname;
                const hasPrefix = PREFIXES.some((pf) => p.includes(pf));
                const excluded = p.includes('/user/') || p.includes('/sign_in') || p.includes('/login') ||
                    p.includes('/signup') || p.includes('/featured') || p.includes('/staff-picks') ||
                    p.includes('/settings') || p.includes('/search') || p === '/' || p.endsWith('.com');
                return hasPrefix && !excluded;
            }
            catch {
                return false;
            }
        });
    }
    findNewPrograms(programs, platform) {
        if (!this.runState)
            return [];
        const state = this.runState.getState();
        const key = `programs_seen_${platform}`;
        const prev = state[key] ?? [];
        return programs.filter((p) => !prev.includes(p));
    }
    loadTargetPrograms() {
        try {
            const cfg = path.join(this.PIPELINE_ROOT, 'config.json');
            if (fs.existsSync(cfg))
                return JSON.parse(fs.readFileSync(cfg, 'utf8')).TARGET_PROGRAMS ?? [];
        }
        catch { /* ignore */ }
        return [];
    }
}
function detectPlatform(url) {
    const l = url.toLowerCase();
    if (l.includes('bugcrowd.com'))
        return 'bugcrowd';
    if (l.includes('hackerone.com'))
        return 'hackerone';
    if (l.includes('intigriti.com'))
        return 'intigriti';
    if (l.includes('standoff365.com'))
        return 'standoff365';
    return null;
}
