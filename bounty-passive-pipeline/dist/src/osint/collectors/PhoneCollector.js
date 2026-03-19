import { osintFetch, osintDelay, tryParseJson } from '../http.js';
import { Logger } from '../../Logger.js';
import { loadConfig } from '../../config.js';
const LOG = new Logger('PhoneCollector');
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
export class PhoneCollector {
    async collect(query) {
        const { target } = query;
        const findings = [];
        const errors = [];
        const rawData = {};
        const cfg = loadConfig();
        // Normalise – keep digits only
        const cleanNumber = target.replace(/\D/g, '');
        const masked = cleanNumber.replace(/\d(?=\d{4})/g, '*');
        // ── ip-api.com free geolocation (works for any IP or phone region hint) ───
        // Note: ip-api is for IPs, but we can use it to check if number has IP-like format
        // Instead use numvalidate.com API if key is available
        if (cfg.OSINT_NUMVALIDATE_KEY) {
            try {
                const apiUrl = `http://apilayer.net/api/validate?access_key=${cfg.OSINT_NUMVALIDATE_KEY}&number=${encodeURIComponent(cleanNumber)}&format=1`;
                const text = await osintFetch(apiUrl, { timeout: 12_000 });
                const data = tryParseJson(text, {});
                rawData.numvalidate = data;
                if (data.valid === true || data.valid === 'true') {
                    findings.push({ source: 'NumValidate', field: 'valid', value: 'Yes', confidence: 95 });
                    if (data.country_name)
                        findings.push({ source: 'NumValidate', field: 'country', value: String(data.country_name), confidence: 90 });
                    if (data.location)
                        findings.push({ source: 'NumValidate', field: 'location', value: String(data.location), confidence: 75 });
                    if (data.carrier)
                        findings.push({ source: 'NumValidate', field: 'carrier', value: String(data.carrier), confidence: 80 });
                    if (data.line_type)
                        findings.push({ source: 'NumValidate', field: 'line_type', value: String(data.line_type), confidence: 85 });
                }
                else {
                    findings.push({ source: 'NumValidate', field: 'valid', value: 'No / Unknown', confidence: 95 });
                }
            }
            catch (err) {
                errors.push(`NumValidate API failed: ${err}`);
            }
        }
        else {
            findings.push({
                source: 'PhoneCollector',
                field: 'note',
                value: `No NumValidate API key configured – phone enrichment limited. Add OSINT_NUMVALIDATE_KEY to config.`,
                confidence: 0
            });
        }
        await osintDelay(600);
        // ── Google search for number (use last 6 digits to avoid exact-match restrictions) ─
        if (cleanNumber.length >= 6) {
            const searchChunk = cleanNumber.slice(-7);
            try {
                const results = await ddgSearch(`"${searchChunk}"`, 10);
                rawData.googleResults = results;
                for (const r of results) {
                    findings.push({
                        source: 'GoogleSearch',
                        field: 'mention',
                        value: r.title,
                        confidence: 50,
                        url: r.url
                    });
                }
            }
            catch (err) {
                errors.push(`Phone Google search failed: ${err}`);
            }
        }
        await osintDelay(500);
        // ── Spam / scam search ─────────────────────────────────────────────────────
        if (cleanNumber.length >= 4) {
            try {
                const spamResults = await ddgSearch(`"${cleanNumber.slice(-6)}" scam OR spam OR robocall OR telemarketing`, 5);
                for (const r of spamResults) {
                    findings.push({
                        source: 'SpamSearch',
                        field: 'possible_spam',
                        value: r.title,
                        confidence: 40,
                        url: r.url
                    });
                }
            }
            catch {
                // non-fatal
            }
        }
        return {
            collector: 'PhoneCollector',
            findings,
            errors,
            rawData
        };
    }
}
