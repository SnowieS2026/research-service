import type { Page } from 'playwright';
import { BaseParser, type NormalisedProgram } from './BaseParser.js';
import { Logger } from '../../Logger.js';
import crypto from 'crypto';

/**
 * Known program slug -> primary domain(s) mapping.
 * Used as fallback when no explicit scoped URLs are found on the engagement page.
 */
const KNOWN_SCOPE_DOMAINS: Record<string, string[]> = {
  'okta':              ['*.okta.com', '*.okta-cx.com'],
  'zendesk':           ['*.zendesk.com', '*.zdusercontent.com'],
  'chime':             ['*.chime.com', '*.chime.aws'],
  'kucoin':            ['*.kucoin.com', '*.kucoin.cloud'],
  'fireblocks':        ['*.fireblocks.com', '*.fireblocks.io'],
  'luno':              ['*.luno.com'],
  'webdotcom':         ['*.web.com', '*.register.com'],
  'hostgatar-latam':   ['*.hostgator.com', '*.hostgator.mx'],
  'blockchain-dot-com':['*.blockchain.com', '*.blockchain.info'],
  'magiclabs':         ['*.magiclabs.io'],
  'bitgo':             ['*.bitgo.com', '*.bitgoapi.com'],
  'bitso':             ['*.bitso.com', '*.bitso.bg'],
  'city-of-vienna':    ['*.wien.gv.at', '*.city-of-vienna.at'],
  'verisign':          ['*.verisign.com', '*.verisign.org'],
  'justeattakeaway':   ['*.just-eat.com', '*.justeat.com'],
  'underarmour':       ['*.underarmour.com', '*.underarmour.co.uk'],
  'underarmour-corp':  ['*.underarmour.com'],
  'octopus-deploy':    ['*.octopus.com', '*.octopusdeploy.com'],
  'chef':              ['*.chef.io', '*.chef.com'],
  'corporatewebsites': ['*.corporatewebsites.com'],
  'datadirect':        ['*.progress.com', '*.datadirect.com'],
  'devtools':          ['*.progress.com', '*.telerik.com'],
  'rapyd':             ['*.rapyd.net', '*.rapyd.com'],
  'optus':             ['*.optus.com.au', '*.optus.com'],
  'moovit':            ['*.moovit.com'],
  'ynab':              ['*.ynab.com'],
};

// URL patterns that are noise (appear in prose but are NOT scope targets)
const NOISE_PATTERNS = [
  'bugcrowd.com', 'firebase.dev', 'apps.apple.com', 'play.google.com',
  'owasp.org', 'github.com', 'forms.gle', 'docs.bugcrowd.com',
  'support.bugcrowd.com', '/register', '/login', '/sign_in',
  'trevor.io', 'trello.com', 'slack.com',
];

function isNoiseUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return NOISE_PATTERNS.some(p => lower.includes(p));
}

export class BugcrowdParser extends BaseParser {
  constructor(logger: Logger) {
    super(logger);
  }

