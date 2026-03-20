import { searxngSearch, osintDelay } from '../http.js';
import { Logger } from '../../Logger.js';
const LOG = new Logger('PersonCollector');
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
                const results = await searxngSearch(platform.q, 3);
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
            const webResults = await searxngSearch(`"${target}"`, 10);
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
            const newsResults = await searxngSearch(`"${target}" site:bbc.com OR site:theguardian.com OR site:news.google.com`, 5);
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
