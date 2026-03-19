import { osintFetch, osintDelay, tryParseJson } from '../http.js';
import { Logger } from '../../Logger.js';
import { loadConfig } from '../../config.js';
const LOG = new Logger('EmailCollector');
async function ddgSearch(query, count = 8) {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=en-us`;
    const text = await osintFetch(url, { timeout: 12_000 });
    const results = [];
    const linkMatches = text.matchAll(/<a class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi);
    for (const m of linkMatches) {
        const href = decodeURIComponent(m[1]);
        const title = m[2].replace(/<[^>]+>/g, '').trim();
        if (href && title && !href.includes('duckduckgo')) {
            results.push({ title, url: href });
            if (results.length >= count)
                break;
        }
    }
    if (results.length === 0) {
        const simpleMatches = text.matchAll(/<a[^>]+href="(https?[^"]+)"[^>]*>([^<]+)<\/a>/gi);
        for (const m of simpleMatches) {
            const href = m[1];
            const title = m[2].replace(/<[^>]+>/g, '').trim();
            if (href.startsWith('http') && title && !href.includes('duckduckgo') && title.length > 3) {
                results.push({ title, url: href });
                if (results.length >= count)
                    break;
            }
        }
    }
    return results;
}
export class EmailCollector {
    async collect(query) {
        const { target } = query;
        const findings = [];
        const errors = [];
        const rawData = {};
        const cfg = loadConfig();
        // ── Basic email format validation ──────────────────────────────────────────
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValidFormat = emailRe.test(target);
        findings.push({
            source: 'FormatCheck',
            field: 'valid_format',
            value: isValidFormat ? `Yes – "${target}" appears valid` : `No – "${target}" may be invalid`,
            confidence: isValidFormat ? 90 : 80
        });
        if (!isValidFormat) {
            return { collector: 'EmailCollector', findings, errors, rawData };
        }
        const domain = target.split('@')[1];
        // ── HaveIBeenPwned (requires API key) ──────────────────────────────────────
        if (cfg.OSINT_HIBP_API_KEY) {
            try {
                const hibpUrl = `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(target)}?trumpResponse=1`;
                const text = await osintFetch(hibpUrl, {
                    timeout: 12_000,
                    headers: {
                        'hibp-api-key': cfg.OSINT_HIBP_API_KEY,
                        'User-Agent': 'OSINT-Collector/1.0'
                    }
                });
                const breaches = tryParseJson(text, []);
                rawData['hibp_breaches'] = breaches;
                if (Array.isArray(breaches) && breaches.length > 0) {
                    findings.push({
                        source: 'HaveIBeenPwned',
                        field: 'breach_count',
                        value: `${breaches.length} breach(es) found`,
                        confidence: 95
                    });
                    for (const b of breaches.slice(0, 5)) {
                        findings.push({
                            source: 'HaveIBeenPwned',
                            field: `breach:${b.Name}`,
                            value: `${b.Title} (${b.BreachDate})`,
                            confidence: 95
                        });
                    }
                }
                else {
                    findings.push({
                        source: 'HaveIBeenPwned',
                        field: 'breaches',
                        value: 'No breaches found',
                        confidence: 90
                    });
                }
            }
            catch (err) {
                // HIBP returns 404 if no breaches, which is not an error
                const errStr = String(err);
                if (!errStr.includes('404')) {
                    errors.push(`HaveIBeenPwned lookup failed: ${err}`);
                }
                else {
                    findings.push({ source: 'HaveIBeenPwned', field: 'breaches', value: 'No breaches found', confidence: 90 });
                }
            }
        }
        else {
            findings.push({
                source: 'HaveIBeenPwned',
                field: 'note',
                value: 'No HIBP API key configured – breach check skipped. Add OSINT_HIBP_API_KEY to config.',
                confidence: 0
            });
        }
        await osintDelay(600);
        // ── Hunter.io domain search (free tier: 25/month) ─────────────────────────
        if (cfg.OSINT_HUNTER_API_KEY && domain) {
            try {
                const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&limit=5&api_key=${cfg.OSINT_HUNTER_API_KEY}`;
                const text = await osintFetch(hunterUrl, { timeout: 12_000 });
                const data = tryParseJson(text, {});
                rawData.hunter = data;
                const emails = data.data?.emails;
                if (Array.isArray(emails) && emails.length > 0) {
                    findings.push({
                        source: 'HunterIO',
                        field: 'domain_emails_found',
                        value: `${emails.length} email(s) found for domain ${domain}`,
                        confidence: 80
                    });
                    for (const e of emails.slice(0, 3)) {
                        findings.push({
                            source: 'HunterIO',
                            field: 'email_pattern',
                            value: `${e.value} (${e.type ?? 'unknown'})`,
                            confidence: 75,
                            url: e.sources ? e.sources[0]?.domain ?? undefined : undefined
                        });
                    }
                }
            }
            catch (err) {
                errors.push(`Hunter.io lookup failed: ${err}`);
            }
        }
        else if (!cfg.OSINT_HUNTER_API_KEY) {
            findings.push({
                source: 'HunterIO',
                field: 'note',
                value: 'No Hunter.io API key configured – domain email lookup skipped. Add OSINT_HUNTER_API_KEY.',
                confidence: 0
            });
        }
        await osintDelay(600);
        // ── Social profile search ─────────────────────────────────────────────────
        try {
            const socialResults = await ddgSearch(`"${target}" site:linkedin.com OR site:twitter.com OR site:facebook.com`, 5);
            for (const r of socialResults) {
                findings.push({
                    source: 'SocialSearch',
                    field: 'profile_mention',
                    value: r.title,
                    confidence: 60,
                    url: r.url
                });
            }
        }
        catch {
            // non-fatal
        }
        await osintDelay(500);
        // ── General web search ─────────────────────────────────────────────────────
        try {
            const webResults = await ddgSearch(`"${target}"`, 8);
            rawData.webResults = webResults;
            for (const r of webResults) {
                findings.push({
                    source: 'WebSearch',
                    field: 'mention',
                    value: r.title,
                    confidence: 40,
                    url: r.url
                });
            }
        }
        catch (err) {
            errors.push(`Email web search failed: ${err}`);
        }
        return {
            collector: 'EmailCollector',
            findings,
            errors,
            rawData
        };
    }
}
