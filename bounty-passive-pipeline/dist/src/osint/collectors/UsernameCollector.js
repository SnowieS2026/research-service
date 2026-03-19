import { osintDelay } from '../http.js';
import { Logger } from '../../Logger.js';
const LOG = new Logger('UsernameCollector');
/**
 * List of platforms to check for username existence.
 * Uses direct URL-based checks (profile pages).
 */
const PLATFORMS = [
    {
        name: 'GitHub',
        urlTemplate: (u) => `https://github.com/${encodeURIComponent(u)}`,
        // GitHub returns 200 on existing, 404 on non-existing
    },
    {
        name: 'Twitter/X',
        urlTemplate: (u) => `https://x.com/${encodeURIComponent(u)}`,
    },
    {
        name: 'Instagram',
        urlTemplate: (u) => `https://www.instagram.com/${encodeURIComponent(u)}`,
    },
    {
        name: 'Facebook',
        urlTemplate: (u) => `https://www.facebook.com/${encodeURIComponent(u)}`,
    },
    {
        name: 'LinkedIn',
        urlTemplate: (u) => `https://www.linkedin.com/in/${encodeURIComponent(u)}`,
    },
    {
        name: 'TikTok',
        urlTemplate: (u) => `https://www.tiktok.com/@${encodeURIComponent(u)}`,
    },
    {
        name: 'YouTube',
        urlTemplate: (u) => `https://www.youtube.com/@${encodeURIComponent(u)}`,
    },
    {
        name: 'Reddit',
        urlTemplate: (u) => `https://www.reddit.com/user/${encodeURIComponent(u)}`,
    },
    {
        name: 'Pinterest',
        urlTemplate: (u) => `https://www.pinterest.com/${encodeURIComponent(u)}`,
    },
    {
        name: 'Snapchat',
        urlTemplate: (u) => `https://www.snapchat.com/add/${encodeURIComponent(u)}`,
    },
    {
        name: 'Tumblr',
        urlTemplate: (u) => `https://${encodeURIComponent(u)}.tumblr.com`,
    },
    {
        name: 'Flickr',
        urlTemplate: (u) => `https://www.flickr.com/people/${encodeURIComponent(u)}`,
    },
    {
        name: 'SoundCloud',
        urlTemplate: (u) => `https://soundcloud.com/${encodeURIComponent(u)}`,
    },
    {
        name: 'Spotify',
        urlTemplate: (u) => `https://open.spotify.com/user/${encodeURIComponent(u)}`,
    },
    {
        name: 'Steam',
        urlTemplate: (u) => `https://steamcommunity.com/id/${encodeURIComponent(u)}`,
    },
    {
        name: 'Discord',
        // Discord doesn't have public profile URLs by username easily
        // Use a search redirect trick
        urlTemplate: (u) => `https://discord.com/users/${encodeURIComponent(u)}`,
    },
    {
        name: 'Twitch',
        urlTemplate: (u) => `https://www.twitch.tv/${encodeURIComponent(u)}`,
    },
    {
        name: 'Medium',
        urlTemplate: (u) => `https://medium.com/@${encodeURIComponent(u)}`,
    },
    {
        name: 'DEV.to',
        urlTemplate: (u) => `https://dev.to/${encodeURIComponent(u)}`,
    },
    {
        name: 'HackerNews',
        urlTemplate: (u) => `https://news.ycombinator.com/user?id=${encodeURIComponent(u)}`,
    },
    {
        name: 'Keybase',
        urlTemplate: (u) => `https://keybase.io/${encodeURIComponent(u)}`,
    },
    {
        name: 'About.me',
        urlTemplate: (u) => `https://about.me/${encodeURIComponent(u)}`,
    },
    {
        name: 'ProductHunt',
        urlTemplate: (u) => `https://www.producthunt.com/@${encodeURIComponent(u)}`,
    },
    {
        name: 'Mastodon',
        // Standard mastodon profile (domain-dependent, but try fosstodon.org as default)
        urlTemplate: (u) => `https://fosstodon.org/@${encodeURIComponent(u)}`,
    },
    {
        name: 'Vimeo',
        urlTemplate: (u) => `https://vimeo.com/${encodeURIComponent(u)}`,
    },
    {
        name: 'Dribbble',
        urlTemplate: (u) => `https://dribbble.com/${encodeURIComponent(u)}`,
    },
    {
        name: 'Behance',
        urlTemplate: (u) => `https://www.behance.net/${encodeURIComponent(u)}`,
    },
    {
        name: 'StackOverflow',
        urlTemplate: (u) => `https://stackoverflow.com/users/next/${encodeURIComponent(u)}`,
    },
    {
        name: 'Last.fm',
        urlTemplate: (u) => `https://www.last.fm/user/${encodeURIComponent(u)}`,
    },
    {
        name: 'MyAnimeList',
        urlTemplate: (u) => `https://myanimelist.net/profile/${encodeURIComponent(u)}`,
    }
];
export class UsernameCollector {
    async collect(query) {
        const { target } = query;
        const findings = [];
        const errors = [];
        const rawData = {};
        // Normalise username
        const username = target.trim().toLowerCase().replace(/^@/, '');
        let existsCount = 0;
        const results = [];
        for (const platform of PLATFORMS) {
            const url = platform.urlTemplate(username);
            try {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 8000);
                const resp = await fetch(url, {
                    method: 'HEAD',
                    redirect: 'follow',
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; OSINT-Bot/1.0)',
                        'Accept': 'text/html,*/*'
                    }
                });
                clearTimeout(timer);
                const status = resp.status;
                // GitHub: 200 = exists, 404 = doesn't exist
                // Most platforms: 200 = exists, 404 or 4xx = doesn't exist
                let exists = false;
                if (platform.name === 'GitHub') {
                    exists = status === 200;
                }
                else {
                    exists = status === 200;
                }
                results.push({ platform: platform.name, url, exists, status });
                rawData[`platform_${platform.name.toLowerCase().replace(/[^a-z]/g, '')}`] = { url, status, exists };
                if (exists) {
                    existsCount++;
                    findings.push({
                        source: 'UsernameCheck',
                        field: platform.name,
                        value: url,
                        confidence: 80,
                        url
                    });
                }
            }
            catch {
                // Individual platform failure – mark as unknown
                results.push({ platform: platform.name, url, exists: false, status: 0 });
            }
            await osintDelay(400); // Rate limiting
        }
        // Summary
        findings.unshift({
            source: 'UsernameCheck',
            field: 'summary',
            value: `${existsCount}/${PLATFORMS.length} platforms – ${PLATFORMS.map(p => p.name).filter((_, i) => results[i]?.exists).join(', ') || 'none found'}`,
            confidence: 100
        });
        if (existsCount === 0) {
            findings.push({
                source: 'UsernameCheck',
                field: 'note',
                value: `Username "${username}" not found on major platforms – may be unused or very private`,
                confidence: 60
            });
        }
        rawData['platform_results'] = results;
        return {
            collector: 'UsernameCollector',
            findings,
            errors,
            rawData
        };
    }
}
