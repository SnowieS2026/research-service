import { searxngSearch, osintDelay } from '../http.js';
import { Logger } from '../../Logger.js';
import type { OsintQuery, CollectorResult, OsintFinding } from '../types.js';

const LOG = new Logger('GeneralCollector');

export class GeneralCollector {
  async collect(query: OsintQuery): Promise<CollectorResult> {
    const { target } = query;
    const findings: OsintFinding[] = [];
    const errors: string[] = [];
    const rawData: Record<string, unknown> = {};

    // ── General web search ─────────────────────────────────────────────────────
    try {
      const webResults = await searxngSearch(target, 15);
      rawData['webResults'] = webResults;
      if (webResults.length === 0) {
        errors.push('Web search returned no results (SearxNG may be blocked — consider a local instance)');
      }

      for (const r of webResults) {
        findings.push({
          source: 'WebSearch',
          field: 'result',
          value: r.title,
          confidence: 50,
          url: r.url
        });
        if (r.snippet) {
          findings.push({
            source: 'WebSearch',
            field: 'snippet',
            value: r.snippet.substring(0, 300),
            confidence: 40
          });
        }
      }
    } catch (err) {
      errors.push(`Web search failed: ${err}`);
    }

    await osintDelay(600);

    // ── Wikipedia ───────────────────────────────────────────────────────────────
    try {
      const wikiResults = await searxngSearch(`site:wikipedia.org "${target}"`, 3);
      for (const r of wikiResults) {
        findings.push({
          source: 'Wikipedia',
          field: 'article',
          value: r.title,
          confidence: 80,
          url: r.url
        });
      }
    } catch {
      // non-fatal
    }

    await osintDelay(500);

    // ── News articles ─────────────────────────────────────────────────────────
    try {
      const newsResults = await searxngSearch(`"${target}" site:bbc.com OR site:theguardian.com OR site:reuters.com OR site:apnews.com`, 5);
      for (const r of newsResults) {
        findings.push({
          source: 'NewsSearch',
          field: 'article',
          value: r.title,
          confidence: 70,
          url: r.url
        });
      }
    } catch {
      // non-fatal
    }

    await osintDelay(500);

    // ── Image search (just find image URLs in results) ───────────────────────
    try {
      const imgResults = await searxngSearch(`site:images.google.com OR site:google.com/images "${target}"`, 3);
      for (const r of imgResults) {
        if (r.url.includes('images')) {
          findings.push({
            source: 'ImageSearch',
            field: 'image_result',
            value: r.title,
            confidence: 40,
            url: r.url
          });
        }
      }
    } catch {
      // non-fatal
    }

    return {
      collector: 'GeneralCollector',
      findings,
      errors,
      rawData
    };
  }
}
