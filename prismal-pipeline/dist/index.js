#!/usr/bin/env node
"use strict";
// Prismal Newsletter Pipeline — Main Entry Point
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
const path = __importStar(require("path"));
const search_1 = require("./search");
const scraper_1 = require("./scraper");
const analyser_1 = require("./analyser");
const compiler_1 = require("./compiler");
const branding_1 = require("./branding");
// CLI argument parsing
function parseArgs() {
    const args = process.argv.slice(2);
    let tier = "standard";
    let output = "";
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--tier" && args[i + 1]) {
            const t = args[i + 1].toLowerCase();
            if (["kickstart", "standard", "deep"].includes(t)) {
                tier = t;
                i++;
            }
        }
        else if (args[i] === "--output" && args[i + 1]) {
            output = args[i + 1];
            i++;
        }
        else if (args[i] === "--help" || args[i] === "-h") {
            console.log(`
Prismal Newsletter Pipeline

Usage:
  node dist/index.js [options]

Options:
  --tier [kickstart|standard|deep]   Compilation depth (default: standard)
                                       kickstart = 6 stories, 3 queries/beat
                                       standard = 9 stories, 5 queries/beat
                                       deep = 15 stories, 8 queries/beat
  --output <path>                      Output file path (default: reports/YYYY-MM-DD.md)

Examples:
  node dist/index.js --tier kickstart --output reports/kickstart.md
  node dist/index.js --tier deep --output reports/deep-dive.md
  node dist/index.js  # uses defaults
`);
            process.exit(0);
        }
    }
    return { tier, output };
}
function getQueriesForTier(tier) {
    const config = branding_1.TIER_CONFIG[tier];
    const numQueries = config.queries;
    const allQueries = [...branding_1.SEARCH_QUERIES.tech, ...branding_1.SEARCH_QUERIES.finance, ...branding_1.SEARCH_QUERIES.geopolitics];
    // Select evenly from each category
    const perCategory = Math.ceil(numQueries / 3);
    const techQueries = branding_1.SEARCH_QUERIES.tech.slice(0, perCategory);
    const financeQueries = branding_1.SEARCH_QUERIES.finance.slice(0, perCategory);
    const geopolQueries = branding_1.SEARCH_QUERIES.geopolitics.slice(0, perCategory);
    return [...techQueries, ...financeQueries, ...geopolQueries].slice(0, numQueries);
}
async function run() {
    const startTime = Date.now();
    const { tier, output: outputArg } = parseArgs();
    const config = branding_1.TIER_CONFIG[tier];
    console.log(`
╔══════════════════════════════════════════════════════╗
║  ⬡ PRISMAL  ·  Refracting signal from noise         ║
╚══════════════════════════════════════════════════════╝
`);
    console.log(`[Pipeline] Starting — tier: ${tier}, target stories: ${config.stories}, queries: ${config.queries}`);
    console.log("");
    // Step 1: Search
    console.log("[1/5] Searching SearxNG instances...");
    const searcher = new search_1.SearxNGSearcher();
    const queries = getQueriesForTier(tier);
    console.log(`[Search] Running ${queries.length} queries...`);
    const searchResponses = await searcher.searchBatch(queries);
    const allResults = [];
    for (const response of searchResponses) {
        console.log(`  "${response.query}" → ${response.results.length} results via ${response.instance}`);
        allResults.push(...response.results);
    }
    // Deduplicate
    const seen = new Set();
    const uniqueResults = allResults.filter((r) => {
        if (seen.has(r.url))
            return false;
        seen.add(r.url);
        return true;
    });
    console.log(`[Search] Total: ${allResults.length} results → ${uniqueResults.length} unique`);
    console.log("");
    // Step 2: Scrape
    console.log("[2/5] Scraping article content...");
    const urls = uniqueResults.map((r) => r.url).slice(0, config.results);
    console.log(`[Scraper] Processing ${urls.length} articles...`);
    const scraped = await (0, scraper_1.scrapeArticles)(urls);
    const deduplicated = (0, scraper_1.deduplicateArticles)(scraped);
    const successfulScrapes = deduplicated.filter((a) => a.success);
    console.log(`[Scraper] ${successfulScrapes.length}/${deduplicated.length} articles scraped successfully`);
    console.log("");
    // Step 3: Analyse
    console.log("[3/5] Running AI analysis via Ollama...");
    console.log(`[Analyser] Processing ${successfulScrapes.length} articles (rate-limited to 1.5s/article)...`);
    const analyses = await (0, analyser_1.analyseArticles)(successfulScrapes);
    console.log(`[Analyser] ${analyses.length} analyses complete`);
    console.log("");
    // Step 4: Compile
    console.log("[4/5] Compiling report...");
    // Determine output path
    const today = new Date().toISOString().slice(0, 10);
    const defaultOutput = path.join(__dirname, "..", "reports", `${today}.md`);
    const outputPath = outputArg || defaultOutput;
    const runtimeMs = Date.now() - startTime;
    const report = (0, compiler_1.compileReport)(analyses, tier, outputPath, runtimeMs);
    console.log(`[Compiler] Issue #${report.frontmatter.issue}, ${report.frontmatter.sources} sources, ${runtimeMs}ms runtime`);
    console.log("");
    // Step 5: Write
    console.log("[5/5] Writing report to disk...");
    (0, compiler_1.writeReport)(report);
    const elapsed = Date.now() - startTime;
    console.log(`[Done] Report written to: ${outputPath}`);
    console.log(`[Done] Total runtime: ${elapsed}ms`);
    console.log("");
    console.log("Report frontmatter:");
    console.log(`  publication: ${report.frontmatter.publication}`);
    console.log(`  date: ${report.frontmatter.date}`);
    console.log(`  issue: ${report.frontmatter.issue}`);
    console.log(`  tier: ${report.frontmatter.tier}`);
    console.log(`  sources: ${report.frontmatter.sources}`);
    console.log(`  runtime: ${report.frontmatter.runtime}ms`);
    console.log(`  model: ${report.frontmatter.model}`);
}
run().catch((err) => {
    console.error("[Pipeline Error]", err);
    process.exit(1);
});
