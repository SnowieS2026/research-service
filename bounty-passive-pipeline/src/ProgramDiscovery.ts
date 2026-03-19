import { MetadataBrowser } from './browser/MetadataBrowser.js';
import { getAdapter } from './browser/parsers/PlatformAdapters.js';
import { Logger } from './Logger.js';

const LOG = new Logger('ProgramDiscovery');

export interface DiscoveryResult {
  platform: string;
  programs: string[];
}

/**
 * Discovers all public program URLs for a given platform by scraping
 * the platform's program listing page.
 */
export async function discoverPrograms(platform: string): Promise<DiscoveryResult> {
  const normalizedPlatform = platform.toLowerCase();
  const browser = new MetadataBrowser();
  await browser.init();

  try {
    const listingUrl = getListingUrl(normalizedPlatform);
    LOG.log(`Discovering programs on ${normalizedPlatform} via ${listingUrl}`);

    const page = await browser.navigate(listingUrl);
    await page.waitForLoadState('networkidle');

    const programs = await scrapeProgramLinks(page, normalizedPlatform);

    LOG.log(`Discovered ${programs.length} programs on ${normalizedPlatform}`);
    return { platform: normalizedPlatform, programs };
  } finally {
    await browser.close();
  }
}

function getListingUrl(platform: string): string {
  switch (platform) {
    case 'bugcrowd':
      return 'https://bugcrowd.com/programs';
    case 'hackerone':
      return 'https://hackerone.com/programs';
    case 'intigriti':
      return 'https://intigriti.com/programs';
    case 'standoff365':
      return 'https://standoff365.com/programs';
    default:
      throw new Error(`Unsupported platform for discovery: ${platform}`);
  }
}

async function scrapeProgramLinks(page: import('playwright').Page, platform: string): Promise<string[]> {
  const seen = new Set<string>();
  const selectors = getProgramLinkSelectors(platform);

  for (const sel of selectors) {
    try {
      const count = await page.locator(sel).count();
      for (let i = 0; i < count; i++) {
        const href = await page.locator(sel).nth(i).getAttribute('href');
        if (href) {
          const url = normalizeProgramUrl(href, platform);
          if (url) seen.add(url);
        }
      }
      if (seen.size > 0) break;
    } catch {
      // try next selector
    }
  }

  // Fallback: scrape all links and filter by platform domain
  if (seen.size === 0) {
    try {
      const allLinks = await page.locator('a[href]').evaluateAll((els) =>
        els.map((el) => (el as HTMLAnchorElement).href)
      );
      for (const href of allLinks) {
        const url = normalizeProgramUrl(href, platform);
        if (url) seen.add(url);
      }
    } catch {
      // ignore
    }
  }

  return Array.from(seen);
}

function getProgramLinkSelectors(platform: string): string[] {
  switch (platform) {
    case 'bugcrowd':
      return [
        'a[href^="/programs/"]',
        '.program-card a',
        '.program-list a',
        '[data-testid="program-link"]',
        '.bb-program-card a',
        '.program a'
      ];
    case 'hackerone':
      return [
        'a[href^="/programs/"]',
        '[data-testid="program-card"] a',
        '.program-card a',
        '.programs-list a',
        '.researcher-program-card a'
      ];
    case 'intigriti':
      return [
        'a[href^="/programs/"]',
        '[data-testid="program-card"] a',
        '.program-card a',
        '.program-list a',
        '.bug-bounty-program a'
      ];
    case 'standoff365':
      return [
        'a[href^="/programs/"]',
        '[data-testid="program-card"] a',
        '.program-card a',
        '.program-list a',
        '.bb-program a'
      ];
    default:
      return [];
  }
}

function normalizeProgramUrl(href: string, platform: string): string | null {
  if (!href) return null;

  try {
    // Skip non-program pages
    if (href.includes('/login') || href.includes('/signup') || href.includes('/search') || href.includes('/settings')) {
      return null;
    }

    // Skip external links
    const url = new URL(href);
    const expectedHost = `${platform}.com`;
    if (!url.hostname.endsWith(expectedHost) && !url.hostname.endsWith(`${platform}.io`)) {
      // might be a relative link – reconstruct with platform base
      const baseUrl = getListingUrl(platform).replace('/programs', '');
      if (href.startsWith('/')) {
        return `${baseUrl}${href}`;
      }
      return null;
    }

    return href.startsWith('http') ? href : `${url.origin}${url.pathname}`;
  } catch {
    // Relative URL – reconstruct
    if (href.startsWith('/')) {
      const base = getListingUrl(platform).replace('/programs', '').replace(/\/$/, '');
      return `${base}${href}`;
    }
    return null;
  }
}
