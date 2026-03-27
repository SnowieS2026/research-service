// SearxNG multi-instance searcher with Wikipedia + DuckDuckGo HTML fallback
// Includes low-quality domain filtering to skip JS-rendered sources

import * as fs from "fs";
import * as path from "path";

const SEARXNG_INSTANCES = [
  "http://localhost:8080",
  "https://searx.party",
  "https://searx.work",
  "https://searx.mw.io",
  "https://searxng.site",
];
const USER_AGENT = "PrismalBot/1.0 (newsletter bot)";
const RESULTS_PER_QUERY = 5;
const RATE_LIMIT_MS = 1200;
const LOG_DIR = path.join(__dirname, "..", "logs");
const SEARCH_LOG = path.join(LOG_DIR, "search.log");

export interface SearchResult {
  title: string;
  url: string;
  engine: string;
  category?: string;
  publishedDate?: string;
  content?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  instance: string;
  query: string;
  success: boolean;
  error?: string;
}

function log(msg: string) {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.appendFileSync(SEARCH_LOG, `[${new Date().toISOString()}] ${msg}\n`);
}

class SearxNGSearcher {
  private instance = SEARXNG_INSTANCES[0];
  private lastRequestTime = 0;
  private requestCount = 0;

  // Known JS-rendered or paywall-heavy domains to skip
  private readonly SKIP_DOMAINS = new Set([
    "finance.yahoo.com",
    "news.yahoo.com",
    "sports.yahoo.com",
    "autos.yahoo.com",
    "makeit.co.id",
    "cc.bingj.com",
    "duckduckgo.com",
    "yahoo.com",
  ]);

  constructor() {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  private async rateLimit(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestTime;
    if (elapsed < RATE_LIMIT_MS) {
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  private filterLowQuality(results: SearchResult[]): SearchResult[] {
    return results.filter((r) => {
      try {
        const domain = new URL(r.url).hostname.replace(/^www\./, "");
        return !this.SKIP_DOMAINS.has(domain);
      } catch {
        return false;
      }
    });
  }

  private async tryInstance(instanceUrl: string, query: string): Promise<SearchResponse> {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      safesearch: "0",
      categories: "general,news",
    });
    const searchUrl = `${instanceUrl}/search?${params}`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const response = await fetch(searchUrl, {
        method: "GET",
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) return { results: [], instance: instanceUrl, query, success: false, error: `HTTP ${response.status}` };
      const data = await response.json() as Record<string, unknown>;
      const raw = Array.isArray(data.results) ? data.results : [];
      const results: SearchResult[] = raw.slice(0, RESULTS_PER_QUERY)
        .filter((r: Record<string, unknown>) => typeof r.url === "string" && (r.url as string).startsWith("http"))
        .map((r: Record<string, unknown>) => ({
          title: String(r.title || "No title"),
          url: String(r.url),
          engine: String(r.engine || instanceUrl),
          publishedDate: r.publishedDate ? String(r.publishedDate) : undefined,
          content: r.content ? String(r.content) : undefined,
        }));
      return { results, instance: instanceUrl, query, success: true };
    } catch (err) {
      return { results: [], instance: instanceUrl, query, success: false, error: String(err) };
    }
  }

  private async searchWikipedia(query: string): Promise<SearchResponse> {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=${RESULTS_PER_QUERY}&srprop=timestamp|snippet`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const response = await fetch(searchUrl, {
        method: "GET",
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) return { results: [], instance: "wikipedia", query, success: false, error: `HTTP ${response.status}` };
      const data = await response.json() as { query?: { search?: Array<{ title: string; pageid: number; snippet: string; timestamp: string }> } };
      const results: SearchResult[] = (data.query?.search || []).map((r) => ({
        title: r.title,
        url: `https://en.wikipedia.org/?curid=${r.pageid}`,
        engine: "wikipedia",
        publishedDate: r.timestamp,
        content: r.snippet.replace(/<[^>]+>/g, ""),
      }));
      return { results, instance: "wikipedia", query, success: true };
    } catch (err) {
      return { results: [], instance: "wikipedia", query, success: false, error: String(err) };
    }
  }

  private async searchDuckDuckGoHTML(query: string): Promise<SearchResponse> {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=en-us`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const response = await fetch(searchUrl, {
        method: "GET",
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36", Accept: "text/html" },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) return { results: [], instance: "duckduckgo_html", query, success: false, error: `HTTP ${response.status}` };
      const html = await response.text();
      const results: SearchResult[] = [];
      const resultRegex = /<a class="result__a" href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
      let match;
      let count = 0;
      while ((match = resultRegex.exec(html)) !== null && count < RESULTS_PER_QUERY) {
        const url = match[1];
        const titleRaw = match[2].replace(/<[^>]+>/g, "").trim();
        if (url && url.startsWith("http") && titleRaw && !titleRaw.includes("http")) {
          results.push({ title: titleRaw, url, engine: "duckduckgo_html" });
          count++;
        }
      }
      // Filter out low-quality domains from DDG results too
      const filtered = this.filterLowQuality(results);
      return { results: filtered, instance: "duckduckgo_html", query, success: true };
    } catch (err) {
      return { results: [], instance: "duckduckgo_html", query, success: false, error: String(err) };
    }
  }

  async search(query: string): Promise<SearchResponse> {
    await this.rateLimit();

    // Step 1: Try SearxNG instances
    for (const instanceUrl of SEARXNG_INSTANCES) {
      const resp = await this.tryInstance(instanceUrl, query);
      if (resp.success) {
        const filtered = this.filterLowQuality(resp.results);
        if (filtered.length > 0) {
          this.instance = instanceUrl;
          log(`Query: "${query}" -> ${filtered.length} results via ${instanceUrl}`);
          return { ...resp, results: filtered };
        }
      }
    }

    // Step 2: Wikipedia fallback
    const wikiResp = await this.searchWikipedia(query);
    if (wikiResp.success && wikiResp.results.length > 0) {
      log(`Query: "${query}" -> ${wikiResp.results.length} results via wikipedia`);
      return wikiResp;
    }

    // Step 3: DuckDuckGo HTML fallback
    const ddgResp = await this.searchDuckDuckGoHTML(query);
    if (ddgResp.success && ddgResp.results.length > 0) {
      log(`Query: "${query}" -> ${ddgResp.results.length} results via duckduckgo_html`);
      return ddgResp;
    }

    log(`Query: "${query}" -> FAILED all sources`);
    return { results: [], instance: "none", query, success: false, error: "All sources failed" };
  }

  async searchBatch(queries: string[]): Promise<SearchResponse[]> {
    const results: SearchResponse[] = [];
    for (const query of queries) {
      results.push(await this.search(query));
      this.requestCount++;
    }
    return results;
  }

  getStats() { return { instance: this.instance, requestCount: this.requestCount }; }
}

export { SearxNGSearcher };
export default SearxNGSearcher;
