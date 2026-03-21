import { BaseParser } from './BaseParser.js';
import crypto from 'crypto';
/**
 * Fast synchronous DOM extraction — runs inside browser context.
 * Must NOT reference `this` or class methods.
 * Accesses `document` directly (global in browser).
 */
function extractIntigritiData() {
    // Program name
    const h1 = document.querySelector('.program-header h1, .page-header h1');
    const title = h1?.textContent?.trim() ?? '';
    if (!title)
        return null;
    const scopeAssets = [];
    const exclusions = [];
    let rewardRange = '';
    let description = '';
    let lastUpdated = '';
    // Iterate all detail boxes
    const boxes = document.querySelectorAll('.detail-box');
    for (const box of boxes) {
        const labelEl = box.querySelector('.detail-header .label');
        const label = labelEl?.textContent?.trim() ?? '';
        const labelLower = label.toLowerCase();
        if (labelLower.includes('description')) {
            const content = box.querySelector('.detail-content');
            description = content?.textContent?.trim() ?? '';
        }
        else if (labelLower.includes('in scope') || labelLower.includes('target')) {
            const cols = box.querySelectorAll('.detail-content .column');
            for (const col of cols) {
                const text = col.textContent?.trim() ?? '';
                if (text && text.length > 2)
                    scopeAssets.push(text);
            }
        }
        else if (labelLower.includes('out of scope')) {
            const cols = box.querySelectorAll('.detail-content .column');
            for (const col of cols) {
                const text = col.textContent?.trim() ?? '';
                if (text && text.length > 2)
                    exclusions.push(text);
            }
        }
        else if (labelLower.includes('bounty')) {
            const rows = box.querySelectorAll('.bounty-table-row-container');
            for (const row of rows) {
                const cells = row.querySelectorAll('.column');
                if (cells.length >= 2) {
                    const severity = cells[0].textContent?.trim() ?? '';
                    const amount = cells[cells.length - 1].textContent?.trim() ?? '';
                    if (severity && amount) {
                        rewardRange = `${severity} ${amount}`;
                        break; // take first (highest) row
                    }
                }
            }
        }
        else if (labelLower.includes('updated') || labelLower.includes('last')) {
            const content = box.querySelector('.detail-content');
            lastUpdated = content?.textContent?.trim() ?? '';
        }
    }
    // Allowed techniques
    const bodyText = document.body?.textContent ?? '';
    const kw = ['SQLi', 'XSS', 'CSRF', 'SSRF', 'IDOR', 'RCE', 'LFI', 'RFI', 'XXE', 'OAuth'];
    const techniques = kw.filter((k) => bodyText.includes(k));
    return { title, scopeAssets, exclusions, rewardRange, description, techniques, lastUpdated };
}
export class IntigritiParser extends BaseParser {
    constructor(logger) {
        super(logger);
    }
    hashContent(text) {
        return crypto.createHash('sha256').update(text).digest('hex');
    }
    async parse(page, url) {
        // Use evaluate with the standalone function (not a class method)
        // This runs in browser context where `this` won't be the class instance
        let data = null;
        try {
            data = await page.evaluate(extractIntigritiData);
        }
        catch (err) {
            this.logger.warn(`IntigritiParser evaluate failed: ${err.message}`);
        }
        const html = await page.content();
        const hash = this.hashContent(html);
        // If evaluate returned null, fall back to basic HTML title
        const title = data?.title ?? await this.fallbackTitle(page);
        const scopeAssets = data?.scopeAssets ?? [];
        const exclusions = data?.exclusions ?? [];
        const rewardRange = data?.rewardRange ?? '';
        const description = data?.description ?? '';
        const techniques = data?.techniques ?? [];
        const result = {
            platform: 'intigriti',
            program_name: title || 'Unknown',
            program_url: url,
            scope_assets: scopeAssets,
            exclusions,
            reward_range: rewardRange || 'unknown',
            reward_currency: 'EUR',
            payout_notes: description.slice(0, 500),
            allowed_techniques: techniques,
            prohibited_techniques: [],
            last_seen_at: this.parseDate(data?.lastUpdated ?? ''),
            source_snapshot_hash: hash
        };
        this.logger.log(`IntigritiParser: ${result.program_name} | ${result.scope_assets.length} assets`);
        return result;
    }
    async fallbackTitle(page) {
        try {
            const el = page.locator('.program-header h1, .page-header h1').first();
            if (await el.count() > 0) {
                return (await el.textContent())?.trim() ?? '';
            }
        }
        catch { /* ignore */ }
        return '';
    }
    parseDate(text) {
        if (!text)
            return new Date().toISOString().split('T')[0];
        try {
            const d = new Date(text);
            if (!isNaN(d.getTime()))
                return d.toISOString().split('T')[0];
        }
        catch { /* ignore */ }
        return new Date().toISOString().split('T')[0];
    }
}
