import { getAdapter, isSupportedPlatform } from './browser/parsers/PlatformAdapters.js';
import { Logger } from './Logger.js';

const LOG = new Logger('SeedingDiscovery');

export interface SeededProgram {
  url: string;
  platform: string;
  programName?: string;
}

/**
 * Determines which platform a given URL or domain belongs to,
 * and returns the canonical program URL.
 */
export function determinePlatform(urlOrDomain: string): string | null {
  const lower = urlOrDomain.toLowerCase();
  if (lower.includes('bugcrowd.com')) return 'bugcrowd';
  if (lower.includes('hackerone.com')) return 'hackerone';
  if (lower.includes('intigriti.com')) return 'intigriti';
  if (lower.includes('standoff365.com')) return 'standoff365';
  return null;
}

/**
 * Takes a list of URLs or domains (from config TARGET_PROGRAMS) and
 * resolves them into a deduplicated list of canonical program URLs
 * with their detected platform.
 */
export function seedFromTargets(targets: string[]): SeededProgram[] {
  const results: SeededProgram[] = [];

  for (const target of targets) {
    const trimmed = target.trim();
    if (!trimmed) continue;

    const platform = determinePlatform(trimmed);
    if (!platform) {
      LOG.warn(`Could not determine platform for target: ${trimmed}`);
      continue;
    }

    const programUrl = resolveProgramUrl(trimmed, platform);
    if (!programUrl) {
      LOG.warn(`Could not resolve program URL for target: ${trimmed}`);
      continue;
    }

    // Avoid duplicates
    if (!results.some((r) => r.url === programUrl)) {
      results.push({ url: programUrl, platform });
      LOG.log(`Seeded: ${programUrl} (${platform})`);
    }
  }

  return results;
}

/**
 * Resolves a partial URL or domain into a full program page URL.
 */
function resolveProgramUrl(target: string, platform: string): string {
  // Already a full URL pointing to a program page
  if (target.startsWith('http://') || target.startsWith('https://')) {
    try {
      const url = new URL(target);
      // If path already looks like a program page, return as-is
      const pathParts = url.pathname.split('/').filter(Boolean);
      if (pathParts.length >= 1 && pathParts[0] !== 'programs' && pathParts[0] !== 'login') {
        return url.href;
      }
      // /programs/some-program → valid
      if (url.pathname.startsWith('/programs/')) {
        return url.href;
      }
    } catch {
      // fall through to domain-based resolution
    }
  }

  // It's a domain or bare program path – reconstruct
  const baseMap: Record<string, string> = {
    bugcrowd: 'https://bugcrowd.com',
    hackerone: 'https://hackerone.com',
    intigriti: 'https://intigriti.com',
    standoff365: 'https://standoff365.com'
  };

  const base = baseMap[platform] ?? `${platform}.com`;

  if (target.startsWith('/')) {
    return `${base}${target}`;
  }

  // Assume it's a program path (e.g., "uber" for hackerone.com/uber)
  return `${base}/programs/${target}`;
}

/**
 * Takes a seeded program and returns its detected program name (from URL).
 */
export function extractProgramNameFromUrl(url: string, platform: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    // e.g. /programs/uber → "uber"
    if (parts.length >= 2 && parts[0] === 'programs') {
      return parts[1];
    }
    // e.g. /uber → "uber"
    if (parts.length >= 1 && parts[0] !== 'programs') {
      return parts[0];
    }
  } catch {
    // fall through
  }
  return url;
}
