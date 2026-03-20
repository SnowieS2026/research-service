import type { Page } from 'playwright';
import { BaseParser, type NormalisedProgram } from './BaseParser.js';
import { Logger } from '../../Logger.js';
import crypto from 'crypto';

/**
 * Fast synchronous DOM extraction — runs inside browser context.
 * Must NOT reference `this` or class methods. Uses global `document`.
 */
function extractBugcrowdData(): {
  title: string;
  description: string;
  scopeAssets: string[];
  exclusions: string[];
  rewardRange: string;
  startedAt: string;
  techniques: string[];
} | null {
  const title = (() => {
    const el = document.querySelector('h2.bc-my-0');
    return el?.textContent?.trim() ?? '';
  })();

  const description = (() => {
    const el = document.querySelector('p.bc-hint.bc-mr-2.cc-break-wrap');
    return el?.textContent?.trim() ?? '';
  })();

  const scopeAssets: string[] = [];
  const exclusions: string[] = [];
  let rewardRange = '';

  // P1 reward card — contains "P1" label and dollar amount
  const p1Card = (() => {
    const cards = document.querySelectorAll('.bc-p-3');
    for (const card of cards) {
      const label = card.querySelector('.bc-label');
      if (label?.textContent?.trim() === 'P1') {
        const amount = card.querySelector('.bc-amount');
        return amount?.textContent?.trim() ?? '';
      }
    }
    return '';
  })();
  rewardRange = p1Card;

  // In-scope: links inside .bc-targets
  const targetSection = document.querySelector('.bc-targets');
  if (targetSection) {
    const links = targetSection.querySelectorAll('a[href]');
    for (const link of links) {
      const href = link.getAttribute('href') ?? '';
      const text = link.textContent?.trim() ?? '';
      if (href && href.startsWith('http') && text.length > 2) {
        scopeAssets.push(href);
      }
    }
  }

  // Exclusions: .bc-out-of-scope p elements
  const exclSection = document.querySelector('.bc-out-of-scope');
  if (exclSection) {
    const paras = exclSection.querySelectorAll('p');
    for (const p of paras) {
      const text = p.textContent?.trim() ?? '';
      if (text) exclusions.push(text);
    }
  }

  // Started at date
  const startedAt = (() => {
    const meta = document.querySelector('.bc-meta');
    if (!meta) return '';
    const match = meta.textContent?.match(/Started at ([A-Z][a-z]{2} \d{1,2}, \d{4})/);
    return match ? match[1] : '';
  })();

  // Allowed techniques
  const bodyText = document.body?.textContent ?? '';
  const kw = ['SQLi', 'XSS', 'CSRF', 'SSRF', 'IDOR', 'RCE', 'LFI', 'RFI', 'XXE', 'OAuth'];
  const techniques = kw.filter((k) => bodyText.includes(k));

  return { title, description, scopeAssets, exclusions, rewardRange, startedAt, techniques };
}

export class BugcrowdParser extends BaseParser {
  constructor(logger: Logger) {
    super(logger);
  }

  private hashContent(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  async parse(page: Page, url: string): Promise<NormalisedProgram> {
    let data: ReturnType<typeof extractBugcrowdData> | null = null;
    try {
      data = await page.evaluate(extractBugcrowdData);
    } catch (err) {
      this.logger.warn(`BugcrowdParser evaluate failed: ${(err as Error).message}`);
    }

    const html = await page.content();
    const hash = this.hashContent(html);

    const title = data?.title ?? '';
    const scopeAssets = data?.scopeAssets ?? [];
    const exclusions = data?.exclusions ?? [];
    const rewardRange = data?.rewardRange ?? '';
    const startedAt = data?.startedAt ?? '';

    const result: NormalisedProgram = {
      platform: 'bugcrowd',
      program_name: title || 'Unknown',
      program_url: url,
      scope_assets: scopeAssets,
      exclusions,
      reward_range: rewardRange || 'unknown',
      reward_currency: 'USD',
      payout_notes: data?.description?.slice(0, 500) ?? '',
      allowed_techniques: data?.techniques ?? [],
      prohibited_techniques: [],
      last_seen_at: startedAt || new Date().toISOString().split('T')[0],
      source_snapshot_hash: hash
    };

    this.logger.log(`BugcrowdParser: ${result.program_name} | ${scopeAssets.length} assets`);
    return result;
  }
}
