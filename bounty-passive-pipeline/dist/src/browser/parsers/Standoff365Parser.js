import { BaseParser } from './BaseParser.js';
import crypto from 'crypto';
/**
 * Parses a Standoff365 program page into a NormalisedProgram.
 *
 * CSS selectors are based on Standoff365's public program page structure.
 * Adjust selectors as needed based on actual page markup.
 */
export class Standoff365Parser extends BaseParser {
    constructor(logger) {
        super(logger);
    }
    hashContent(text) {
        return crypto.createHash('sha256').update(text).digest('hex');
    }
    async parse(page, url) {
        const title = await this.safeExtract(page, 'h1, [data-testid="program-name"], .program-name, .program-header h2, .program-title');
        const scopeAssets = await this.extractScopeAssets(page);
        const exclusions = await this.extractExclusions(page);
        const rewardRange = await this.safeExtract(page, '[data-testid="reward-range"], .reward-range, .bounty-range, [data-testid="bounty-range"], .payout-range, .reward-amount');
        const rewardCurrency = 'USD'; // Standoff365 typically pays in USD
        const payoutNotes = await this.safeExtract(page, '[data-testid="payout-notes"], .payout-notes, .reward-notes, .scope-notes');
        const allowedTechniques = await this.extractAllowedTechniques(page);
        const prohibitedTechniques = await this.extractProhibitedTechniques(page);
        const lastSeenAt = await this.safeExtract(page, '[data-testid="last-updated"], .last-updated, time, tr:has-text("Updated") td:last-child, [data-testid="modified"]');
        const html = await page.content();
        const hash = this.hashContent(html);
        const result = {
            platform: 'standoff365',
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
        this.logger.log(`Standoff365Parser produced: ${result.program_name} (${scopeAssets.length} assets)`);
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
        const selectors = [
            '[data-testid="scope"] td:first-child',
            '.scope-table td:first-child',
            'table:has-text("In Scope") td:first-child',
            '.in-scope .asset',
            '.target-list .target-item',
            '[data-testid="target"]',
            '.program-scope .asset-item'
        ];
        return this.extractFromSelectors(page, selectors);
    }
    async extractExclusions(page) {
        const selectors = [
            '[data-testid="out-of-scope"] td:first-child',
            '.out-of-scope td:first-child',
            'table:has-text("Out of Scope") td:first-child',
            '.exclusion-list .exclusion-item'
        ];
        return this.extractFromSelectors(page, selectors);
    }
    async extractAllowedTechniques(page) {
        const selectors = [
            '[data-testid="allowed-techniques"] li',
            '.allowed-techniques li',
            'tr:has-text("Allowed") td:last-child'
        ];
        return this.extractListFromSelectors(page, selectors);
    }
    async extractProhibitedTechniques(page) {
        const selectors = [
            '[data-testid="prohibited-techniques"] li',
            '.prohibited-techniques li',
            'tr:has-text("Prohibited") td:last-child'
        ];
        return this.extractListFromSelectors(page, selectors);
    }
    async extractFromSelectors(page, selectors) {
        for (const sel of selectors) {
            try {
                const count = await page.locator(sel).count();
                if (count > 0) {
                    const items = [];
                    for (let i = 0; i < count; i++) {
                        const text = (await page.locator(sel).nth(i).textContent())?.trim();
                        if (text && !items.includes(text))
                            items.push(text);
                    }
                    if (items.length > 0)
                        return items;
                }
            }
            catch {
                // try next
            }
        }
        return [];
    }
    async extractListFromSelectors(page, selectors) {
        for (const sel of selectors) {
            try {
                const count = await page.locator(sel).count();
                if (count > 0) {
                    const items = [];
                    for (let i = 0; i < count; i++) {
                        const text = (await page.locator(sel).nth(i).textContent())?.trim();
                        if (text)
                            items.push(text);
                    }
                    if (items.length > 0)
                        return items;
                }
            }
            catch {
                // try next
            }
        }
        return [];
    }
}
