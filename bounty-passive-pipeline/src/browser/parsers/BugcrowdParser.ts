import type { Page } from 'playwright';
import { BaseParser, type NormalisedProgram } from './BaseParser.js';
import { TextExtractor } from '../core/TextExtractor.js';
import { Logger } from '../../Logger.js';
import crypto from 'crypto';

/**
 * Parses a Bugcrowd program page into a NormalisedProgram.
 *
 * CSS selectors target the fixture files:
 *   fixtures/html/bugcrowd-v1.html
 *   fixtures/html/bugcrowd-v2.html
 * Real Bugcrowd pages will require selector adjustments;
 * the fixture selectors are intentionally simple.
 */
export class BugcrowdParser extends BaseParser {
  private extractor: TextExtractor;

  constructor(logger: Logger) {
    super(logger);
    this.extractor = new TextExtractor();
  }

  private hashContent(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  async parse(page: Page, url: string): Promise<NormalisedProgram> {
    // Extract title (h1)
    const title = await this.extractor.extract(page, 'h1');

    // Extract scope text – fixture uses a bare <p>Scope: …</p>
    const scopeRaw = await this.extractor.extract(page, 'p:nth-of-type(1)');
    const scopeAssets: string[] = scopeRaw
      .replace(/^Scope:\s*/i, '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    // Extract exclusions
    const exclRaw = await this.extractor.extract(page, 'p:nth-of-type(2)');
    const exclusions: string[] = exclRaw
      .replace(/^Exclusions:\s*/i, '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    // Extract reward range
    const rewardRaw = await this.extractor.extract(page, 'p:nth-of-type(3)');
    const rewardRange = rewardRaw.replace(/^Reward:\s*/i, '').trim();

    // Extract last-updated date
    const lastRaw = await this.extractor.extract(page, 'p:last-of-type');
    const lastSeenAt = lastRaw.replace(/^Last updated:\s*/i, '').trim();

    // Snapshot hash from page content
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
      payout_notes: '',
      allowed_techniques: [],
      prohibited_techniques: [],
      last_seen_at: lastSeenAt || new Date().toISOString().split('T')[0],
      source_snapshot_hash: hash
    };

    this.logger.log(`BugcrowdParser produced: ${result.program_name} (${scopeAssets.length} assets)`);
    return result;
  }
}