  private hashContent(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  async parse(page: Page, url: string): Promise<NormalisedProgram> {
    let title = '';
    let rewardRange = '';
    const scopeAssets: string[] = [];
    const exclusions: string[] = [];
    let startedAt = '';
    const techniques: string[] = [];

    try {
      const result = await page.evaluate((pageUrl: string) => {
        // -- Program name --------------------------------------------------------
        const title2 = ((): string => {
          const el = document.querySelector('h2.bc-my-0');
          return el?.textContent?.trim() ?? '';
        })();
        if (!title2) return null;

        const bodyText = document.body?.innerText ?? '';

        // -- Rewards -----------------------------------------------------------
        let rewardRange2 = '';

        // Live Bugcrowd: SVG graph structure
        const rewardKeys = Array.from(document.querySelectorAll('.cc-reward-graph__key'));
        const rewardValues = Array.from(document.querySelectorAll('.cc-reward-graph__value'));
        if (rewardKeys.length > 0 && rewardValues.length > 0) {
          const priority = rewardKeys[0].textContent?.trim() ?? '';
          const amount = rewardValues[0].textContent?.trim() ?? '';
          if (priority && amount) rewardRange2 = priority + ' $' + amount;
        }

        // Synthetic fixture: .bc-amount inside reward cards
        if (!rewardRange2) {
          const amountEls = Array.from(document.querySelectorAll('.bc-amount'));
          for (const el of amountEls) {
            const text = el.textContent?.trim() ?? '';
            if (text.match(/\$[\d,]+/)) { rewardRange2 = text; break; }
          }
        }

        // Body text fallback: P1$5,000 - $50,000
        if (!rewardRange2) {
          const m = bodyText.match(/(P\d)[\s\xa0]*\$([\d,]+)[\s\u2013-]*\$?([\d,]+)/);
          if (m) rewardRange2 = m[1] + ' $' + m[2] + ' - $' + m[3];
        }

        // -- Scope assets ------------------------------------------------------
        const scopeAssets2: string[] = [];

        // Live Bugcrowd: structured panel body links
        const panelLinks = document.querySelectorAll('.bc-panel__body a[href^="http"]');
        for (const link of panelLinks) {
          const href = link.getAttribute('href') ?? '';
          if (!href || href.includes('bugcrowd.com') || href.includes('register')) continue;
          const skipSuffixes = ['/help/', '/docs/', '/documentation/', '/register/', '/signup/',
            '/privacy/', '/terms/', '/contact/', '/about/', '/blog/', '/news/', '/press/',
            '/careers/', '/marketplace/', '/solutions/', '/products/', '/pricing/', '/support/', '/changelog/'];
          if (skipSuffixes.some(s => href.includes(s))) continue;
          try {
            const u = new URL(href);
            if (u.pathname.length > 1 || u.hostname.includes('.')) {
              scopeAssets2.push(href);
            }
          } catch { /* skip */ }
        }

        // Synthetic fixture: links inside .bc-targets
        if (scopeAssets2.length === 0) {
          const fixtureLinks = document.querySelectorAll('.bc-targets a[href^="http"]');
          for (const link of fixtureLinks) {
            const href = link.getAttribute('href') ?? '';
            if (href && href.startsWith('http')) scopeAssets2.push(href);
          }
        }

        // Domain fallback from known programs
        if (scopeAssets2.length === 0) {
          const slug = (() => {
            try {
              const u = new URL(pageUrl);
              const parts = u.pathname.split('/').filter(Boolean);
              const engIdx = parts.indexOf('engagements');
              return engIdx >= 0 ? (parts[engIdx + 1] ?? '') : '';
            } catch { return ''; }
          })();
          if (slug && slug in KNOWN_SCOPE_DOMAINS) {
            const domains = KNOWN_SCOPE_DOMAINS[slug] ?? [];
            for (const domain of domains) {
              if (domain.startsWith('*.')) {
                scopeAssets2.push('https://' + domain);
                scopeAssets2.push('https://' + domain.slice(2));
              } else {
                scopeAssets2.push('https://' + domain);
              }
            }
          }
        }

        // Text-extracted URLs (last resort)
        if (scopeAssets2.length === 0) {
          const urlRegex = /https?:\/\/[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}[^\s"'<>]*/g;
          const seen = new Set<string>();
          let match;
          while ((match = urlRegex.exec(bodyText)) !== null) {
            const candidate = match[0];
            if (seen.has(candidate) || isNoiseUrl(candidate)) continue;
            try {
              const u = new URL(candidate);
              if (u.hostname.includes('.') && (u.pathname.length > 1 || candidate.split('.').length > 3)) {
                seen.add(candidate);
                scopeAssets2.push(candidate);
              }
            } catch { /* skip */ }
          }
        }

        // -- Exclusions --------------------------------------------------------
        const exclusions2: string[] = [];
        // Live: structured out-of-scope sections
        const outOfScope = document.querySelectorAll('[class*="out-of-scope"], [class*="exclusion"]');
        for (const el of outOfScope) {
          const text = el.textContent?.trim() ?? '';
          if (text.length > 3) exclusions2.push(text.slice(0, 200));
        }
        // Fixture: .bc-out-of-scope p elements (extract URLs/text from each)
        if (exclusions2.length === 0) {
          const exclSection = document.querySelector('.bc-out-of-scope');
          if (exclSection) {
            // Extract each paragraph's URL if present, otherwise the text
            const paras = exclSection.querySelectorAll('p');
            for (const p of paras) {
              const links = p.querySelectorAll('a[href]');
              if (links.length > 0) {
                for (const a of links) {
                  const href = a.getAttribute('href') ?? '';
                  if (href) exclusions2.push(href);
                }
              } else {
                const text = p.textContent?.trim() ?? '';
                if (text) exclusions2.push(text);
              }
            }
            // If no paragraphs, take the section text as one entry (strip header)
            if (exclusions2.length === 0) {
              const text = exclSection.textContent?.replace(/Out of Scope/i, '').trim() ?? '';
              if (text) exclusions2.push(text);
            }
          }
        }

        // -- Started at --------------------------------------------------------
        const startedAt2 = ((): string => {
          const m = bodyText.match(/Started at ([A-Z][a-z]{2} \d{1,2}, \d{4})/);
          return m ? m[1] : '';
        })();

        // -- Techniques --------------------------------------------------------
        const kw = ['SQLi', 'XSS', 'CSRF', 'SSRF', 'IDOR', 'RCE', 'LFI', 'RFI', 'XXE',
          'OAuth', 'SSO', 'MFA', 'OTP', 'JWT', 'Prompt Injection', 'Jailbreak'];
        const techniques2 = kw.filter(k => bodyText.includes(k));

        return {
          title: title2,
          rewardRange: rewardRange2,
          scopeAssets: scopeAssets2,
          exclusions: exclusions2,
          startedAt: startedAt2,
          techniques: techniques2,
        };
      }, url);

      if (result) {
        title = result.title;
        rewardRange = result.rewardRange;
        scopeAssets.push(...result.scopeAssets);
        exclusions.push(...result.exclusions);
        startedAt = result.startedAt;
        techniques.push(...result.techniques);
      }
    } catch (err) {
      this.logger.warn('BugcrowdParser evaluate failed: ' + (err as Error).message);
    }

    const html = await page.content();
    const hash = this.hashContent(html);

    const program: NormalisedProgram = {
      platform: 'bugcrowd',
      program_name: title || 'Unknown',
      program_url: url,
      scope_assets: scopeAssets,
      exclusions,
      reward_range: rewardRange || 'unknown',
      reward_currency: 'USD',
      payout_notes: '',
      allowed_techniques: techniques,
      prohibited_techniques: [],
      last_seen_at: startedAt || new Date().toISOString().split('T')[0],
      source_snapshot_hash: hash,
    };

    this.logger.log('BugcrowdParser: ' + program.program_name + ' | ' + scopeAssets.length + ' assets | rewards: ' + (rewardRange || 'n/a'));
    return program;
  }
}
