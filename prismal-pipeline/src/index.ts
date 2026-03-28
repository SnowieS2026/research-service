// Prismal Newsletter Pipeline -- Main Entry Point
// Mon-Fri: Daily newsletter | Sunday: Weekly round-up
// Usage: node dist/index.js --mode [daily|weekly] --output [path]

import * as fs from "fs";
import * as path from "path";
import { SearxNGSearcher } from "./search.js";
import { scrapeArticles, deduplicateArticles } from "./scraper.js";
import { ArticleStore } from "./article-store.js";
import { checkDomain, checkDate, assignBeat, type QualityResult } from "./quality-filter.js";
import { rankArticles, type ScoredArticle } from "./relevance-scorer.js";
import { writeNewsletterFallback } from "./writer.js";
import { compileDailyReport, type DailyReportInput } from "./compiler-daily.js";
import { compileWeeklyReport, type WeeklyReportInput } from "./compiler-weekly.js";
import { createPost, markdownToHtml } from "./beehiiv.js";

// ── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const modeArg = args.find(a => a === "--mode") ? args[args.indexOf("--mode") + 1] : "daily";
const outputArg = args.find(a => a === "--output") ? args[args.indexOf("--output") + 1] : null;
const publishArg = args.includes("--publish");
const issueArg = args.find(a => a === "--issue") ? parseInt(args[args.indexOf("--issue") + 1], 10) : null;
const dryRun = args.includes("--dry-run") || !publishArg; // default: dry-run

const mode = (modeArg === "weekly" ? "weekly" : "daily") as "daily" | "weekly";
const outputPath = outputArg || `reports/${mode === "daily" ? "daily" : "weekly"}/${formatDate(new Date())}.md`;

// ── Issue number ──────────────────────────────────────────────────────────────
// Always Issue 1 unless --issue is passed. After lock-in, use --issue 2, then 3, etc.
// The lock file (reports/.issue-lock) stores the *next* issue number.
function getNextIssueNumber(): number {
  if (issueArg !== null) return issueArg;
  const lockPath = path.join(__dirname, "..", "reports", ".issue-lock");
  try {
    if (fs.existsSync(lockPath)) {
      return parseInt(fs.readFileSync(lockPath, "utf8").trim(), 10);
    }
  } catch { /* ignore */ }
  return 1;
}
const issueNumber = getNextIssueNumber();

// ── Search queries per mode ───────────────────────────────────────────────────

