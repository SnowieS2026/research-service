import { searxngSearch, osintFetch, osintDelay, tryParseJson } from '../http.js';
import { Logger } from '../../Logger.js';
import type { OsintQuery, CollectorResult, OsintFinding } from '../types.js';

const LOG = new Logger('BusinessCollector');

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
      let crtSuccess = false;
      for (let attempt = 0; attempt < 3 && !crtSuccess; attempt++) {
        try {
          if (attempt > 0) await osintDelay(2000 * attempt); // exponential backoff
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
            crtSuccess = true;
          }
        } catch (err) {
          if (attempt === 2) {
            errors.push(`CRTSH lookup failed after 3 attempts: ${err}`);
          }
        }
      }
      await osintDelay(500);
    }

    // ── Companies House (UK) ──────────────────────────────────────────────────
    try {
      const chResults = await searxngSearch(`site:companieshouse.gov.uk "${target}"`, 5);
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
      const edgarResults = await searxngSearch(`site:sec.gov/edgar "${target}"`, 5);
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
      const ocResults = await searxngSearch(`site:opencorporates.com "${target}"`, 5);
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
      const liResults = await searxngSearch(`site:linkedin.com/company "${target}"`, 5);
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
      const mapsResults = await searxngSearch(`"${target}" site:google.com/maps`, 3);
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
      const bizResults = await searxngSearch(`"${target}" business OR company`, 8);
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
