import { BaseParser } from './BaseParser.js';
import crypto from 'crypto';
/**
 * Parses a HackerOne program page into a NormalisedProgram.
 *
 * CSS selectors are based on HackerOne's public program page structure.
 * Adjust selectors as needed based on actual page markup.
 */
export class HackerOneParser extends BaseParser {
    constructor(logger) {
        super(logger);
    }
    hashContent(text) {
        return crypto.createHash('sha256').update(text).digest('hex');
    }
    async parse(page, url) {
        // Program name – typically in the hero/header area
        const title = await this.safeExtract(page, 'h1, [data-testid="program-name"], .program-name');
        // Scope assets – structured asset table or list
        const scopeAssets = await this.extractScopeAssets(page);
        // Exclusions – out-of-scope section
        const exclusions = await this.extractExclusions(page);
        // Reward range – displayed in structured bounty table
        const rewardRange = await this.safeExtract(page, '[data-testid="bounty-range"], .bounty-range, [data-testid="reward-range"], .reward-range, tr:has-text("Bounty") td:last-child');
        // Reward currency – default USD for HackerOne
        const rewardCurrency = 'USD';
        // Payout notes
        const payoutNotes = await this.safeExtract(page, '[data-testid="payout-notes"], .payout-notes, .reward-notes');
        // Allowed techniques
        const allowedTechniques = await this.extractAllowedTechniques(page);
        // Prohibited techniques
        const prohibitedTechniques = await this.extractProhibitedTechniques(page);
        // Last updated – structured date field or meta
        const lastSeenAt = await this.safeExtract(page, '[data-testid="last-updated"], .last-updated, time, tr:has-text("Last updated") td:last-child');
        const html = await page.content();
        const hash = this.hashContent(html);
        const result = {
            platform: 'hackerone',
            program_name: title || 'Unknown',
            program_url: url,
            scope_assets: scopeAssets,
            exclusions,
            reward_range: rewardRange || 'unknown',
            reward_currency: rewardCurrency,
            payout_notes: payoutNotes || '',
            allowed_techniques: allowedTechniques,
            prohibited_techniques: prohibitedTechniques,
            last_seen_at: lastSeenAt || new Date().toISOString().split('T')[0],
            source_snapshot_hash: hash
        };
        this.logger.log(`HackerOneParser produced: ${result.program_name} (${scopeAssets.length} assets)`);
        return result;
    }
    async safeExtract(page, selector) {
        try {
            const el = page.locator(selector).first();
            if (await el.count() > 0) {
                return (await el.textContent())?.trim() ?? '';
            }
        }
        catch {
            // fall through
        }
        return '';
    }
    async extractScopeAssets(page) {
        const assets = [];
        // Try common HackerOne scope table selectors
        const selectors = [
            '[data-testid="scope-table"] td:first-child',
            '.scope-table td:first-child',
            'table:has-text("In Scope") td:first-child',
            '.asset-list .asset-item',
            '[data-testid="asset"]',
            '.in-scope .asset'
        ];
        for (const sel of selectors) {
            try {
                const count = await page.locator(sel).count();
                if (count > 0) {
                    for (let i = 0; i < count; i++) {
                        const text = (await page.locator(sel).nth(i).textContent())?.trim();
                        if (text && !assets.includes(text))
                            assets.push(text);
                    }
                }
            }
            catch {
                // try next selector
            }
            if (assets.length > 0)
                break;
        }
        return assets;
    }
    async extractExclusions(page) {
        const selectors = [
            '[data-testid="out-of-scope"] td:first-child',
            '.out-of-scope td:first-child',
            'table:has-text("Out of Scope") td:first-child',
            '.exclusion-list .exclusion-item'
        ];
        for (const sel of selectors) {
            try {
                const count = await page.locator(sel).count();
                if (count > 0) {
                    const excl = [];
                    for (let i = 0; i < count; i++) {
                        const text = (await page.locator(sel).nth(i).textContent())?.trim();
                        if (text)
                            excl.push(text);
                    }
                    if (excl.length > 0)
                        return excl;
                }
            }
            catch {
                // try next
            }
        }
        return [];
    }
    async extractAllowedTechniques(page) {
        const selectors = [
            '[data-testid="allowed-techniques"] li',
            '.allowed-techniques li',
            'tr:has-text("Allowed") td:last-child'
        ];
        for (const sel of selectors) {
            try {
                const count = await page.locator(sel).count();
                if (count > 0) {
                    const techniques = [];
                    for (let i = 0; i < count; i++) {
                        const text = (await page.locator(sel).nth(i).textContent())?.trim();
                        if (text)
                            techniques.push(text);
                    }
                    if (techniques.length > 0)
                        return techniques;
                }
            }
            catch {
                // try next
            }
        }
        return [];
    }
    async extractProhibitedTechniques(page) {
        const selectors = [
            '[data-testid="prohibited-techniques"] li',
            '.prohibited-techniques li',
            'tr:has-text("Prohibited") td:last-child'
        ];
        for (const sel of selectors) {
            try {
                const count = await page.locator(sel).count();
                if (count > 0) {
                    const techniques = [];
                    for (let i = 0; i < count; i++) {
                        const text = (await page.locator(sel).nth(i).textContent())?.trim();
                        if (text)
                            techniques.push(text);
                    }
                    if (techniques.length > 0)
                        return techniques;
                }
            }
            catch {
                // try next
            }
        }
        return [];
    }
}