const DAILY_QUERIES = [
  // Tech -- AI, Regulation, Big Tech
  { q: "artificial intelligence AI news today 2026", beat: "tech" },
  { q: "OpenAI Google DeepMind Anthropic news today", beat: "tech" },
  { q: "cybersecurity data breach ransomware today 2026", beat: "tech" },
  { q: "Big Tech antitrust regulation news today", beat: "tech" },
  { q: "semiconductor chip shortage news today", beat: "tech" },
  { q: "tech layoffs acquisition funding news today", beat: "tech" },
  { q: "EU AI Act tech regulation Europe news today", beat: "tech" },
  { q: "China tech news today 2026", beat: "tech" },
  // Intelligence, surveillance, and covert tech operations
  { q: "CIA NSA intelligence operation exposed today 2026", beat: "geopolitics" },
  { q: "surveillance state privacy breach today 2026", beat: "geopolitics" },
  { q: "dark web cybercrime underground today 2026", beat: "geopolitics" },
  // Finance -- Markets, Macro, Crypto
  { q: "stock market S&P 500 Nasdaq today 2026", beat: "finance" },
  { q: "Federal Reserve interest rate decision today", beat: "finance" },
  { q: "inflation CPI economic data today 2026", beat: "finance" },
  { q: "bitcoin ethereum cryptocurrency price today", beat: "finance" },
  { q: "oil gold commodities markets today 2026", beat: "finance" },
  { q: "banking crisis credit default news today", beat: "finance" },
  { q: "ECB Bank of England interest rates today", beat: "finance" },
  { q: "JP Morgan Goldman Sachs Morgan Stanley news today", beat: "finance" },
  { q: "Treasury bond yield curve today 2026", beat: "finance" },
  { q: "forex dollar euro yen yuan today", beat: "finance" },
  // Dark money, sanctions, financial intelligence
  { q: "dark money sanctions oligarchs financial leak today 2026", beat: "finance" },
  { q: "offshore finance tax haven leak today 2026", beat: "finance" },
  // Geopolitics -- Major Powers
  { q: "US China trade tariffs diplomacy news today", beat: "geopolitics" },
  { q: "Russia Ukraine war latest news today 2026", beat: "geopolitics" },
  { q: "Middle East Iran Israel news today 2026", beat: "geopolitics" },
  { q: "NATO military alliance news today", beat: "geopolitics" },
  { q: "G7 G20 summits diplomacy news today", beat: "geopolitics" },
  { q: "South China Sea Taiwan tensions today", beat: "geopolitics" },
  // Intelligence and clandestine operations
  { q: "covert operation intelligence briefing today 2026", beat: "geopolitics" },
  { q: "diplomatic cables whistleblower today 2026", beat: "geopolitics" },
  { q: "military intelligence operation today 2026", beat: "geopolitics" },
  // Geopolitics -- Europe
  { q: "Germany France UK politics news today", beat: "geopolitics" },
  { q: "European Union energy crisis news today", beat: "geopolitics" },
  // Geopolitics -- Asia
  { q: "India Pakistan tensions news today", beat: "geopolitics" },
  { q: "North Korea nuclear missile news today", beat: "geopolitics" },
  { q: "Japan South Korea US alliance news today", beat: "geopolitics" },
  // Geopolitics -- Americas / Africa / underreported
  { q: "Latin America drug cartel politics today", beat: "geopolitics" },
  { q: "Africa conflict minerals democracy news today", beat: "geopolitics" },
  { q: "underreported news stories today 2026", beat: "geopolitics" },
  { q: "whistleblower surveillance news today", beat: "geopolitics" },
  { q: "climate extreme weather economic impact today", beat: "geopolitics" },
  { q: "military spending weapons deal news today", beat: "geopolitics" },
  { q: "sanctions oligarchs asset freeze today", beat: "geopolitics" },
  { q: "disinformation propaganda election news today", beat: "geopolitics" },
  { q: "classified briefing declassified today 2026", beat: "geopolitics" },
  { q: "militia paramilitary force operation today 2026", beat: "geopolitics" },
  { q: "proxy war shadow war escalation today 2026", beat: "geopolitics" },
  { q: "narco-state organised crime today 2026", beat: "geopolitics" },
  { q: "information warfare psyop today 2026", beat: "geopolitics" },
  { q: "strategic minerals supply chain disruption today 2026", beat: "geopolitics" },
  { q: "private military contractor mercenary today 2026", beat: "geopolitics" },
];

