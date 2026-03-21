import type { Page } from 'playwright';
import { NormalisedProgram, BaseParser } from './BaseParser.js';
import { Logger } from '../../Logger.js';
import crypto from 'crypto';
import https from 'https';
import http from 'http';

/**
 * Parses a Standoff365 program page into a NormalisedProgram.
 * Scope is loaded via API after page load, so we fetch __NEXT_DATA__ from the
 * HTML to get the program ID, then call the standoff365 scope API directly.
 */
export class Standoff365Parser extends BaseParser {
  constructor(logger: Logger) {
    super(logger);
  }

  private hashContent(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  private async httpGet(url: string, headers?: Record<string, string>): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('httpGet timeout')), 20000);
      const mod = url.startsWith('https') ? https : http;
      const opts: http.RequestOptions = {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', ...headers }
      };
      const req = mod.get(url, opts, (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
        res.on('end', () => { clearTimeout(timeout); resolve(data); });
      });
      req.on('error', (e) => { clearTimeout(timeout); reject(e); });
    });
  }

  private extractProgramId(html: string): number | null {
    try {
      const match = html.match(/__NEXT_DATA__[^>]*>([^<]+)<\/script>/);
      if (!match) return null;
      const json = JSON.parse(match[1]);
      return json.props?.pageProps?.program?.id ?? null;
    } catch {
      return null;
    }
  }

  private async fetchScopeAssets(programId: number): Promise<string[]> {
    const assets: string[] = [];
    try {
      const body = await this.httpGet(
        `https://api.standoff365.com/api/bug-bounty/program/scope?program_id=${programId}&sort=severity`
      );
      const scopes = JSON.parse(body) as Array<{ scope: string; severity: string; appTypeName: string }>;
      for (const s of scopes) {
        const rawScope: string = s.scope?.trim() ?? '';
        if (!rawScope || rawScope === '-' || rawScope === '*') continue;
        // API returns multiple domains separated by newlines in a single string
        const targets = rawScope.split('\n');
        for (const rawTarget of targets) {
          const target = rawTarget.trim();
          if (!target) continue;
          // CIDR or IP range — keep as-is
          if (target.includes('/') || /^\d+\.\d+\.\d+\.\d+/.test(target)) {
            assets.push(target);
          } else if (target.startsWith('http')) {
            assets.push(target);
          } else {
            // Domain — add https://
            assets.push('https://' + target);
          }
        }
      }
    } catch (e) {
      this.logger.log(`Standoff365Parser scope API error: ${(e as Error).message}`);
    }
    return assets;
  }

  async parse(page: Page, url: string): Promise<NormalisedProgram> {
    const title = await this.safeExtract(page, 'h1');
    const html = await page.content();
    const hash = this.hashContent(html);

    // Get program ID from the already-loaded page HTML
    let programId = this.extractProgramId(html);
    let programName = title || 'Unknown';

    // If page content doesn't have __NEXT_DATA__ (navigation happened), refetch from network
    if (!programId) {
      try {
        const pageHtml = await this.httpGet(url);
        programId = this.extractProgramId(pageHtml);
      } catch {}
    }

    // Try to get program name from API if not on page
    if (!title) {
      try {
        const pageHtml = await page.content();
        const match = pageHtml.match(/__NEXT_DATA__[^>]*>([^<]+)<\/script>/);
        if (match) {
          const json = JSON.parse(match[1]);
          const name = json.props?.pageProps?.program?.name;
          if (name) programName = name;
        }
      } catch {}
    }

    // Fetch scope assets via API
    const scopeAssets = programId ? await this.fetchScopeAssets(programId) : [];

    const result: NormalisedProgram = {
      platform: 'standoff365',
      program_name: programName,
      program_url: url,
      scope_assets: scopeAssets,
      exclusions: [],
      reward_range: 'unknown',
      reward_currency: 'USD',
      payout_notes: '',
      allowed_techniques: [],
      prohibited_techniques: [],
      last_seen_at: new Date().toISOString().split('T')[0],
      source_snapshot_hash: hash
    };

    this.logger.log(`Standoff365Parser produced: ${result.program_name} (${scopeAssets.length} assets)`);
    return result;
  }

  private async safeExtract(page: Page, selector: string): Promise<string> {
    try {
      const el = page.locator(selector).first();
      if (await el.count() > 0) {
        return (await el.textContent())?.trim() ?? '';
      }
    } catch {}
    return '';
  }
}
