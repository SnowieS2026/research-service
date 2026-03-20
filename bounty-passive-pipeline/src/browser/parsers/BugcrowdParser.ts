import type { Page } from 'playwright';
import { BaseParser, type NormalisedProgram } from './BaseParser.js';
import { Logger } from '../../Logger.js';
import crypto from 'crypto';

/**
 * Parses a Bugcrowd engagement page into a NormalisedProgram.
 *
 * Bugcrowd pages use "bc-*" utility class names and render engagement
 * content in structured sections. Selectors below are based on actual page
 * inspection of https://bugcrowd.com/engagements/okta.
 *
 * Key page structure found:
 * - Program name: h2.bc-my-0 (within engagement hero)
 * - Description: .bc-hint.bc-mr-2.cc-break-wrap
 * - Stats: .bc-stat__title / .bc-stat__fig  (scope rating, testing period, dates)
 * - Rewards: P1/P2/P3/P4 cards with amounts
 * - Targets: In-scope asset links
 * - Exclusions: Out-of-scope section
 */
export class BugcrowdParser extends BaseParser {
  constructor(logger: Logger) {
    super(logger);
  }

  private hashContent(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  async parse(page: Page, url: string): Promise<NormalisedProgram> {
    // Program name — h2.bc-my-0 is the engagement/program title in the hero
    const title = await this.safeExtract(page, 'h2.bc-my-0');

    // Description — the hint text directly below the title
    const description = await this.safeExtract(page, 'p.bc-hint.bc-mr-2.cc-break-wrap');

    // Scope rating — first .bc-stat__fig on the page (should be "4 out of 4")
    const scopeRating = await this.safeExtract(page, '.bc-stat__fig');

    // Reward ranges — P1/P2/P3/P4 cards
    const rewardRange = await this.extractRewardRange(page);

    // Start date / testing period
    const startDate = await this.extractStartDate(page);

    // In-scope targets — the target URLs/domains listed under "Targets"
    const scopeAssets = await this.extractScopeAssets(page);

    // Out-of-scope / exclusions
    const exclusions = await this.extractExclusions(page);

    // Allowed techniques — parsed from the structured text
    const allowedTechniques = await this.extractAllowedTechniques(page);

    // Expedited triage / special handling
    const payoutNotes = await this.extractPayoutNotes(page);

    // Hash of full page HTML
    const html = await page.content();
    const hash = this.hashContent(html);

    const result: NormalisedProgram = {
      platform: 'bugcrowd',
      program_name: title || 'Unknown',
      program_url: url,
      scope_assets: scopeAssets,
      exclusions,
      reward_range: rewardRange || 'unknown',
      reward_currency: 'USD',
      payout_notes: payoutNotes.join(' | '),
      allowed_techniques: allowedTechniques,
      prohibited_techniques: [],
      last_seen_at: startDate || new Date().toISOString().split('T')[0],
      source_snapshot_hash: hash
    };

    this.logger.log(
      `BugcrowdParser: ${result.program_name} | ${scopeAssets.length} assets | rewards: ${rewardRange || 'n/a'}`
    );
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

  private async extractRewardRange(page: Page): Promise<string> {
    // Bugcrowd shows reward tiers as P1/P2/P3/P4 with ranges like "$5000 – $75000"
    // Look for the P1 (highest) range as the primary reward indicator
    const p1Selectors = [
      // P1 reward card — contains "P1" label and dollar range
      '.bc-p-3:has-text("P1")',
      '[class*="reward"]:has-text("P1")',
      '[class*="p1"]',
      // Fallback: any text node with P1 and a $
      'text=/P1.*\\$/',
    ];

    for (const sel of p1Selectors) {
      try {
        const count = await page.locator(sel).count();
        if (count > 0) {
          const text = await page.locator(sel).first().textContent() ?? '';
          // Extract dollar amount from e.g. "P1$5000 – $75000" (no space between P1 and $)
          const match = text.match(/\$[\d,]+[\s\u2013-]*\$?[\d,]+/);
          if (match) return match[0].trim();
        }
      } catch {
        // try next
      }
    }

    // Fallback: try to find any text with dollar amounts near P1/P2 labels
    try {
      const bodyText = await page.locator('body').textContent() ?? '';
      const p1Match = bodyText.match(/P1[\s\xa0]*(\$[\d,]+[\s\u2013-]*\$?[\d,]+)/);
      if (p1Match) return `P1 ${p1Match[1].trim()}`;
      const anyPMatch = bodyText.match(/(P\d)[\s\xa0]*(\$[\d,]+[\s\u2013-]*\$?[\d,]+)/);
      if (anyPMatch) return `${anyPMatch[1]} ${anyPMatch[2].trim()}`;
    } catch {
      // ignore
    }

    return '';
  }

  private async extractStartDate(page: Page): Promise<string> {
    try {
      const bodyText = await page.locator('body').textContent() ?? '';
      // "Started at Nov 16, 2016" or similar
      const match = bodyText.match(/Started at ([A-Z][a-z]{2} \d{1,2}, \d{4})/);
      if (match) return match[1];
    } catch {
      // ignore
    }
    return '';
  }

  private async extractScopeAssets(page: Page): Promise<string[]> {
    const assets: string[] = [];

    // Look for the "Targets" section then grab in-scope asset links
    // Bugcrowd lists targets as links with rel="nofollow" or specific styling
    const selectors = [
      // In-scope section: find divs/p tags containing "In scope" then get sibling content
      '[class*="in-scope"] a[href]',
      // Target items as list items
      '[class*="target-item"] a[href]',
      // Generic in-scope links (exclude login/signup)
      '.bc-p-3 a[href]:not([href*="login"]):not([href*="signup"])',
      // Links in the main engagement content area (exclude nav/footer)
      'main a[href]',
    ];

    // Deduplicate by href
    const seen = new Set<string>();

    for (const sel of selectors) {
      try {
        const count = await page.locator(sel).count();
        for (let i = 0; i < count; i++) {
          const href = await page.locator(sel).nth(i).getAttribute('href');
          const text = (await page.locator(sel).nth(i).textContent())?.trim() ?? '';
          if (href && !seen.has(href) && href.startsWith('http') && text.length > 0 && text.length < 200) {
            seen.add(href);
            assets.push(`${text} (${href})`);
          }
        }
      } catch {
        // try next selector
      }
      if (assets.length > 0) break;
    }

    // Fallback: look for URLs in the page body that look like target domains/URLs
    if (assets.length === 0) {
      try {
        const bodyText = await page.locator('body').textContent() ?? '';
        const urlRegex = /https?:\/\/[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}[^\s"'<>]*/g;
        const matches = bodyText.match(urlRegex) ?? [];
        for (const url of matches) {
          if (!seen.has(url) && !url.includes('bugcrowd.com') && !url.includes('trexcloud.com')) {
            seen.add(url);
            assets.push(url);
          }
        }
      } catch {
        // ignore
      }
    }

    return assets;
  }

  private async extractExclusions(page: Page): Promise<string[]> {
    const selectors = [
      '[class*="out-of-scope"]',
      '[class*="exclusion"]',
      'text=/Out of Scope/i',
    ];
    for (const sel of selectors) {
      try {
        const count = await page.locator(sel).count();
        if (count > 0) {
          const text = await page.locator(sel).first().textContent() ?? '';
          if (text.length > 5) {
            // Return as single item if found as a block
            return [text.trim()];
          }
        }
      } catch {
        // try next
      }
    }
    return [];
  }

  private async extractAllowedTechniques(page: Page): Promise<string[]> {
    // Bugcrowd sometimes mentions techniques in structured badges/text
    const techniques: string[] = [];
    try {
      const bodyText = await page.locator('body').textContent() ?? '';
      // Look for common technique mentions
      const techniqueKeywords = ['SQLi', 'XSS', 'CSRF', 'SSRF', 'IDOR', 'RCE', 'LFI', 'RFI', 'SSRF', 'OAUTH'];
      for (const kw of techniqueKeywords) {
        if (bodyText.toLowerCase().includes(kw.toLowerCase())) {
          techniques.push(kw);
        }
      }
    } catch {
      // ignore
    }
    return [...new Set(techniques)];
  }

  private async extractPayoutNotes(page: Page): Promise<string[]> {
    const notes: string[] = [];
    try {
      const expeditedBadge = await page.locator('[data-tooltip-html*="Expedited triage"]').textContent().catch(() => null);
      if (expeditedBadge) notes.push(`Expedited triage: ${expeditedBadge.trim()}`);

      const safeHarbor = await page.locator('text=/Safe harbor/i').first().textContent().catch(() => null);
      if (safeHarbor) notes.push(`Safe harbor: ${safeHarbor.trim()}`);
    } catch {
      // ignore
    }
    return notes;
  }
}
