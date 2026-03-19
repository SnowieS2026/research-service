import { Logger } from '../../Logger.js';
import type { Page } from 'playwright';

export interface NormalisedProgram {
  platform: string;
  program_name: string;
  program_url: string;
  scope_assets: string[];
  exclusions: string[];
  reward_range: string;
  reward_currency: string;
  payout_notes: string;
  allowed_techniques: string[];
  prohibited_techniques: string[];
  last_seen_at: string;
  source_snapshot_hash: string;
}

export abstract class BaseParser {
  protected logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  abstract parse(page: Page, url: string): Promise<NormalisedProgram>;
}
