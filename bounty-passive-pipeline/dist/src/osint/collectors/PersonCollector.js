import { osintFetch, osintDelay } from '../http.js';
import { Logger } from '../../Logger.js';
const LOG = new Logger('PersonCollector');
/**
 * Free DuckDuckGo HTML search (no API key required).
 * Scrapes the DuckDuckGo HTML results page.
 */
async function ddgSearch(query, count = 8) {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=en-us`;
    const text = await osintFetch(url, { timeout: 12_000 });
    const results = [];
    // Parse <a class="result__a" href="...">Title</a>
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
    // Fallback: simpler link parsing
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
export class PersonCollector {
    async collect(query) {
        const { target } = query;
        const findings = [];
        const errors = [];
        const rawData = {};
        const socialPlatforms = [
            { name: 'LinkedIn', q: `"${target}" site:linkedin.com/in` },
            { name: 'Twitter/X', q: `"${target}" site:x.com OR site:twitter.com` },
            { name: 'Facebook', q: `"${target}" site:facebook.com` },
            { name: 'Instagram', q: `"${target}" site:instagram.com` },
            { name: 'TikTok', q: `"${target}" site:tiktok.com` },
            { name: 'GitHub', q: `"${target}" site:github.com` }
        ];
        for (const platform of socialPlatforms) {
            try {
                const results = await ddgSearch(platform.q, 3);
                if (results.length > 0) {
                    findings.push({
                        source: 'SocialSearch',
                        field: platform.name,
                        value: `Possible ${platform.name} profile`,
                        confidence: 70,
                        url: results[0].url
                    });
                    rawData[`social_${platform.name.toLowerCase()}`] = results;
                }
            }
            catch {
                // individual platform failure non-fatal
            }
            await osintDelay(500);
        }
        // ── General web presence ───────────────────────────────────────────────────
        try {
            const webResults = await ddgSearch(`"${target}"`, 10);
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
            errors.push(`Web search failed: ${err}`);
        }
        await osintDelay(500);
        // ── News mentions ──────────────────────────────────────────────────────────
        try {
            const newsResults = await ddgSearch(`"${target}" site:bbc.com OR site:theguardian.com OR site:news.google.com`, 5);
            for (const r of newsResults) {
                findings.push({
                    source: 'NewsSearch',
                    field: 'news_article',
                    value: r.title,
                    confidence: 60,
                    url: r.url
                });
            }
        }
        catch {
            // non-fatal
        }
        return {
            collector: 'PersonCollector',
            findings,
            errors,
            rawData
        };
    }
}
