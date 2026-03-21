import { BaseParser } from './BaseParser.js';
import crypto from 'crypto';
/**
 * Parses a HackerOne program page into a NormalisedProgram.
 *
 * Selectors are based on HackerOne's React app structure (spec-bbp class).
 * Uses structured tables for scope and rewards.
 */
export class HackerOneParser extends BaseParser {
    constructor(logger) {
        super(logger);
    }
    hashContent(text) {
        return crypto.createHash('sha256').update(text).digest('hex');
    }
    async parse(page, url) {
        // Program name — h1 in the program hero
        const title = await this.safeExtract(page, '.program-hero .program-title, h1');
        // Scope assets — in-scope table (exclude out-of-scope)
        const scopeAssets = await this.extractScopeAssets(page);
        // Exclusions — out-of-scope table
        const exclusions = await this.extractExclusions(page);
        // Reward range — highest bounty tier (Critical)
        const rewardRange = await this.extractRewardRange(page);
        // Payout notes — any additional notes
        const payoutNotes = await this.safeExtract(page, '.program-description');
        // Allowed techniques — scan body text for known technique keywords
        const allowedTechniques = await this.extractAllowedTechniques(page);
        // Last updated date
        const lastSeenAt = await this.safeExtract(page, '.program-updated');
        const html = await page.content();
        const hash = this.hashContent(html);
        const result = {
            platform: 'hackerone',
            program_name: title || 'Unknown',
            program_url: url,
            scope_assets: scopeAssets,
            exclusions,
            reward_range: rewardRange || 'unknown',
            reward_currency: 'USD',
            payout_notes: payoutNotes || '',
            allowed_techniques: allowedTechniques,
            prohibited_techniques: [],
            last_seen_at: this.parseDate(lastSeenAt),
            source_snapshot_hash: hash
        };
        this.logger.log(`HackerOneParser: ${result.program_name} | ${scopeAssets.length} assets | rewards: ${rewardRange || 'n/a'}`);
        return result;
    }
    async safeExtract(page, selector) {
        try {
            const el = page.locator(selector).first();
            if (await el.count() > 0) {
                return (await el.textContent())?.trim() ?? '';
            }
        }
        catch { /* fall through */ }
        return '';
    }
    async extractScopeAssets(page) {
        const assets = [];
        // HackerOne scope tables: use CSS class to distinguish in/out of scope
        // .scope-table           → in-scope
        // .scope-table.out-of-scope → out-of-scope (skip)
        const inScopeRows = page.locator('.scope-table:not(.out-of-scope) tbody tr td:first-child');
        const count = await inScopeRows.count();
        for (let i = 0; i < count; i++) {
            const text = (await inScopeRows.nth(i).textContent())?.trim() ?? '';
            if (text && text.length > 3)
                assets.push(text);
        }
        return [...new Set(assets)];
    }
    async extractExclusions(page) {
        const exclusions = [];
        // HackerOne v1/v2 fixtures: out-of-scope table has class "scope-table out-of-scope"
        const outCells = page.locator('.scope-table.out-of-scope tbody tr td:first-child');
        const count = await outCells.count();
        for (let i = 0; i < count; i++) {
            const text = (await outCells.nth(i).textContent())?.trim() ?? '';
            if (text)
                exclusions.push(text);
        }
        return exclusions;
    }
    async extractRewardRange(page) {
        // Get the Critical severity row — highest bounty
        try {
            const criticalRow = page.locator('.rewards-table tr:has-text("Critical")');
            if (await criticalRow.count() > 0) {
                const cells = criticalRow.locator('td');
                const cellCount = await cells.count();
                if (cellCount >= 2) {
                    return (await cells.nth(cellCount - 1).textContent())?.trim() ?? '';
                }
            }
        }
        catch { /* fall through */ }
        // Fallback: any text with dollar amounts near severity labels
        try {
            const bodyText = await page.locator('body').textContent() ?? '';
            // Match "$X,XXX – $XX,XXX" pattern near "Critical" or "High"
            const match = bodyText.match(/(?:Critical|High|Medium|Low)\s*[\n\r]*\$[\d,]+[\s\u2013-]*\$?[\d,]+/);
            if (match)
                return match[0].replace(/\s+/g, ' ').trim();
        }
        catch { /* ignore */ }
        return '';
    }
    async extractAllowedTechniques(page) {
        const techniques = [];
        try {
            const bodyText = await page.locator('body').textContent() ?? '';
            const keywords = ['SQLi', 'XSS', 'CSRF', 'SSRF', 'IDOR', 'RCE', 'LFI', 'RFI', 'XXE', 'OAuth'];
            for (const kw of keywords) {
                if (bodyText.includes(kw))
                    techniques.push(kw);
            }
        }
        catch { /* ignore */ }
        return [...new Set(techniques)];
    }
    parseDate(text) {
        if (!text)
            return new Date().toISOString().split('T')[0];
        // Extract "Updated November 12, 2024" → "2024-11-12"
        const match = text.match(/Updated?\s*(\w+\s+\d{1,2},?\s+\d{4})/i);
        if (match) {
            try {
                return new Date(match[1]).toISOString().split('T')[0];
            }
            catch { /* fall through */ }
        }
        // Try plain date
        try {
            return new Date(text).toISOString().split('T')[0];
        }
        catch {
            return new Date().toISOString().split('T')[0];
        }
    }
}
