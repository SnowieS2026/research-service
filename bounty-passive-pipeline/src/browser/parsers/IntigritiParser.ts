import type { Page } from 'playwright';
import { BaseParser, type NormalisedProgram } from './BaseParser.js';
import { Logger } from '../../Logger.js';
import crypto from 'crypto';

/**
 * Parses an Intigriti program page into a NormalisedProgram.
 *
 * CSS selectors are based on Intigriti's public program page structure.
 * Adjust selectors as needed based on actual page markup.
 */
export class IntigritiParser extends BaseParser {
  constructor(logger: Logger) {
    super(logger);
  }

  private hashContent(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  async parse(page: Page, url: string): Promise<NormalisedProgram> {
    const title = await this.safeExtract(page, 'h1, [data-testid="program-name"], .program-name, .program-header h2');
    const scopeAssets = await this.extractScopeAssets(page);
    const exclusions = await this.extractExclusions(page);
    const rewardRange = await this.safeExtract(
      page,
      '[data-testid="reward-range"], .reward-range, .bounty-range, [data-testid="bounty-range"], .payout-range'
    );
    const rewardCurrency = 'EUR'; // Intigriti typically pays in EUR
    const payoutNotes = await this.safeExtract(
      page,
      '[data-testid="payout-notes"], .payout-notes, .reward-notes'
    );
    const allowedTechniques = await this.extractAllowedTechniques(page);
    const prohibitedTechniques = await this.extractProhibitedTechniques(page);
    const lastSeenAt = await this.safeExtract(
      page,
      '[data-testid="last-updated"], .last-updated, time, tr:has-text("Updated") td:last-child'
    );

    const html = await page.content();
    const hash = this.hashContent(html);

    const result: NormalisedProgram = {
      platform: 'intigriti',
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

    this.logger.log(`IntigritiParser produced: ${result.program_name} (${scopeAssets.length} assets)`);
    return result;
  }

  private async safeExtract(page: Page, selector: string): Promise<string> {
    try {
      const el = page.locator(selector).first();
      if (await el.count() > 0) {
        return (await el.textContent())?.trim() ?? '';
      }
    } catch {
      // fall through
    }
    return '';
  }

  private async extractScopeAssets(page: Page): Promise<string[]> {
    const selectors = [
      '[data-testid="scope"] td:first-child',
      '.scope-table td:first-child',
      'table:has-text("In Scope") td:first-child',
      '.in-scope .asset',
      '.target-list .target-item',
      '[data-testid="target"]'
    ];
    return this.extractFromSelectors(page, selectors);
  }

  private async extractExclusions(page: Page): Promise<string[]> {
    const selectors = [
      '[data-testid="out-of-scope"] td:first-child',
      '.out-of-scope td:first-child',
      'table:has-text("Out of Scope") td:first-child',
      '.exclusion-list .exclusion-item'
    ];
    return this.extractFromSelectors(page, selectors);
  }

  private async extractAllowedTechniques(page: Page): Promise<string[]> {
    const selectors = [
      '[data-testid="allowed-techniques"] li',
      '.allowed-techniques li',
      'tr:has-text("Allowed") td:last-child'
    ];
    return this.extractListFromSelectors(page, selectors);
  }

  private async extractProhibitedTechniques(page: Page): Promise<string[]> {
    const selectors = [
      '[data-testid="prohibited-techniques"] li',
      '.prohibited-techniques li',
      'tr:has-text("Prohibited") td:last-child'
    ];
    return this.extractListFromSelectors(page, selectors);
  }

  private async extractFromSelectors(page: Page, selectors: string[]): Promise<string[]> {
    for (const sel of selectors) {
      try {
        const count = await page.locator(sel).count();
        if (count > 0) {
          const items: string[] = [];
          for (let i = 0; i < count; i++) {
            const text = (await page.locator(sel).nth(i).textContent())?.trim();
            if (text && !items.includes(text)) items.push(text);
          }
          if (items.length > 0) return items;
        }
      } catch {
        // try next
      }
    }
    return [];
  }

  private async extractListFromSelectors(page: Page, selectors: string[]): Promise<string[]> {
    for (const sel of selectors) {
      try {
        const count = await page.locator(sel).count();
        if (count > 0) {
          const items: string[] = [];
          for (let i = 0; i < count; i++) {
            const text = (await page.locator(sel).nth(i).textContent())?.trim();
            if (text) items.push(text);
          }
          if (items.length > 0) return items;
        }
      } catch {
        // try next
      }
    }
    return [];
  }
}
