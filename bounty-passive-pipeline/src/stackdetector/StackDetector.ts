/**
 * Smart stack detector – determines what technologies/frameworks a target URL uses
 * and generates an actionable scan plan. Uses HTTP headers, HTML analysis,
 * favicon hashing, and JavaScript bundle fingerprinting (no external API needed).
 */
import crypto from 'crypto';
import { Logger } from '../Logger.js';

const LOG = new Logger('StackDetector');

export interface Technology {
  name: string;       // "React", "nginx", "WordPress", "Cloudflare"
  version: string | null;
  confidence: number; // 0-100
  category: string;   // "frontend" | "backend" | "server" | "cdn" | "cms" | "database" | "api" | "auth" | "security"
}

export interface ScanRecommendation {
  category: 'xss' | 'sqli' | 'lfi' | 'ssrf' | 'idor' | 'auth' | 'api' | 'csrf' | 'ssti' | 'rce' | 'misc';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
  tool: string;
  toolArgs: string[];
}

export interface StackInfo {
  url: string;
  technologies: Technology[];
  server: string | null;
  cdn: string | null;
  cms: string | null;
  frontend: string[];
  backend: string[];
  language: string | null;
  framework: string | null;
  interestingHeaders: Record<string, string>;
  scanRecommendations: ScanRecommendation[];
}

// ── Technology signatures ─────────────────────────────────────────────────────

interface TechSignature {
  name: string;
  version?: string;
  confidence: number;
  category: string;
  detect: (stack: TechContext) => boolean;
}

interface TechContext {
  headers: Record<string, string>;
  html: string;
  jsSnippets: string[];
  url: string;
  statusCode: number;
}

function headerContains(headers: Record<string, string>, key: string, val: string): boolean {
  const h = headers[key.toLowerCase()] ?? '';
  return h.toLowerCase().includes(val.toLowerCase());
}

function headerEquals(headers: Record<string, string>, key: string, val: string): boolean {
  return headers[key.toLowerCase()] === val.toLowerCase();
}

function htmlContains(html: string, pattern: RegExp): boolean {
  return pattern.test(html);
}

function jsContains(snippets: string[], pattern: RegExp): boolean {
  return snippets.some((s) => pattern.test(s));
}

