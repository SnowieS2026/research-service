/**
 * Discovery scanner – given a list of URLs, probes each target to:
 * - Confirm it's alive
 * - Collect status codes, content-type, server header, page title, redirects
 * - Extract all visible endpoints from HTML forms and JavaScript
 * - Capture a screenshot for visual review
 */
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { StackDetector, type StackInfo } from '../stackdetector/StackDetector.js';
import { Logger } from '../Logger.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const LOG = new Logger('DiscoveryScanner');

export interface ParameterInfo {
  name: string;
  location: 'query' | 'path' | 'body' | 'header';
  type: 'string' | 'number' | 'boolean' | 'array' | 'unknown';
}

export interface FormField {
  name: string;
  type: string;   // 'text' | 'email' | 'password' | 'submit' | 'checkbox' | 'radio' | 'select' | 'textarea' | 'hidden' | 'file' | 'unknown'
  action: string; // form action URL
  method: string; // 'get' | 'post'
}

export interface DiscoveredEndpoint {
  url: string;
  method: string;
  params: ParameterInfo[];
  formFields: FormField[];
  inJS: boolean;
  source: 'html' | 'js' | 'api';
}

export interface ProbeResult {
  url: string;
  finalUrl: string;
  statusCode: number;
  contentType: string | null;
  server: string | null;
  title: string | null;
  contentLength: number;
  redirected: boolean;
  responseTime: number;
  isStatic: boolean;  // true for images/css/fonts
}

export interface ScanResult {
  url: string;
  stackInfo: StackInfo;
  endpoints: DiscoveredEndpoint[];
  screenshotPath: string | null;
  runDuration: number;
}

// Static asset extensions to skip
const STATIC_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
  '.css', '.scss', '.sass', '.less',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.mp4', '.mp3', '.webm', '.wav',
  '.pdf', '.zip', '.tar', '.gz', '.rar',
  '.exe', '.dmg', '.app'
]);

function isStaticAsset(url: string): boolean {
  try {
    const u = new URL(url);
    const ext = path.extname(u.pathname).toLowerCase();
    return STATIC_EXTENSIONS.has(ext);
  } catch {
    return false;
  }
}

export function extractQueryParams(url: string): ParameterInfo[] {
  try {
    const u = new URL(url);
    const params: ParameterInfo[] = [];
    for (const [name, val] of u.searchParams.entries()) {
      params.push({
        name,
        location: 'query',
        type: inferParamType(val)
      });
    }
    return params;
  } catch {
    return [];
  }
}

function inferParamType(val: string): ParameterInfo['type'] {
  if (/^\d+$/.test(val)) return 'number';
  if (/^(true|false)$/i.test(val)) return 'boolean';
  if (val.includes(',')) return 'array';
  return 'unknown';
}

export class DiscoveryScanner {
  private browser: Browser | undefined;
  private context: BrowserContext | undefined;
  private stackDetector: StackDetector;
  private playwright: typeof import('playwright');

  constructor() {
    this.stackDetector = new StackDetector();
    this.playwright = {} as typeof import('playwright');
  }

  private async ensureBrowser(): Promise<void> {
    if (!this.browser) {
      const { chromium } = await import('playwright');
      this.playwright = { chromium } as typeof import('playwright');
      this.browser = await chromium.launch({ headless: true });
      this.context = await this.browser.newContext({
        ignoreHTTPSErrors: true,
        userAgent: 'Mozilla/5.0 (compatible; DiscoveryScanner/1.0; +bounty-pipeline)'
      });
      LOG.log('DiscoveryScanner browser launched');
    }
  }

  async close(): Promise<void> {
    await this.context?.close();
    await this.browser?.close();
    this.browser = undefined;
    this.context = undefined;
    LOG.log('DiscoveryScanner browser closed');
  }

