import { BaseParser } from './BaseParser.js';
import { Logger } from '../../Logger.js';
/** Tiny random hex ID (no external dep needed) */
function randId(len = 12) {
    return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}
const LOG = new Logger('BugcrowdParser');
/**
 * Known program → primary domain mapping.
 * Used as fallback when no explicit scoped URLs are found on the engagement page.
 * Format: engagement-slug → domain(s) in scope.
 */
const KNOWN_SCOPE_DOMAINS = {
    'okta': ['*.okta.com', '*.okta-cx.com'],
    'zendesk': ['*.zendesk.com', '*.zdusercontent.com'],
    'chime': ['*.chime.com', '*.chime.aws'],
    'kucoin': ['*.kucoin.com', '*.kucoin.cloud'],
    'fireblocks': ['*.fireblocks.com', '*.fireblocks.io'],
    'luno': ['*.luno.com', '*.luno.com/en'],
    'webdotcom': ['*.web.com', '*.register.com'],
    'hostgatar-latam': ['*.hostgator.com', '*.hostgator.mx'],
    'blockchain-dot-com': ['*.blockchain.com', '*.blockchain.info'],
    'magiclabs': ['*.magiclabs.io'],
    'bitgo': ['*.bitgo.com', '*.bitgoapi.com'],
    'bitso': ['*.bitso.com', '*.bitso.bg'],
    'city-of-vienna': ['*.wien.gv.at', '*.city-of-vienna.at'],
    'verisign': ['*.verisign.com', '*.vrtz.com'],
    'justeattakeaway': ['*.just Eat.com', '*.takeaway.com'],
    'underarmour': ['*.underarmour.com', '*.underarmour.co.uk'],
    'underarmour-corp': ['*.underarmour.com', '*.mapmyrun.com'],
    'octopus-deploy': ['*.octopus.com', '*.octopusdeploy.com'],
    'chef': ['*.chef.io', '*.chef.com'],
    'onetrust': ['*.onetrust.com', '*.cookiebot.com'],
    'snapnames': ['*.snapnames.com', '*.namejet.com'],
    'internetbrands': ['*.internetbrands.com', '*.autoblog.com'],
    'ynab': ['*.ynab.com'],
    'rapyd': ['*.rapyd.com', '*.rapyd.cloud'],
    'optus-mbb-og': ['*.optus.com', '*.optusnet.com.au'],
    'moovit-mbb-og': ['*.moovit.com', '*.moovitapp.com'],
    'tempusex': ['*.tempus.com', '*.tempusex.com'],
    'abmc': ['*.abmc.gov'],
    'bia': ['*.bia.gov'],
    'bie': ['*.bie.gov'],
    'blm': ['*.blm.gov'],
    'cfpb': ['*.cfpb.gov'],
    'cisa': ['*.cisa.gov'],
    // Intigriti
    'coveopublicbugbounty': ['*.coveo.com', '*.coveo.io'],
    'iciparisxl': ['*.ici.fr', '*.parisxl.com'],
    'theperfumeshop': ['*.theperfumeshop.com'],
    'marionnaud': ['*.marionnaud.fr'],
    'superdrug': ['*.superdrug.com'],
    'kruidvat': ['*.kruidvat.com', '*.kruidvat.be'],
    'watsons': ['*.watsons.com', '*.watsons.cn'],
    'storebrand-rd': ['*.storebrand.no'],
    'anacondavdp': ['*.anaconda.com'],
    'nutaku-bbp': ['*.nutaku.net'],
    'brazzers-bbp': ['*.brazzers.com'],
    'pornhub-bbp': ['*.pornhub.com'],
    'mydirtyhobby-bbp': ['*.mydirtyhobby.com'],
    'trafficjunky-bbp': ['*.trafficjunky.com'],
    'probiller-bbp': ['*.probiller.com'],
    'digi-vdp': ['*.digi.ng', '*.digi.com.au'],
    'voivulnerabilitydisclosureprogram': ['*.voi.com'],
    'toastvdp': ['*.toasttab.com'],
    'trustedfirmware': ['*.trustedfirmware.org'],
    'liferay-vdp': ['*.liferay.com', '*.liferay.net'],
    'liferaydxp': ['*.liferay.com', '*.liferay.net'],
    'water-linkvdp': ['*.water-link.com'],
    'ubisoftgamesecbbp': ['*.ubisoft.com', '*.ubisoftgame.com'],
};
/** Extract a program slug from a Bugcrowd URL */
function extractSlug(url) {
    try {
        const u = new URL(url);
        const parts = u.pathname.split('/').filter(Boolean);
        const idx = parts.indexOf('engagements');
        if (idx >= 0 && parts[idx + 1]) {
            // Skip "featured" segment: /engagements/featured/<slug>
            const candidate = parts[idx + 1];
            if (candidate === 'featured' && parts[idx + 2])
                return parts[idx + 2];
            return candidate;
        }
        const pidx = parts.indexOf('programs');
        if (pidx >= 0 && parts[pidx + 1])
            return parts[pidx + 1];
        return parts[parts.length - 1];
    }
    catch {
        return '';
    }
}
/** Paths that indicate a generic/non-target Bugcrowd page */
const GENERIC_BUGCROWD_PATHS = ['/about', '/blog', '/hackers', '/privacy', '/terms', '/contact', '/solutions', '/resources', '/faq', '/faqs', '/solutions/security-companies', '/terms-and-conditions', '/privacy/do-not-sell-my-information', '/hackers/faqs', '/docs/bugcrowd'];
/** Deduplicate and filter likely-scope URLs */
function cleanScopeUrls(urls, programUrl) {
    const seen = new Set();
    const slug = extractSlug(programUrl);
    const knownDomains = KNOWN_SCOPE_DOMAINS[slug] ?? [];
    for (const raw of urls) {
        let url;
        try {
            url = new URL(raw.startsWith('http') ? raw : `https://${raw}`).href;
        }
        catch {
            continue;
        }
        if (seen.has(url))
            continue;
        if (url.includes('/auth') || url.includes('/login') || url.includes('/sign_in') || url.includes('/signin'))
            continue;
        if (url.includes('google.com/search') || url.includes('bing.com'))
            continue;
        const isOwnDomain = knownDomains.some(d => url.includes(d.replace('*.', '')));
        // Skip generic Bugcrowd nav/footer pages unless we have an explicit domain match
        if (!isOwnDomain) {
            const parsed = new URL(url);
            const path = parsed.pathname.replace(/\/$/, '');
            const isGeneric = GENERIC_BUGCROWD_PATHS.some(p => path === p || path.startsWith(p + '/'));
            if (parsed.hostname.includes('bugcrowd.com') && isGeneric)
                continue;
        }
        if ((url.includes('wikipedia.org') || url.includes('owasp.org') || url.includes('github.com/')) && !isOwnDomain)
            continue;
        seen.add(url);
    }
    return [...seen];
}
export class BugcrowdParser extends BaseParser {
    /**
     * Parse a Bugcrowd engagement page.
     * Extraction logic is fully inlined inside page.evaluate() so the browser
     * context has everything it needs without referencing module-scope functions.
     */
    async parse(page, programUrl) {
        const url = programUrl.trim();
        // ── Inline extraction (runs entirely inside browser context) ───────────
        const result = await page.evaluate((pageUrl) => {
            const R = {
                programName: null,
                rewards: [],
                scopeAssets: [],
                exclusions: [],
                startedAt: null
            };
            // Program name
            const nameEl = document.querySelector('h2.bc-my-0') ||
                document?.querySelector('.cc-public-header__title') ||
                document.querySelector('h1') ||
                document?.querySelector('[class*="program-title"]');
            if (nameEl)
                R.programName = nameEl.textContent.replace(/\s+/g, ' ').trim();
            // Rewards — legacy card format (.bc-p-3.bc-reward-card)
            for (const card of document.querySelectorAll('.bc-p-3.bc-reward-card')) {
                const label = card.querySelector('.bc-label');
                const amount = card.querySelector('.bc-amount');
                if (label && amount) {
                    R.rewards.push((label.textContent + ' ' + amount.textContent).replace(/\s+/g, ' ').trim());
                }
            }
            // Rewards — CrowdControl SVG graph (cc-reward-graph__values text nodes)
            if (R.rewards.length === 0) {
                for (const t of document.querySelectorAll('.cc-reward-graph__values text')) {
                    const txt = t.textContent.replace(/\s+/g, ' ').trim();
                    if (txt)
                        R.rewards.push(txt);
                }
            }
            // Scope — CrowdControl target groups (.cc-target-grp) or legacy (.bc-targets)
            const ccTargets = document.querySelectorAll('.cc-target-grp a[href]');
            const bcTargets = document.querySelectorAll('.bc-targets a[href]');
            const targetLinks = ccTargets.length > 0 ? ccTargets : bcTargets;
            if (targetLinks.length > 0) {
                for (const a of targetLinks) {
                    const href = a.getAttribute('href') || '';
                    if (href.match(/^https?:\/\//))
                        R.scopeAssets.push(href);
                }
            }
            else {
                // Fallback: collect all https anchors on the page
                for (const a of document.querySelectorAll('a[href]')) {
                    const href = a.getAttribute('href') || '';
                    if (href.match(/^https?:\/\//))
                        R.scopeAssets.push(href);
                }
            }
            // Exclusions
            for (const p of document.querySelectorAll('.bc-out-of-scope p, [class*="out-of-scope"] p')) {
                const txt = p.textContent.replace(/\s+/g, ' ').trim();
                if (txt)
                    R.exclusions.push(txt);
            }
            // Started date
            const metaEl = document.querySelector('.bc-meta, [class*="meta-"], [class*="started"]');
            if (metaEl) {
                const m = metaEl.textContent.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}/);
                if (m)
                    R.startedAt = m[0];
            }
            return R;
        }, url);
        let { programName, rewards, scopeAssets, exclusions, startedAt } = result;
        // Fallback: locator-based program name if evaluate found nothing
        if (!programName) {
            try {
                const name = await page.locator('h2.bc-my-0').first().textContent({ timeout: 5000 }).catch(() => null)
                    || await page.locator('h1').first().textContent({ timeout: 5000 }).catch(() => null);
                if (name)
                    programName = name.trim();
            }
            catch { /* ignore */ }
        }
        // Fallback: raw href scan if evaluate found no scope links
        if (!scopeAssets || scopeAssets.length === 0) {
            try {
                const allLinks = await page.locator('a[href]').all();
                const hrefs = [];
                for (const link of allLinks) {
                    const href = await link.getAttribute('href').catch(() => null);
                    if (href && href.startsWith('https://'))
                        hrefs.push(href);
                }
                scopeAssets = cleanScopeUrls(hrefs, url);
            }
            catch {
                scopeAssets = [];
            }
        }
        // Dedupe scope
        scopeAssets = cleanScopeUrls(scopeAssets || [], url);
        // Fallback: KNOWN_SCOPE_DOMAINS for wildcard programs
        const slug = extractSlug(url);
        if ((!scopeAssets || scopeAssets.length === 0) && KNOWN_SCOPE_DOMAINS[slug]) {
            scopeAssets = KNOWN_SCOPE_DOMAINS[slug];
            LOG.log(`[BugcrowdParser] No explicit scope; using KNOWN_SCOPE_DOMAINS for "${slug}"`);
        }
        // Reward range
        let rewardRange = 'unknown';
        if (rewards && rewards.length > 0) {
            const unique = [...new Set(rewards.map(r => r.replace(/\s+/g, ' ').trim()))];
            rewardRange = unique.join('; ');
        }
        // Description
        let description = '';
        try {
            const raw = await page.locator('p.bc-hint, p.bc-break-wrap, [class*="description"]')
                .first().textContent({ timeout: 3000 }).catch(() => '');
            description = (raw || '').trim();
        }
        catch {
            description = '';
        }
        const id = randId(12);
        return {
            platform: 'bugcrowd',
            program_name: programName || new URL(url).hostname,
            program_url: url,
            scope_assets: scopeAssets || [],
            exclusions: exclusions || [],
            reward_range: rewardRange,
            reward_currency: 'USD',
            payout_notes: '',
            allowed_techniques: [],
            prohibited_techniques: [],
            last_seen_at: startedAt || new Date().toISOString(),
            source_snapshot_hash: id,
            // @ts-expect-error extra
            rewards,
        };
    }
}