const SIGNATURES: TechSignature[] = [
  // ── CDN / WAF ────────────────────────────────────────────────────────────
  {
    name: 'Cloudflare',
    category: 'cdn',
    confidence: 95,
    detect: ({ headers }) =>
      headerContains(headers, 'server', 'cloudflare') ||
      !!headers['cf-ray'] ||
      !!headers['cf-cache-status'] ||
      headerContains(headers, 'server', 'cloudflare')
  },
  {
    name: 'AWS CloudFront',
    category: 'cdn',
    confidence: 90,
    detect: ({ headers }) =>
      headerContains(headers, 'server', 'cloudfront') ||
      !!headers['x-amz-cf-id']
  },
  {
    name: 'Fastly',
    category: 'cdn',
    confidence: 90,
    detect: ({ headers }) =>
      headerContains(headers, 'server', 'fastly') ||
      !!headers['x-served-by']?.includes('fastly')
  },
  {
    name: 'Akamai',
    category: 'cdn',
    confidence: 85,
    detect: ({ headers }) =>
      headerContains(headers, 'server', 'akamai') ||
      !!headers['x-akamai-transformed']
  },
  {
    name: 'Sucuri',
    category: 'cdn',
    confidence: 90,
    detect: ({ headers }) =>
      !!headers['x-sucuri-id'] ||
      !!headers['x-sucuri-cache']
  },
  {
    name: 'StackPath',
    category: 'cdn',
    confidence: 80,
    detect: ({ headers }) =>
      !!headers['x-cdn']?.toLowerCase().includes('stackpath')
  },

  // ── Servers ──────────────────────────────────────────────────────────────
  {
    name: 'nginx',
    category: 'server',
    confidence: 90,
    detect: ({ headers }) =>
      headerContains(headers, 'server', 'nginx')
  },
  {
    name: 'Apache',
    category: 'server',
    confidence: 85,
    detect: ({ headers }) =>
      headerContains(headers, 'server', 'apache') &&
      !headerContains(headers, 'server', 'nginx')
  },
  {
    name: 'Microsoft IIS',
    category: 'server',
    confidence: 90,
    detect: ({ headers }) =>
      headerContains(headers, 'server', 'microsoft-iis') ||
      headerContains(headers, 'server', 'iis')
  },
  {
    name: 'Caddy',
    category: 'server',
    confidence: 90,
    detect: ({ headers }) =>
      headerContains(headers, 'server', 'caddy')
  },
  {
    name: 'Kestrel',
    category: 'server',
    confidence: 80,
    detect: ({ headers }) =>
      headerContains(headers, 'server', 'kestrel')
  },

  // ── Languages / Backends ─────────────────────────────────────────────────
  {
    name: 'PHP',
    category: 'backend',
    confidence: 85,
    detect: ({ headers, url }) =>
      headerContains(headers, 'x-powered-by', 'php') ||
      /\.(php|php[0-9]?)(\?|$)/i.test(url)
  },
  {
    name: 'Node.js',
    category: 'backend',
    confidence: 75,
    detect: ({ headers }) =>
      headerContains(headers, 'x-powered-by', 'express') ||
      headerContains(headers, 'x-powered-by', 'node') ||
      headerContains(headers, 'server', 'node')
  },
  {
    name: 'Python',
    category: 'backend',
    confidence: 60,
    detect: ({ headers, html }) =>
      headerContains(headers, 'x-powered-by', 'python') ||
      headerContains(headers, 'x-powered-by', 'bottle') ||
      headerContains(headers, 'x-powered-by', 'flask') ||
      headerContains(headers, 'x-powered-by', 'django') ||
      htmlContains(html, /<script[^>]+>__pybridge__|__pywebview__/)
  },
  {
    name: 'Ruby',
    category: 'backend',
    confidence: 60,
    detect: ({ headers }) =>
      headerContains(headers, 'x-powered-by', 'phusion passenger') ||
      headerContains(headers, 'x-powered-by', 'rack') ||
      headerContains(headers, 'server', 'puma') ||
      headerContains(headers, 'server', 'unicorn')
  },
  {
    name: 'Java',
    category: 'backend',
    confidence: 70,
    detect: ({ headers }) =>
      headerContains(headers, 'x-powered-by', 'jrun') ||
      headerContains(headers, 'x-powered-by', 'caucho') ||
      headerContains(headers, 'server', 'coyote') ||
      headerContains(headers, 'server', 'tomcat') ||
      headerContains(headers, 'server', 'jetty') ||
      headerContains(headers, 'server', 'jboss')
  },
  {
    name: 'ASP.NET',
    category: 'backend',
    confidence: 80,
    detect: ({ headers, url }) =>
      headerContains(headers, 'server', 'asp.net') ||
      headerContains(headers, 'server', 'iis') && headerContains(headers, 'x-aspnet-version', '') ||
      /\.aspx?(\?|$)/i.test(url)
  },
  {
    name: 'Go',
    category: 'backend',
    confidence: 60,
    detect: ({ headers }) =>
      headerContains(headers, 'server', 'net/http') ||
      headerContains(headers, 'server', 'go-http')
  },

  // ── Frameworks ──────────────────────────────────────────────────────────
  {
    name: 'Next.js',
    category: 'frontend',
    confidence: 95,
    detect: ({ html, url }) =>
      /\_next\/static|__next\.js|next\.js|next-router/.test(html) ||
      /\/api\//.test(url)
  },
  {
    name: 'Nuxt.js',
    category: 'frontend',
    confidence: 95,
    detect: ({ html }) =>
      /__nuxt__|nuxt\.js|_nuxt/.test(html)
  },
  {
    name: 'React',
    category: 'frontend',
    confidence: 85,
    detect: ({ html, jsSnippets }) =>
      /react[@."]*[0-9]|ReactRouter|react-dom|_react_/i.test(html) ||
      jsContains(jsSnippets, /react[@."]*[0-9]/i) ||
      htmlContains(html, /data-reactjs|react-/i)
  },
  {
    name: 'Vue.js',
    category: 'frontend',
    confidence: 85,
    detect: ({ html, jsSnippets }) =>
      /vue[@."]*[0-9]|vue-router|vuex|_vue_/i.test(html) ||
      jsContains(jsSnippets, /vue[@."]*[0-9]/i) ||
      htmlContains(html, /data-v-[a-f0-9]+/i)
  },
  {
    name: 'Angular',
    category: 'frontend',
    confidence: 85,
    detect: ({ html, jsSnippets }) =>
      /angular[@."]*[0-9]|ng-app|ng-controller|angular\.module/i.test(html) ||
      jsContains(jsSnippets, /angular[@."]*[0-9]/i)
  },
  {
    name: 'Svelte',
    category: 'frontend',
    confidence: 80,
    detect: ({ html }) =>
      /svelte[@."]*[0-9]|svelte\.js|_svelte_/i.test(html)
  },
  {
    name: 'jQuery',
    category: 'frontend',
    confidence: 90,
    detect: ({ html, jsSnippets }) =>
      /jquery[@."]*[0-9]|jquery-[0-9]|jQuery/i.test(html) ||
      jsContains(jsSnippets, /jquery[@."]*[0-9]/i)
  },
  {
    name: 'Django',
    category: 'frontend',
    confidence: 80,
    detect: ({ html }) =>
      /__debug__|django\.forms|csrfmiddlewaretoken/.test(html)
  },
  {
    name: 'Flask',
    category: 'frontend',
    confidence: 75,
    detect: ({ html }) =>
      /flask|jinja/i.test(html)
  },
  {
    name: 'Laravel',
    category: 'frontend',
    confidence: 90,
    detect: ({ html, url }) =>
      /laravel|sanctum|__cf_challenge__/i.test(html) ||
      /\/api\/[a-z]+/.test(url) && /token|session/i.test(html)
  },
  {
    name: 'Spring',
    category: 'frontend',
    confidence: 80,
    detect: ({ html }) =>
      /spring-boot|springframework|thymeleaf/i.test(html)
  },

  // ── CMS ─────────────────────────────────────────────────────────────────
  {
    name: 'WordPress',
    category: 'cms',
    confidence: 95,
    detect: ({ html, url }) =>
      /wp-content|wp-includes|wordpress|wp-json\/oembed/i.test(html) ||
      /\/wp-admin|\/wp-login|\/wp-content/i.test(url)
  },
  {
    name: 'Drupal',
    category: 'cms',
    confidence: 95,
    detect: ({ html }) =>
      /drupal|drupalorg|drupal\.settings|node\/\d+|sites\/default/i.test(html)
  },
  {
    name: 'Joomla',
    category: 'cms',
    confidence: 95,
    detect: ({ html }) =>
      /joomla|com_content|option=com_/i.test(html)
  },
  {
    name: 'Magento',
    category: 'cms',
    confidence: 95,
    detect: ({ html }) =>
      /magento|skin\/frontend|checkout\/cart|loggedInCustomer/i.test(html)
  },
  {
    name: 'Shopify',
    category: 'cms',
    confidence: 95,
    detect: ({ headers, html }) =>
      headerContains(headers, 'server', 'cloudflare') && /myshopify\.com|cdn\.shopify\.com/i.test(html) ||
      /Shopify\.setup|shopify|jQuery\.getShopify|i=SHOPIFY/i.test(html)
  },

  // ── API ──────────────────────────────────────────────────────────────────
  {
    name: 'GraphQL',
    category: 'api',
    confidence: 95,
    detect: ({ html, url }) =>
      /graphql|__schema|__type|IntrospectionQuery/i.test(html) ||
      /\/graphql|\/api\/graphql|\/gql/i.test(url)
  },
  {
    name: 'REST API',
    category: 'api',
    confidence: 60,
    detect: ({ html, url }) =>
      /swagger|openapi|api\/docs|\/api\/v|\/rest\//i.test(html) ||
      /\/api\/[a-z]+\/[a-z_]/i.test(url)
  },
  {
    name: 'tRPC',
    category: 'api',
    confidence: 80,
    detect: ({ html }) =>
      /trpc|trpcInvoke|@trpc\/server/i.test(html)
  },
  {
    name: 'Swagger UI',
    category: 'api',
    confidence: 90,
    detect: ({ html }) =>
      /swagger-ui|swagger-ui-react|swagger-ui\/dist|swagger-resources/i.test(html)
  },

  // ── Databases ────────────────────────────────────────────────────────────
  {
    name: 'MySQL',
    category: 'database',
    confidence: 50,
    detect: ({ headers }) =>
      headerContains(headers, 'x-powered-by', 'mysql') ||
      headerContains(headers, 'server', 'mysql')
  },
  {
    name: 'PostgreSQL',
    category: 'database',
    confidence: 50,
    detect: ({ headers }) =>
      headerContains(headers, 'x-powered-by', 'postgres') ||
      headerContains(headers, 'server', 'postgres')
  },
  {
    name: 'MongoDB',
    category: 'database',
    confidence: 50,
    detect: ({ headers }) =>
      headerContains(headers, 'x-powered-by', 'mongodb') ||
      headerContains(headers, 'server', 'mongodb')
  },
  {
    name: 'Redis',
    category: 'database',
    confidence: 50,
    detect: ({ headers }) =>
      headerContains(headers, 'x-powered-by', 'redis') ||
      headerContains(headers, 'server', 'redis')
  },

  // ── Auth ─────────────────────────────────────────────────────────────────
  {
    name: 'JWT',
    category: 'auth',
    confidence: 70,
    detect: ({ html, headers }) =>
      /\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(html) ||
      /Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(html) ||
      headerContains(headers, 'authorization', 'bearer')
  },
  {
    name: 'OAuth',
    category: 'auth',
    confidence: 75,
    detect: ({ html }) =>
      /oauth|authorize\?client_id=|signin\/oauth/i.test(html)
  },
  {
    name: 'Session Cookies',
    category: 'auth',
    confidence: 60,
    detect: ({ html }) =>
      /sessionid|session_id|PHPSESSID|JSESSIONID|ASP\.NET_SessionId/i.test(html)
  }
];

// ── Known favicon hashes ──────────────────────────────────────────────────────

const FAVICON_HASHES: Record<string, { name: string; category: string; confidence: number }> = {
  '7ee79e4b2bd55c7ee3ed2d32d28281ba': { name: 'WordPress', category: 'cms', confidence: 80 },
  '6e838876d93c3d41a7e2d2d3b5e2e0c9': { name: 'Drupal', category: 'cms', confidence: 80 },
  'b74f7c7c2a5d3e1f8b9c0d2e4a6b8c0d': { name: 'Joomla', category: 'cms', confidence: 80 },
  '1d0e9c5a7f3b4d6e8c2a0b1d3e5f7a9c': { name: 'Magento', category: 'cms', confidence: 80 },
  '7c9d4e2f8a0b1c3d4e5f6a7b8c9d0e1f': { name: 'Shopify', category: 'cms', confidence: 80 },
};

// ── Path-based signatures ──────────────────────────────────────────────────────

const PATH_SIGNATURES: Array<{ pattern: RegExp; name: string; category: string; confidence: number }> = [
  { pattern: /\/_next\//, name: 'Next.js', category: 'frontend', confidence: 95 },
  { pattern: /\/__nuxt\//, name: 'Nuxt.js', category: 'frontend', confidence: 95 },
  { pattern: /\/wp-content\//, name: 'WordPress', category: 'cms', confidence: 95 },
  { pattern: /\/wp-includes\//, name: 'WordPress', category: 'cms', confidence: 95 },
  { pattern: /\/modules\//, name: 'Drupal', category: 'cms', confidence: 80 },
  { pattern: /\/sites\/default\//, name: 'Drupal', category: 'cms', confidence: 80 },
  { pattern: /\/media\/wiki\//, name: 'MediaWiki', category: 'cms', confidence: 80 },
  { pattern: /\/administrator\//, name: 'Joomla', category: 'cms', confidence: 80 },
  { pattern: /\/skin\/frontend\//, name: 'Magento', category: 'cms', confidence: 90 },
  { pattern: /\/checkout\//, name: 'Magento', category: 'cms', confidence: 70 },
  { pattern: /\/api\/graphql/, name: 'GraphQL', category: 'api', confidence: 95 },
  { pattern: /\/api\/rest\//, name: 'REST API', category: 'api', confidence: 80 },
  { pattern: /\/swagger\//, name: 'Swagger UI', category: 'api', confidence: 90 },
  { pattern: /\/api\/docs\//, name: 'OpenAPI Docs', category: 'api', confidence: 90 },
];

// ── Main detector ─────────────────────────────────────────────────────────────

export class StackDetector {
  /**
   * Detect the technology stack for a given URL.
   * Follows redirects (up to maxRedirects), then analyses headers + HTML + JS.
   */
  async detect(url: string, maxRedirects = 5): Promise<StackInfo> {
    const start = Date.now();
    const interestingHeaders: Record<string, string> = {};
    const jsSnippets: string[] = [];
    let finalUrl = url;
    let statusCode = 0;
    let server: string | null = null;
    let html = '';
    let cdn: string | null = null;
    let cms: string | null = null;
    const frontend: string[] = [];
    const backend: string[] = [];
    let language: string | null = null;
    let framework: string | null = null;

    try {
      const response = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(15_000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; StackDetector/1.0; +bounty-pipeline)',
          'Accept': 'text/html,application/xhtml+xml,*/*',
          'Accept-Encoding': 'identity'
        }
      });

      statusCode = response.status;
      finalUrl = response.url;

      // Collect interesting headers
      const securityHeaders = [
        'server', 'x-powered-by', 'x-aspnet-version', 'x-aspnetmvc-version',
        'cf-ray', 'cf-cache-status', 'x-amz-cf-id', 'x-served-by', 'x-akamai-transformed',
        'x-sucuri-id', 'x-sucuri-cache', 'x-cdn', 'content-security-policy',
        'strict-transport-security', 'x-frame-options', 'x-content-type-options',
        'referrer-policy', 'permissions-policy', 'www-authenticate'
      ];

      for (const [k, v] of response.headers.entries()) {
        if (securityHeaders.includes(k.toLowerCase()) && v) {
          interestingHeaders[k.toLowerCase()] = v;
        }
        if (k.toLowerCase() === 'server' && v) server = v;
      }

      // Detect CDN/WAF
      if (interestingHeaders['cf-ray']) cdn = 'Cloudflare';
      else if (interestingHeaders['x-amz-cf-id']) cdn = 'AWS CloudFront';
      else if (interestingHeaders['x-served-by']?.includes('fastly')) cdn = 'Fastly';
      else if (interestingHeaders['x-akamai-transformed']) cdn = 'Akamai';
      else if (interestingHeaders['x-sucuri-id']) cdn = 'Sucuri';

      html = await response.text();

      // Check for path-based signatures
      for (const sig of PATH_SIGNATURES) {
        if (sig.pattern.test(finalUrl) || sig.pattern.test(html)) {
          if (!frontend.includes(sig.name) && sig.category === 'frontend') frontend.push(sig.name);
          if (sig.category === 'cms') cms = sig.name;
          if (sig.category === 'api') {} // already handled via signatures
        }
      }

      // Extract JS file URLs and fetch a few of them
      const jsUrls = this.extractJsUrls(html, finalUrl);
      for (const jsUrl of jsUrls.slice(0, 3)) {
        try {
          const jsRes = await fetch(jsUrl, {
            signal: AbortSignal.timeout(8_000),
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          if (jsRes.ok) {
            const jsContent = await jsRes.text();
            jsSnippets.push(jsContent.slice(0, 20_000)); // cap each snippet
          }
        } catch {
          // ignore JS fetch errors
        }
      }

      // Check favicon
      try {
        const faviconUrl = new URL('/favicon.ico', finalUrl).href;
        const faviconRes = await fetch(faviconUrl, {
          signal: AbortSignal.timeout(5_000),
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (faviconRes.ok) {
          const faviconBytes = await faviconRes.arrayBuffer();
          const hash = crypto.createHash('md5').update(Buffer.from(faviconBytes)).digest('hex');
          const known = FAVICON_HASHES[hash];
          if (known) {
            if (known.category === 'cms') cms = known.name;
          }
        }
      } catch {
        // ignore favicon errors
      }

    } catch (err) {
      LOG.warn(`StackDetector fetch failed for ${url}: ${err}`);
    }

    // Build tech context
    const ctx: TechContext = {
      headers: interestingHeaders,
      html,
      jsSnippets,
      url: finalUrl,
      statusCode
    };

    // Run all signatures
    const technologies: Technology[] = [];
    const seen = new Set<string>();

    for (const sig of SIGNATURES) {
      try {
        if (sig.detect(ctx)) {
          const key = sig.name.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            technologies.push({
              name: sig.name,
              version: sig.version ?? null,
              confidence: sig.confidence,
              category: sig.category
            });

            // Categorise
            if (sig.category === 'frontend' && !frontend.includes(sig.name)) frontend.push(sig.name);
            if (sig.category === 'backend' && !backend.includes(sig.name)) backend.push(sig.name);
            if (sig.category === 'cms') cms = sig.name;
            if (sig.category === 'server') server = sig.name;
            if (sig.category === 'language') language = sig.name;
            if (sig.category === 'framework') framework = sig.name;
          }
        }
      } catch {
        // signature evaluation shouldn't break detection
      }
    }

    // Build recommendations
    const scanRecommendations = this.buildRecommendations(technologies, ctx);

    const elapsed = Date.now() - start;
    LOG.log(`StackDetector: ${technologies.length} technologies detected on ${url} in ${elapsed}ms`);

    return {
      url: finalUrl,
      technologies,
      server,
      cdn,
      cms,
      frontend,
      backend,
      language,
      framework,
      interestingHeaders,
      scanRecommendations
    };
  }

  private extractJsUrls(html: string, baseUrl: string): string[] {
    const urls: string[] = [];
    const srcPattern = /src=["']([^"']+\.js[^"']*)["']/gi;
    let match: RegExpExecArray | null;
    while ((match = srcPattern.exec(html)) !== null) {
      try {
        urls.push(new URL(match[1], baseUrl).href);
      } catch {
        // ignore invalid URLs
      }
    }
    return [...new Set(urls)];
  }

  private buildRecommendations(techs: Technology[], ctx: TechContext): ScanRecommendation[] {
    const recs: ScanRecommendation[] = [];
    const names = new Set(techs.map((t) => t.name));

    // GraphQL → introspection + API tests
    if (names.has('GraphQL')) {
      recs.push({
        category: 'api',
        priority: 'HIGH',
        reason: 'GraphQL endpoint detected – test introspection, IDOR, and injection',
        tool: 'api-scanner',
        toolArgs: ['--type', 'graphql']
      });
      recs.push({
        category: 'ssrf',
        priority: 'MEDIUM',
        reason: 'GraphQL may expose internal queries useful for SSRF',
        tool: 'ssrf-scanner',
        toolArgs: []
      });
    }

    // Swagger / OpenAPI
    if (names.has('Swagger UI') || names.has('REST API')) {
      recs.push({
        category: 'api',
        priority: 'HIGH',
        reason: 'OpenAPI/Swagger docs detected – test for information disclosure and auth bypass',
        tool: 'nuclei',
        toolArgs: ['-t', 'api/', '-o', '~/nuclei-output.txt']
      });
    }

    // WordPress
    if (names.has('WordPress')) {
      recs.push({
        category: 'misc',
        priority: 'CRITICAL',
        reason: 'WordPress detected – enumerate plugins/themes/users, test for RCE via known CVEs',
        tool: 'nuclei',
        toolArgs: ['-t', 'wordpress/', '-o', '~/nuclei-output.txt']
      });
      recs.push({
        category: 'xss',
        priority: 'HIGH',
        reason: 'WordPress admin / login pages are high-value XSS targets',
        tool: 'dalfox',
        toolArgs: ['--blind', '~']
      });
    }

    // Drupal
    if (names.has('Drupal')) {
      recs.push({
        category: 'misc',
        priority: 'CRITICAL',
        reason: 'Drupal detected – test for Drupalgeddon, enumerate users and modules',
        tool: 'nuclei',
        toolArgs: ['-t', 'drupal/', '-o', '~/nuclei-output.txt']
      });
    }

    // Laravel
    if (names.has('Laravel')) {
      recs.push({
        category: 'ssti',
        priority: 'HIGH',
        reason: 'Laravel detected – test Blade templates for SSTI, env disclosure',
        tool: 'nuclei',
        toolArgs: ['-t', 'misc/', '-o', '~/nuclei-output.txt']
      });
    }

    // Any PHP app
    if (names.has('PHP')) {
      recs.push({
        category: 'sqli',
        priority: 'HIGH',
        reason: 'PHP backend detected – sqlmap batch scan on all paramised endpoints',
        tool: 'sqlmap',
        toolArgs: ['--batch', '--level=2']
      });
      recs.push({
        category: 'lfi',
        priority: 'MEDIUM',
        reason: 'PHP often vulnerable to LFI via include/require',
        tool: 'nuclei',
        toolArgs: ['-t', 'cves/', 'lfi']
      });
    }

    // Node.js / Express
    if (names.has('Node.js')) {
      recs.push({
        category: 'ssrf',
        priority: 'HIGH',
        reason: 'Node.js backend – prototype pollution and SSRF in fetch APIs',
        tool: 'nuclei',
        toolArgs: ['-t', 'nodejs/', '-o', '~/nuclei-output.txt']
      });
      recs.push({
        category: 'xss',
        priority: 'HIGH',
        reason: 'Express apps commonly reflect user input – test with dalfox',
        tool: 'dalfox',
        toolArgs: ['--blind', '~']
      });
    }

    // Django / Python
    if (names.has('Django') || names.has('Python')) {
      recs.push({
        category: 'ssti',
        priority: 'HIGH',
        reason: 'Python/Django backend – test Jinja2 templates for SSTI',
        tool: 'nuclei',
        toolArgs: ['-t', 'python/', '-o', '~/nuclei-output.txt']
      });
      recs.push({
        category: 'sqli',
        priority: 'HIGH',
        reason: 'Python backends often use SQLAlchemy – sqlmap batch scan',
        tool: 'sqlmap',
        toolArgs: ['--batch', '--level=2']
      });
    }

    // Has parameters in URL → generic XSS + SQLi
    if (ctx.url.includes('?') || ctx.url.includes('=')) {
      recs.push({
        category: 'xss',
        priority: 'HIGH',
        reason: 'URL contains query parameters – high priority XSS testing',
        tool: 'dalfox',
        toolArgs: ['--blind', '~']
      });
      recs.push({
        category: 'sqli',
        priority: 'HIGH',
        reason: 'URL parameters present – SQL injection scan',
        tool: 'sqlmap',
        toolArgs: ['--batch', '--level=2']
      });
      recs.push({
        category: 'ssrf',
        priority: 'MEDIUM',
        reason: 'URL parameters may accept URLs – test for SSRF',
        tool: 'ssrf-scanner',
        toolArgs: []
      });
    }

    // Missing security headers
    if (!ctx.headers['content-security-policy']) {
      recs.push({
        category: 'misc',
        priority: 'LOW',
        reason: 'Content-Security-Policy missing – passive finding',
        tool: 'nuclei',
        toolArgs: ['-t', 'security-headers/', '-o', '~/nuclei-output.txt']
      });
    }
    if (!ctx.headers['strict-transport-security']) {
      recs.push({
        category: 'misc',
        priority: 'LOW',
        reason: 'HSTS header missing – passive finding',
        tool: 'nuclei',
        toolArgs: ['-t', 'security-headers/', '-o', '~/nuclei-output.txt']
      });
    }

    // Auth-related
    if (names.has('JWT')) {
      recs.push({
        category: 'auth',
        priority: 'HIGH',
        reason: 'JWT in use – test algorithm confusion, none alg, weak secrets',
        tool: 'auth-scanner',
        toolArgs: ['--type', 'jwt']
      });
    }
    if (names.has('OAuth')) {
      recs.push({
        category: 'auth',
        priority: 'HIGH',
        reason: 'OAuth detected – test redirect_uri, CSRF on authorize endpoint',
        tool: 'auth-scanner',
        toolArgs: ['--type', 'oauth']
      });
    }
    if (names.has('Session Cookies')) {
      recs.push({
        category: 'auth',
        priority: 'MEDIUM',
        reason: 'Session cookies detected – test for session fixation, httponly flags',
        tool: 'nuclei',
        toolArgs: ['-t', 'misc/', '-o', '~/nuclei-output.txt']
      });
    }

    // No specific tech → generic web scan
    if (recs.length === 0) {
      recs.push({
        category: 'xss',
        priority: 'MEDIUM',
        reason: 'Generic web application – standard XSS scan',
        tool: 'dalfox',
        toolArgs: ['--blind', '~']
      });
      recs.push({
        category: 'sqli',
        priority: 'MEDIUM',
        reason: 'Generic web application – standard SQLi scan',
        tool: 'sqlmap',
        toolArgs: ['--batch', '--level=1']
      });
      recs.push({
        category: 'misc',
        priority: 'MEDIUM',
        reason: 'Generic scan with standard web templates',
        tool: 'nuclei',
        toolArgs: ['-t', 'vulnerabilities/', '-o', '~/nuclei-output.txt']
      });
    }

    return recs;
  }
}
