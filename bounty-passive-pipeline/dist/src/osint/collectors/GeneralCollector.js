import { osintFetch, osintDelay } from '../http.js';
import { Logger } from '../../Logger.js';
const LOG = new Logger('GeneralCollector');
async function ddgSearch(query, count = 10) {
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
    // Try to extract snippets from result__snippets
    const snippetMatches = text.matchAll(/<a class="result__a"[^>]*href="([^"]+)"[^>]*>[\s\S]*?<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi);
    const snippetMap = new Map();
    for (const m of snippetMatches) {
        const href = decodeURIComponent(m[1]);
        const snippet = m[2].replace(/<[^>]+>/g, '').trim();
        if (href && snippet)
            snippetMap.set(href, snippet);
    }
    for (const r of results) {
        if (snippetMap.has(r.url)) {
            r.snippet = snippetMap.get(r.url);
        }
    }
    return results;
}
export class GeneralCollector {
    async collect(query) {
        const { target } = query;
        const findings = [];
        const errors = [];
        const rawData = {};
        // ── General web search ─────────────────────────────────────────────────────
        try {
            const webResults = await ddgSearch(target, 15);
            rawData['webResults'] = webResults;
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
        }
        catch (err) {
            errors.push(`Web search failed: ${err}`);
        }
        await osintDelay(600);
        // ── Wikipedia ───────────────────────────────────────────────────────────────
        try {
            const wikiResults = await ddgSearch(`site:wikipedia.org "${target}"`, 3);
            for (const r of wikiResults) {
                findings.push({
                    source: 'Wikipedia',
                    field: 'article',
                    value: r.title,
                    confidence: 80,
                    url: r.url
                });
            }
        }
        catch {
            // non-fatal
        }
        await osintDelay(500);
        // ── News articles ─────────────────────────────────────────────────────────
        try {
            const newsResults = await ddgSearch(`"${target}" site:bbc.com OR site:theguardian.com OR site:reuters.com OR site:apnews.com`, 5);
            for (const r of newsResults) {
                findings.push({
                    source: 'NewsSearch',
                    field: 'article',
                    value: r.title,
                    confidence: 70,
                    url: r.url
                });
            }
        }
        catch {
            // non-fatal
        }
        await osintDelay(500);
        // ── Image search (just find image URLs in results) ───────────────────────
        try {
            const imgResults = await ddgSearch(`site:images.google.com OR site:google.com/images "${target}"`, 3);
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
        }
        catch {
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
