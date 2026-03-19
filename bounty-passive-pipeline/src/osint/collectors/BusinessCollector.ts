import { osintFetch, osintDelay, tryParseJson } from '../http.js';
import { Logger } from '../../Logger.js';
import type { OsintQuery, CollectorResult, OsintFinding } from '../types.js';

const LOG = new Logger('BusinessCollector');

async function ddgSearch(query: string, count = 8): Promise<Array<{ title: string; url: string }>> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=en-us`;
  const text = await osintFetch(url, { timeout: 12_000 });
  const results: Array<{ title: string; url: string }> = [];

  const linkMatches = text.matchAll(/<a class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi);
  for (const m of linkMatches) {
    const href = decodeURIComponent(m[1]);
    const title = m[2].replace(/<[^>]+>/g, '').trim();
    if (href && title && !href.includes('duckduckgo')) {
      results.push({ title, url: href });
      if (results.length >= count) break;
    }
  }

  if (results.length === 0) {
    const simpleMatches = text.matchAll(/<a[^>]+href="(https?[^"]+)"[^>]*>([^<]+)<\/a>/gi);
    for (const m of simpleMatches) {
      const href = m[1];
      const title = m[2].replace(/<[^>]+>/g, '').trim();
      if (href.startsWith('http') && title && !href.includes('duckduckgo') && title.length > 3) {
        results.push({ title, url: href });
        if (results.length >= count) break;
      }
    }
  }

  return results;
}

export class BusinessCollector {
  async collect(query: OsintQuery): Promise<CollectorResult> {
    const { target } = query;
    const findings: OsintFinding[] = [];
    const errors: string[] = [];
    const rawData: Record<string, unknown> = {};

    // Detect if target is a domain
    let isDomain = false;
    try {
      const u = new URL(`https://${target}`);
      isDomain = !!u.hostname.includes('.');
    } catch {
      // not a domain
    }

    // ── CRTSH WHOIS-like lookup via certificate transparency ──────────────────
    if (isDomain) {
      try {
        const cleanDomain = target.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
        const crtUrl = `https://crt.sh/?q=${encodeURIComponent(cleanDomain)}&output=json`;
        const text = await osintFetch(crtUrl, { timeout: 15_000 });
        const entries = tryParseJson<Array<Record<string, unknown>>>(text, []);
        rawData.crtsh = entries;

        if (Array.isArray(entries) && entries.length > 0) {
          const entry = entries[0] as Record<string, unknown>;
          findings.push({
            source: 'CRTSH',
            field: 'issuer',
            value: String(entry.issuer_name ?? 'Unknown'),
            confidence: 80
          });
          findings.push({
            source: 'CRTSH',
            field: 'common_name',
            value: String(entry.common_name ?? cleanDomain),
            confidence: 80
          });
          if (entry.not_before) {
            findings.push({
              source: 'CRTSH',
              field: 'certificate_issued',
              value: String(entry.not_before),
              confidence: 70
            });
          }
          if (entry.not_after) {
            findings.push({
              source: 'CRTSH',
              field: 'certificate_expires',
              value: String(entry.not_after),
              confidence: 70
            });
          }
          // Collect SAN names
          const sanMatch = String(entry.name_value ?? '').split('\n');
          if (sanMatch.length > 1) {
            rawData.san_domains = sanMatch;
            findings.push({
              source: 'CRTSH',
              field: 'san_domains',
              value: `${sanMatch.length} domains on certificate (incl. ${sanMatch[0]})`,
              confidence: 75
            });
          }
        }
      } catch (err) {
        errors.push(`CRTSH lookup failed: ${err}`);
      }
      await osintDelay(500);
    }

    // ── Companies House (UK) ──────────────────────────────────────────────────
    try {
      const chResults = await ddgSearch(`site:companieshouse.gov.uk "${target}"`, 5);
      for (const r of chResults) {
        findings.push({
          source: 'CompaniesHouse',
          field: 'uk_company',
          value: r.title,
          confidence: 85,
          url: r.url
        });
      }
    } catch {
      // non-fatal
    }
    await osintDelay(500);

    // ── SEC EDGAR (US) ───────────────────────────────────────────────────────
    try {
      const edgarResults = await ddgSearch(`site:sec.gov/edgar "${target}"`, 5);
      for (const r of edgarResults) {
        findings.push({
          source: 'SECEDGAR',
          field: 'us_filing',
          value: r.title,
          confidence: 85,
          url: r.url
        });
      }
    } catch {
      // non-fatal
    }
    await osintDelay(500);

    // ── OpenCorporates ────────────────────────────────────────────────────────
    try {
      const ocResults = await ddgSearch(`site:opencorporates.com "${target}"`, 5);
      for (const r of ocResults) {
        findings.push({
          source: 'OpenCorporates',
          field: 'corporate_record',
          value: r.title,
          confidence: 75,
          url: r.url
        });
      }
    } catch {
      // non-fatal
    }
    await osintDelay(500);

    // ── LinkedIn company ───────────────────────────────────────────────────────
    try {
      const liResults = await ddgSearch(`site:linkedin.com/company "${target}"`, 5);
      for (const r of liResults) {
        findings.push({
          source: 'LinkedIn',
          field: 'company_profile',
          value: r.title,
          confidence: 70,
          url: r.url
        });
      }
    } catch {
      // non-fatal
    }
    await osintDelay(500);

    // ── Google Maps ───────────────────────────────────────────────────────────
    try {
      const mapsResults = await ddgSearch(`"${target}" site:google.com/maps`, 3);
      for (const r of mapsResults) {
        findings.push({
          source: 'GoogleMaps',
          field: 'maps_listing',
          value: r.title,
          confidence: 60,
          url: r.url
        });
      }
    } catch {
      // non-fatal
    }
    await osintDelay(500);

    // ── General business search ───────────────────────────────────────────────
    try {
      const bizResults = await ddgSearch(`"${target}" business OR company`, 8);
      rawData.businessSearch = bizResults;
      for (const r of bizResults) {
        findings.push({
          source: 'WebSearch',
          field: 'mention',
          value: r.title,
          confidence: 40,
          url: r.url
        });
      }
    } catch (err) {
      errors.push(`Business search failed: ${err}`);
    }

    return {
      collector: 'BusinessCollector',
      findings,
      errors,
      rawData
    };
  }
}