const WEEKLY_QUERIES = [
  // Tech -- AI, Regulation, Big Tech (7 days)
  { q: "AI artificial intelligence news this week 2026", beat: "tech" },
  { q: "OpenAI Google DeepMind Anthropic week 2026", beat: "tech" },
  { q: "cybersecurity data breach ransomware week 2026", beat: "tech" },
  { q: "Big Tech antitrust regulation week 2026", beat: "tech" },
  { q: "semiconductor chip week 2026", beat: "tech" },
  { q: "tech layoffs acquisition funding week 2026", beat: "tech" },
  { q: "EU AI Act tech regulation Europe week 2026", beat: "tech" },
  { q: "China tech week 2026", beat: "tech" },
  // Intelligence, surveillance, covert tech operations
  { q: "CIA NSA intelligence operation exposed week 2026", beat: "geopolitics" },
  { q: "surveillance state privacy breach week 2026", beat: "geopolitics" },
  { q: "dark web cybercrime underground week 2026", beat: "geopolitics" },
  // Finance -- Markets, Macro, Crypto
  { q: "stock market S&P 500 Nasdaq week 2026", beat: "finance" },
  { q: "Federal Reserve interest rate week 2026", beat: "finance" },
  { q: "inflation CPI economic data week 2026", beat: "finance" },
  { q: "bitcoin ethereum cryptocurrency price week 2026", beat: "finance" },
  { q: "oil gold commodities markets week 2026", beat: "finance" },
  { q: "banking crisis credit default week 2026", beat: "finance" },
  { q: "ECB Bank of England interest rates week 2026", beat: "finance" },
  { q: "JP Morgan Goldman Sachs Morgan Stanley week 2026", beat: "finance" },
  { q: "Treasury bond yield curve week 2026", beat: "finance" },
  { q: "forex dollar euro yen yuan week 2026", beat: "finance" },
  // Dark money, sanctions, financial intelligence
  { q: "dark money sanctions oligarchs financial leak week 2026", beat: "finance" },
  { q: "offshore finance tax haven leak week 2026", beat: "finance" },
  // Geopolitics -- Major Powers
  { q: "US China trade tariffs diplomacy week 2026", beat: "geopolitics" },
  { q: "Russia Ukraine war week 2026", beat: "geopolitics" },
  { q: "Middle East Iran Israel week 2026", beat: "geopolitics" },
  { q: "NATO military alliance week 2026", beat: "geopolitics" },
  { q: "G7 G20 summits diplomacy week 2026", beat: "geopolitics" },
  { q: "South China Sea Taiwan tensions week 2026", beat: "geopolitics" },
  // Intelligence and clandestine operations
  { q: "covert operation intelligence briefing week 2026", beat: "geopolitics" },
  { q: "diplomatic cables whistleblower week 2026", beat: "geopolitics" },
  { q: "military intelligence operation week 2026", beat: "geopolitics" },
  // Geopolitics -- Europe
  { q: "Germany France UK politics week 2026", beat: "geopolitics" },
  { q: "European Union energy week 2026", beat: "geopolitics" },
  // Geopolitics -- Asia
  { q: "India Pakistan tensions week 2026", beat: "geopolitics" },
  { q: "North Korea nuclear missile week 2026", beat: "geopolitics" },
  { q: "Japan South Korea US alliance week 2026", beat: "geopolitics" },
  // Geopolitics -- Americas / Africa / underreported / clandestine
  { q: "Latin America politics week 2026", beat: "geopolitics" },
  { q: "Africa conflict democracy week 2026", beat: "geopolitics" },
  { q: "underreported news week 2026", beat: "geopolitics" },
  { q: "whistleblower surveillance week 2026", beat: "geopolitics" },
  { q: "climate extreme weather economic impact week 2026", beat: "geopolitics" },
  { q: "military spending weapons deal week 2026", beat: "geopolitics" },
  { q: "sanctions oligarchs week 2026", beat: "geopolitics" },
  { q: "disinformation propaganda election week 2026", beat: "geopolitics" },
  { q: "classified briefing declassified week 2026", beat: "geopolitics" },
  { q: "militia paramilitary force operation week 2026", beat: "geopolitics" },
  { q: "proxy war shadow war escalation week 2026", beat: "geopolitics" },
  { q: "narco-state organised crime week 2026", beat: "geopolitics" },
  { q: "information warfare psyop week 2026", beat: "geopolitics" },
  { q: "strategic minerals supply chain disruption week 2026", beat: "geopolitics" },
  { q: "private military contractor mercenary week 2026", beat: "geopolitics" },
];

// ── Article quality filter -- run before scoring ──────────────────────────────

function filterArticle(article: { url: string; publishedDate?: string; content?: string }): boolean {
  const domainCheck = checkDomain(article.url);
  if (!domainCheck.allowed) return false;

  const dateCheck = checkDate(article.publishedDate, mode === "weekly" ? 7 : 1);
  if (!dateCheck.isRecent) return false;

  // Reject thin content (less than 100 chars of real text)
  if (!article.content || article.content.length < 80) return false;

  return true;
}