  /**
   * Probe a URL: check if alive, get metadata, screenshots.
   * Returns null if the URL is unreachable or a static asset.
   */
  async probe(url: string, timeoutMs = 15_000): Promise<ProbeResult | null> {
    if (isStaticAsset(url)) return null;

    const start = Date.now();
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DiscoveryScanner/1.0; +bounty-pipeline)',
          'Accept': 'text/html,*/*',
          'Accept-Encoding': 'identity'
        }
      });

      const responseTime = Date.now() - start;
      const contentType = response.headers.get('content-type') ?? null;
      const server = response.headers.get('server') ?? null;
      const contentLength = parseInt(response.headers.get('content-length') ?? '0', 10);
      const finalUrl = response.url;
      const redirected = finalUrl !== url;

      // Skip non-HTML
      if (contentType && !contentType.includes('text/html') && !contentType.includes('application/json')) {
        return { url, finalUrl, statusCode: response.status, contentType, server, title: null, contentLength, redirected, responseTime, isStatic: true };
      }

      return {
        url,
        finalUrl,
        statusCode: response.status,
        contentType,
        server,
        title: null,
        contentLength,
        redirected,
        responseTime,
        isStatic: false
      };
    } catch {
      return null;
    }
  }

  /**
   * Discover endpoints from a page using Playwright (handles JS-rendered content).
   */
  async discoverEndpoints(pageUrl: string, timeoutMs = 20_000): Promise<{ endpoints: DiscoveredEndpoint[]; title: string | null }> {
    await this.ensureBrowser();
    if (!this.context) throw new Error('Browser not initialised');

    const page = await this.context.newPage();
    const endpoints: DiscoveredEndpoint[] = [];

    try {
      await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: timeoutMs });

      const title = await page.title().catch(() => null);

      // Extract from <form> elements
      const forms = await page.locator('form').evaluateAll((els) =>
        (els as HTMLFormElement[]).map((el) => ({
          action: el.action || pageUrl,
          method: el.method || 'get',
          fields: Array.from(el.elements).map((f) => ({
            name: (f as HTMLInputElement).name,
            type: (f as HTMLInputElement).type || 'text',
          }))
        }))
      );

      for (const form of forms) {
        const actionUrl = form.action.startsWith('http') ? form.action : new URL(form.action, pageUrl).href;
        const params = extractQueryParams(actionUrl);
        endpoints.push({
          url: actionUrl,
          method: form.method.toUpperCase(),
          params,
          formFields: form.fields.map((f) => ({
            name: f.name,
            type: f.type,
            action: actionUrl,
            method: form.method
          })),
          inJS: false,
          source: 'html'
        });
      }

      // Extract links with path parameters (e.g. /users/123/profile)
      const links = await page.locator('a[href]').evaluateAll((els) =>
        els.map((el) => (el as HTMLAnchorElement).href)
      );

      // Look for API-like URLs
      const apiPatterns = [
        /\/api\/[a-zA-Z0-9_/-]+/,
        /\/graphql/,
        /\/v[0-9]+\/[a-zA-Z0-9_/-]+/,
        /\/rest\/[a-zA-Z0-9_/-]+/,
        /\/webhooks?\//,
        /\/endpoints?/,
        /\/hooks?/
      ];

      for (const href of new Set(links)) {
        try {
          const absolute = new URL(href, pageUrl).href;
          if (absolute.startsWith('http') && !isStaticAsset(absolute)) {
            for (const pat of apiPatterns) {
              if (pat.test(absolute)) {
                endpoints.push({
                  url: absolute,
                  method: 'GET',
                  params: extractQueryParams(absolute),
                  formFields: [],
                  inJS: false,
                  source: 'api'
                });
                break;
              }
            }
          }
        } catch {
          // ignore
        }
      }

      // Extract from inline JavaScript
      const jsUrls = await page.locator('script:not([src])').evaluateAll((els) =>
        els.map((el) => (el as HTMLScriptElement).textContent ?? '')
      );

      const urlPattern = /https?:\/\/[^\s"'<>]+/g;
      for (const js of jsUrls) {
        const matches = js.match(urlPattern) ?? [];
        for (const match of matches) {
          try {
            const abs = new URL(match).href;
            if (!isStaticAsset(abs) && abs.startsWith('http')) {
              const params = extractQueryParams(abs);
              endpoints.push({
                url: abs,
                method: 'GET',
                params,
                formFields: [],
                inJS: true,
                source: 'js'
              });
            }
          } catch {
            // ignore
          }
        }

        // Detect API call patterns in JS
        const apiCallPatterns = [
          /(?:fetch|axios|get|post|put|patch|delete)\s*\(\s*["']([^"']+)["']/gi,
          /\/api\/[a-zA-Z0-9_/-]+/g,
          /graphql/gi
        ];

        for (const pat of apiCallPatterns) {
          const patMatches = [...js.matchAll(pat)];
          for (const m of patMatches) {
            try {
              const apiPath = typeof m[1] === 'string' ? m[1] : m[0];
              const abs = new URL(apiPath, pageUrl).href;
              if (!isStaticAsset(abs)) {
                endpoints.push({
                  url: abs,
                  method: (typeof m[1] === 'string' && /(post|put|patch|delete)/i.test(m[0])) ? 'POST' : 'GET',
                  params: extractQueryParams(abs),
                  formFields: [],
                  inJS: true,
                  source: 'js'
                });
              }
            } catch {
              // ignore
            }
          }
        }
      }

      // External JS files
      const externalScripts = await page.locator('script[src]').evaluateAll((els) =>
        els.map((el) => (el as HTMLScriptElement).src)
      );

      for (const src of externalScripts.slice(0, 3)) {
        try {
          const abs = new URL(src, pageUrl).href;
          const jsRes = await fetch(abs, { signal: AbortSignal.timeout(8_000) });
          if (jsRes.ok) {
            const jsText = await jsRes.text();
            const jsMatches = jsText.match(urlPattern) ?? [];
            for (const match of jsMatches) {
              try {
                const absUrl = new URL(match).href;
                if (!isStaticAsset(absUrl)) {
                  endpoints.push({
                    url: absUrl,
                    method: 'GET',
                    params: extractQueryParams(absUrl),
                    formFields: [],
                    inJS: true,
                    source: 'js'
                  });
                }
              } catch {
                // ignore
              }
            }
          }
        } catch {
          // ignore
        }
      }

      return { endpoints, title };
    } finally {
      await page.close();
    }
  }

  /**
   * Capture a screenshot of a URL.
   */
  async captureScreenshot(url: string, outputDir: string): Promise<string | null> {
    await this.ensureBrowser();
    if (!this.context) return null;

    const page = await this.context.newPage();
    try {
      const hash = crypto.createHash('sha256').update(url).digest('hex').slice(0, 12);
      const filename = `${hash}.png`;
      const dir = path.join(outputDir, 'screenshots');
      await fs.promises.mkdir(dir, { recursive: true });
      const filePath = path.join(dir, filename);

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      await page.screenshot({ path: filePath, fullPage: false });
      LOG.log(`Screenshot saved: ${filePath}`);
      return filePath;
    } catch (err) {
      LOG.warn(`Screenshot failed for ${url}: ${err}`);
      return null;
    } finally {
      await page.close();
    }
  }

  /**
   * Run the full discovery pipeline on a list of URLs.
   */
  async scan(urls: string[], outputDir = 'reports'): Promise<ScanResult[]> {
    const results: ScanResult[] = [];
    const seen = new Set<string>();

    // Deduplicate
    const uniqueUrls = urls.filter((u) => {
      try {
        const normalised = new URL(u).href;
        if (seen.has(normalised)) return false;
        seen.add(normalised);
        return true;
      } catch {
        return false;
      }
    });

    for (const url of uniqueUrls) {
      const start = Date.now();

      // Probe
      const probe = await this.probe(url);
      if (!probe) {
        LOG.log(`Skipping unreachable/static: ${url}`);
        continue;
      }

      if (probe.isStatic) {
        LOG.log(`Skipping static asset: ${url}`);
        continue;
      }

      // Stack detection
      const stackInfo = await this.stackDetector.detect(probe.finalUrl);

      // Endpoint discovery
      let endpoints: DiscoveredEndpoint[] = [];
      let title: string | null = null;
      try {
        const disc = await this.discoverEndpoints(probe.finalUrl);
        endpoints = disc.endpoints;
        title = disc.title;
      } catch (err) {
        LOG.warn(`Endpoint discovery failed for ${url}: ${err}`);
      }

      // Screenshot
      let screenshotPath: string | null = null;
      try {
        const today = new Date().toISOString().split('T')[0];
        const screenshotDir = path.join(outputDir, today);
        screenshotPath = await this.captureScreenshot(probe.finalUrl, screenshotDir);
      } catch (err) {
        LOG.warn(`Screenshot failed for ${url}: ${err}`);
      }

      const duration = Date.now() - start;
      LOG.log(`DiscoveryScan complete: ${url} — ${endpoints.length} endpoints, ${stackInfo.technologies.length} techs in ${duration}ms`);

      results.push({
        url: probe.finalUrl,
        stackInfo,
        endpoints,
        screenshotPath,
        runDuration: duration
      });

      // Rate limit between targets
      await new Promise((r) => setTimeout(r, 1000));
    }

    return results;
  }
}
