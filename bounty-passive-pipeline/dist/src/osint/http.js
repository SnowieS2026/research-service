/**
 * Shared HTTP utility for OSINT collectors.
 * Uses Node.js native fetch (ESM).
 */
import { Logger } from '../Logger.js';
const LOG = new Logger('OsintHttp');
const DEFAULT_TIMEOUT = 15_000;
/**
 * Fetch with timeout and error wrapping.
 */
export async function osintFetch(url, options = {}) {
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
    }
    catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
            throw new Error(`Timeout after ${timeout}ms for ${url}`);
        }
        throw err;
    }
    finally {
        clearTimeout(timer);
    }
}
/**
 * Parse JSON safely, returning null on failure.
 */
export function tryParseJson(text, fallback) {
    try {
        return JSON.parse(text);
    }
    catch {
        return fallback;
    }
}
/**
 * Delay helper to respect rate limits.
 */
export async function osintDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
