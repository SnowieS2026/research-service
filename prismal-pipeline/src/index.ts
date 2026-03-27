#!/usr/bin/env node
// Prismal Newsletter Pipeline — Main Entry Point

import * as path from "path";
import { SearxNGSearcher, type SearchResult } from "./search";
import { scrapeArticles, deduplicateArticles } from "./scraper";
import { analyseArticles } from "./analyser";
import { compileReport, writeReport } from "./compiler";
import { TIER_CONFIG, SEARCH_QUERIES, type Tier } from "./branding";

// CLI argument parsing
function parseArgs(): { tier: Tier; output: string } {
  const args = process.argv.slice(2);
  let tier: Tier = "standard";
  let output = "";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--tier" && args[i + 1]) {
      const t = args[i + 1].toLowerCase();
      if (["kickstart", "standard", "deep"].includes(t)) {
        tier = t as Tier;
        i++;
      }
    } else if (args[i] === "--output" && args[i + 1]) {
      output = args[i + 1];
      i++;
    } else if (args[i] === "--help" || args[i] === "-h") {
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

function getQueriesForTier(tier: Tier): string[] {
  const config = TIER_CONFIG[tier];
  const numQueries = config.queries;
  const allQueries = [...SEARCH_QUERIES.tech, ...SEARCH_QUERIES.finance, ...SEARCH_QUERIES.geopolitics];

  // Select evenly from each category
  const perCategory = Math.ceil(numQueries / 3);
  const techQueries = SEARCH_QUERIES.tech.slice(0, perCategory);
  const financeQueries = SEARCH_QUERIES.finance.slice(0, perCategory);
  const geopolQueries = SEARCH_QUERIES.geopolitics.slice(0, perCategory);

  return [...techQueries, ...financeQueries, ...geopolQueries].slice(0, numQueries);
}

async function run() {
  const startTime = Date.now();
  const { tier, output: outputArg } = parseArgs();
  const config = TIER_CONFIG[tier];

  console.log(`
╔══════════════════════════════════════════════════════╗
║  ⬡ PRISMAL  ·  Refracting signal from noise         ║
╚══════════════════════════════════════════════════════╝
`);
  console.log(`[Pipeline] Starting — tier: ${tier}, target stories: ${config.stories}, queries: ${config.queries}`);
  console.log("");

  // Step 1: Search
  console.log("[1/5] Searching SearxNG instances...");
  const searcher = new SearxNGSearcher();
  const queries = getQueriesForTier(tier);
  console.log(`[Search] Running ${queries.length} queries...`);

  const searchResponses = await searcher.searchBatch(queries);
  const allResults: SearchResult[] = [];

  for (const response of searchResponses) {
    console.log(
      `  "${response.query}" → ${response.results.length} results via ${response.instance}`
    );
    allResults.push(...response.results);
  }

  // Deduplicate
  const seen = new Set<string>();
  const uniqueResults = allResults.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  console.log(`[Search] Total: ${allResults.length} results → ${uniqueResults.length} unique`);
  console.log("");

  // Step 2: Scrape
  console.log("[2/5] Scraping article content...");
  const urls = uniqueResults.map((r) => r.url).slice(0, config.results);
  console.log(`[Scraper] Processing ${urls.length} articles...`);

  const scraped = await scrapeArticles(urls);
  const deduplicated = deduplicateArticles(scraped);
  const successfulScrapes = deduplicated.filter((a) => a.success);

  console.log(`[Scraper] ${successfulScrapes.length}/${deduplicated.length} articles scraped successfully`);
  console.log("");

  // Step 3: Analyse
  console.log("[3/5] Running AI analysis via Ollama...");
  console.log(`[Analyser] Processing ${successfulScrapes.length} articles (rate-limited to 1.5s/article)...`);

  const analyses = await analyseArticles(successfulScrapes);

  console.log(`[Analyser] ${analyses.length} analyses complete`);
  console.log("");

  // Step 4: Compile
  console.log("[4/5] Compiling report...");

  // Determine output path
  const today = new Date().toISOString().slice(0, 10);
  const defaultOutput = path.join(
    __dirname,
    "..",
    "reports",
    `${today}.md`
  );
  const outputPath = outputArg || defaultOutput;

  const runtimeMs = Date.now() - startTime;
  const report = compileReport(analyses, tier, outputPath, runtimeMs);

  console.log(`[Compiler] Issue #${report.frontmatter.issue}, ${report.frontmatter.sources} sources, ${runtimeMs}ms runtime`);
  console.log("");

  // Step 5: Write
  console.log("[5/5] Writing report to disk...");
  writeReport(report);

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