// ── Main pipeline ─────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();
  console.log(`\n⬡ PRISMAL -- ${mode === "daily" ? "Daily" : "Weekly"} Pipeline`);
  console.log(`  Started: ${new Date().toISOString()}\n`);

  // Init article store
  const store = new ArticleStore();

  // ── Phase 1: Search ────────────────────────────────────────────────────────
  console.log("  [1/5] Searching...");
  const searcher = new SearxNGSearcher();
  const queries = mode === "daily" ? DAILY_QUERIES : WEEKLY_QUERIES;
  const searchResults = await searcher.searchBatch(queries.map(q => q.q));

  const allUrls = new Set<string>();
  const urlBeatMap = new Map<string, string>();
  searchResults.forEach((result, i) => {
    const beat = queries[i]?.beat || "tech";
    result.results.forEach(r => {
      if (r.url) {
        urlBeatMap.set(r.url, beat);
        allUrls.add(r.url);
      }
    });
  });

  const uniqueUrls = [...allUrls];
  console.log(`  [1/5] Found ${uniqueUrls.length} unique URLs from ${queries.length} queries`);

  // ── Phase 2: Scrape ────────────────────────────────────────────────────────
  console.log("  [2/5] Scraping articles...");
  const articles = await scrapeArticles(uniqueUrls);

  // ── Phase 3: Quality filter & score ───────────────────────────────────────
  console.log("  [3/5] Filtering & scoring...");

  // Filter out low-quality
  const filtered = articles
    .filter(a => filterArticle(a))
    .map(a => {
      const beat = urlBeatMap.get(a.url) || assignBeat(a.url);
      return { ...a, beat };
    });

  console.log(`  [3/5] ${filtered.length}/${articles.length} articles passed quality filter`);

  // Rank and pick top articles
  const ranked = rankArticles(filtered);
  const topArticles = ranked.slice(0, mode === "daily" ? 12 : 20);

  console.log(`  [3/5] Top ${topArticles.length} articles selected by relevance`);

  // Log all scraped articles to the store
  for (const article of articles) {
    const beat = assignBeat(article.url);
    const ranked_article = ranked.find(a => a.url === article.url);
    const relevance = ranked_article
      ? ranked_article.score > 40 ? "high" : ranked_article.score > 20 ? "medium" : "low"
      : "low";
    try {
      store.upsert({
        url: article.url,
        title: article.title,
        domain: new URL(article.url).hostname.replace(/^www\./, ""),
        beat: beat as "tech" | "finance" | "geopolitics",
        relevance: relevance as "high" | "medium" | "low",
        content: article.content,
        description: article.description,
        published_date: article.publishedDate,
        scraped_at: new Date().toISOString(),
      });
    } catch { /* skip duplicate */ }
  }

  // ── Phase 4: Write ─────────────────────────────────────────────────────────
  console.log("  [4/5] Writing newsletter...");

  const date = new Date();
  const dateLabel = mode === "daily"
    ? date.toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : `Week of ${getWeekStart(date).toLocaleDateString("en-GB", { day: "numeric", month: "long" })} - ${date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`;

  // Use top story as featured
  const topStory = topArticles[0];

  const writerResult = await writeNewsletterFallback({
    mode,
    dateLabel,
    articles: topArticles.map(a => ({
      title: a.title,
      url: a.url,
      domain: a.domain,
      beat: a.beat || "tech",
      relevance: a.relevance || "medium",
      content: a.content || "",
      publishedDate: a.publishedDate,
      score: a.score,
    })),
    topStory: topStory ? {
      title: topStory.title,
      url: topStory.url,
      domain: topStory.domain,
      beat: topStory.beat || "tech",
      relevance: topStory.relevance || "medium",
      content: topStory.content || "",
      publishedDate: topStory.publishedDate,
      score: topStory.score,
    } : undefined,
    weekNumbers: mode === "weekly" ? store.beatCounts(getWeekStart(new Date()).toISOString()) : undefined,
  });

  const newsletterContent = writerResult.success && writerResult.content
    ? writerResult.content
    : getFallbackContent(topArticles, mode, topStory);

  // ── Phase 5: Compile ────────────────────────────────────────────────────────
  console.log("  [5/5] Compiling report...");

  const runtimeMs = Date.now() - startTime;

  if (mode === "daily") {
    const report = compileDailyReport({
      dateLabel,
      issueNumber,
      newsletterContent,
      sourceCount: topArticles.length,
      runtimeMs,
    });

    // Write markdown file
    const outDir = path.join(__dirname, "..", "reports", "daily");
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = outputPath || path.join(outDir, `${formatDate(new Date())}.md`);
    fs.writeFileSync(outFile, report.markdown, "utf8");
    console.log(`\n  ✓ Report written to: ${outFile}`);

    // ── Phase 6: Publish to BeeHiiv (if --publish) ──────────────────────────
    if (publishArg && !dryRun) {
      console.log("  [6/6] Publishing to BeeHiiv...");
      try {
        const post = await createPost({
          title: `Prismal -- ${dateLabel}`,
          content: report.html,
          contentFormat: "html",
          publish: true,
        });
        console.log(`\n  ✓ Published to BeeHiiv! Post ID: ${post.id}`);
        if (post.web_url) console.log(`  ✓ Live URL: ${post.web_url}`);
      } catch (err) {
        console.error(`\n  ✗ BeeHiiv publish failed: ${err}`);
      }
    } else if (dryRun) {
      console.log("  [6/6] Dry-run -- skipped BeeHiiv publish");
    }

  } else {
    // Weekly
    const weekStart = getWeekStart(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const report = compileWeeklyReport({
      weekStart: weekStart.toISOString().slice(0, 10),
      weekEnd: weekEnd.toISOString().slice(0, 10),
      weekLabel: dateLabel,
      issueNumber,
      newsletterContent,
      sourceCount: topArticles.length,
      runtimeMs,
      beatCounts: store.beatCounts(weekStart.toISOString()),
    });

    const outDir = path.join(__dirname, "..", "reports", "weekly");
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = outputPath || path.join(outDir, `week-${formatDate(new Date())}.md`);
    fs.writeFileSync(outFile, report.markdown, "utf8");
    console.log(`\n  ✓ Report written to: ${outFile}`);

    if (publishArg && !dryRun) {
      console.log("  [6/6] Publishing weekly to BeeHiiv...");
      try {
        const post = await createPost({
          title: `Prismal Weekly -- ${dateLabel}`,
          content: report.html,
          contentFormat: "html",
          publish: true,
        });
        console.log(`\n  ✓ Published to BeeHiiv! Post ID: ${post.id}`);
        if (post.web_url) console.log(`  ✓ Live URL: ${post.web_url}`);
      } catch (err) {
        console.error(`\n  ✗ BeeHiiv publish failed: ${err}`);
      }
    }
  }

  store.close();
  const elapsed = Date.now() - startTime;
  console.log(`\n  Total runtime: ${(elapsed / 1000).toFixed(1)}s\n`);
}

