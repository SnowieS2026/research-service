/**
 * Shared HTTP utility for OSINT collectors.
 * Uses Node.js native fetch (ESM).
 */
import { Logger } from '../Logger.js';

const LOG = new Logger('OsintHttp');

const DEFAULT_TIMEOUT = 15_000;

export interface HttpOptions {
  timeout?: number;
  headers?: Record<string, string>;
  method?: 'GET' | 'POST';
  body?: string;
}

/**
 * Fetch with timeout and error wrapping.
 */
export async function osintFetch(
  url: string,
  options: HttpOptions = {}
): Promise<string> {
  const { timeout = DEFAULT_TIMEOUT, ...rest } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const resp = await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OSINT-Bot/1.0)',
        'Accept': 'application/json, text/html, */*',
        ...(rest.headers ?? {})
      }
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status} for ${url}`);
    }

    return await resp.text();
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Timeout after ${timeout}ms for ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Parse JSON safely, returning null on failure.
 */
export function tryParseJson<T = unknown>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

/**
 * Delay helper to respect rate limits.
 */
export async function osintDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── SearxNG Search ───────────────────────────────────────────────────────────

const SEARXNG_INSTANCES = [
  'http://localhost:8080',
  'https://searx.party',
  'https://searx.mw.io',
];

/** Fallback public instances tried in order if no local instance is configured. */
const SEARXNG_FALLBACK_INSTANCES = [
  'https://searx.work',
  'https://searxng.site',
];

export interface SearxngResult {
  title: string;
  url: string;
  engines: string[];
  content?: string;
}

export interface SearxngResponse {
  results: SearxngResult[];
}

/**
 * Search via public SearxNG instances with fallback.
 * Returns results in the same shape as the old ddgSearch() output.
 */
export async function searxngSearch(
  query: string,
  count = 10
): Promise<Array<{ title: string; url: string; snippet?: string }>> {
  const safesearch = 0;
  const instances: string[] = [];

  // 1. Local instance (best — no rate limits, no blocking)
  const localUrl = process.env.SEARXNG_URL;
  if (localUrl) {
    instances.push(localUrl);
  }

  // 2. Primary public instances
  instances.push(...SEARXNG_INSTANCES);

  // 3. Additional fallback public instances
  instances.push(...SEARXNG_FALLBACK_INSTANCES);

  for (const base of instances) {
    try {
      const url = `${base}/search?q=${encodeURIComponent(query)}&format=json&safesearch=${safesearch}&engines=bing,mojeek`;
      const text = await osintFetch(url, { timeout: 15_000 });
      const json = tryParseJson<SearxngResponse>(text, { results: [] });
      if (!json.results) continue;
      // Return results if any (even 0 is a valid response — don't keep falling through)
      return json.results.slice(0, count).map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.content,
      }));
    } catch {
      // network/http error — try next instance
    }
  }
  throw new Error('All SearxNG instances failed');
}
