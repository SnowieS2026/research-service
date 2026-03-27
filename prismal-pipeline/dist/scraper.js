"use strict";
// Article content scraper — URL passed via temp file (avoids Windows exec/stdin issues)
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeArticles = scrapeArticles;
exports.deduplicateArticles = deduplicateArticles;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const SCRAPE_SCRIPT = path.join(__dirname, "..", "scrape-article.py");
function getDomain(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    }
    catch {
        return "unknown";
    }
}
async function scrapeArticle(url) {
    const domain = getDomain(url);
    const urlFile = path.join(os.tmpdir(), `prismal_url_${Date.now()}.txt`);
    const outFile = path.join(os.tmpdir(), `prismal_out_${Date.now()}.txt`);
    try {
        // Write URL to temp file (safe — no quoting issues)
        fs.writeFileSync(urlFile, url, "utf8");
        // Call Python: script reads URL from file, writes result to file
        const { stderr } = await execAsync(`python "${SCRAPE_SCRIPT}" < "${urlFile}" > "${outFile}"`, { timeout: 20000, windowsHide: true });
        const stdout = fs.readFileSync(outFile, "utf8");
        const out = (stdout || "").split("\n").find((l) => l.startsWith("SCRAPER_RESULT:"));
        if (!out) {
            const errStr = (stderr || "").toString().slice(0, 200);
            return { url, title: "Untitled", domain, content: "", success: false, error: errStr || "No output" };
        }
        const data = JSON.parse(out.slice("SCRAPER_RESULT:".length));
        const content = (data.content || "").trim();
        const ok = content.length > 100;
        return {
            url,
            title: data.title || "Untitled",
            domain,
            content,
            description: data.desc || undefined,
            publishedDate: data.pubdate || undefined,
            success: ok,
            error: ok ? undefined : "Content too short / paywalled",
        };
    }
    catch (err) {
        return { url, title: "Untitled", domain, content: "", success: false, error: String(err).slice(0, 200) };
    }
    finally {
        try {
            fs.unlinkSync(urlFile);
        }
        catch { /* nop */ }
        try {
            fs.unlinkSync(outFile);
        }
        catch { /* nop */ }
    }
}
// Fallback: Node native fetch for metadata only
async function fetchMetadata(url, domain) {
    try {
        const resp = await fetch(url, {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                Accept: "text/html",
            },
            signal: AbortSignal.timeout(8000),
        });
        if (!resp.ok)
            return { url, title: "Untitled", domain, content: "", success: false, error: `HTTP ${resp.status}` };
        const html = await resp.text();
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const descMatch = html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i);
        const ogDescMatch = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i);
        const pdMatch = html.match(/<meta[^>]+property="article:published_time"[^>]+content="([^"]+)"/i);
        const desc = ogDescMatch?.[1] || descMatch?.[1] || "";
        return {
            url,
            title: titleMatch ? titleMatch[1].trim() : "Untitled",
            domain,
            content: desc,
            description: desc,
            publishedDate: pdMatch?.[1],
            success: !!desc,
        };
    }
    catch {
        return { url, title: "Untitled", domain, content: "", success: false, error: "Fetch failed" };
    }
}
async function scrapeArticles(urls) {
    const results = [];
    for (const url of urls) {
        process.stdout.write(".");
        const result = await scrapeArticle(url);
        if (!result.success || result.content.length < 50) {
            const fallback = await fetchMetadata(url, result.domain);
            if (fallback.success) {
                results.push(fallback);
                await new Promise((r) => setTimeout(r, 200));
                continue;
            }
        }
        results.push(result);
        await new Promise((r) => setTimeout(r, 200));
    }
    console.log("");
    return results;
}
function deduplicateArticles(articles) {
    const seen = new Set();
    return articles.filter((a) => { if (seen.has(a.url))
        return false; seen.add(a.url); return true; });
}