// ── Utilities ────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getWeekStart(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  return new Date(d.setDate(diff));
}

function getFallbackContent(articles: ScoredArticle[], mode: string, topStory?: ScoredArticle): string {
  const dateStr = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  if (mode === "weekly") {
    return `# The Week in Brief\n\nThe most significant stories across tech, finance, and geopolitics this week.\n\n## Top Stories\n\n${articles.slice(0, 5).map((a, i) => `${i + 1}. **${a.title}** -- ${a.domain}`).join("\n\n")}\n\n## Tech\n\n${articles.filter(a => a.beat === "tech").slice(0, 3).map(a => `- **${a.title}** (${a.domain})`).join("\n")}\n\n## Finance\n\n${articles.filter(a => a.beat === "finance").slice(0, 3).map(a => `- **${a.title}** (${a.domain})`).join("\n")}\n\n## Geopolitics\n\n${articles.filter(a => a.beat === "geopolitics").slice(0, 3).map(a => `- **${a.title}** (${a.domain})`).join("\n")}`;
  }

  return `# Today in Prismal\n\n**${dateStr}** -- The most important stories across technology, finance, and geopolitics.\n\n## The Big Story\n\n${topStory ? `**${topStory.title}** -- ${topStory.domain}\n\n${(topStory.content || "").slice(0, 300)}...` : "Major developments today. See top stories below."}\n\n## 💻 Tech\n\n${articles.filter(a => a.beat === "tech").slice(0, 3).map(a => `### ${a.title}\n${(a.content || "").slice(0, 200)}...`).join("\n\n")}\n\n## 💸 Finance\n\n${articles.filter(a => a.beat === "finance").slice(0, 3).map(a => `### ${a.title}\n${(a.content || "").slice(0, 200)}...`).join("\n\n")}\n\n## 🏛️ Geopolitics\n\n${articles.filter(a => a.beat === "geopolitics").slice(0, 3).map(a => `### ${a.title}\n${(a.content || "").slice(0, 200)}...`).join("\n\n")}`;
}

// ── Run ───────────────────────────────────────────────────────────────────────

main().catch(err => {
  console.error("\n✗ Pipeline failed:", err);
  process.exit(1);
});
