// Report compiler — assembles analyses into Prismal newsletter

import * as fs from "fs";
import * as path from "path";
import type { Analysis } from "./analyser";
import type { Tier } from "./branding";
import {
  PRISMAL,
  TIER_CONFIG,
  SEARCH_QUERIES,
  SECTION_HEADERS,
  CATEGORY_EMOJI,
} from "./branding";

export interface CompiledReport {
  frontmatter: {
    publication: string;
    date: string;
    issue: number;
    tier: Tier;
    sources: number;
    runtime: number;
    model: string;
  };
  content: string;
  outputPath: string;
}

function calcIssueNumber(reportsDir: string): number {
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
    return 1;
  }

  const files = fs
    .readdirSync(reportsDir)
    .filter((f) => f.match(/^\d{4}-\d{2}-\d{2}\.md$/));

  return files.length + 1;
}

function sortByRelevanceAndRecency(analyses: Analysis[]): Analysis[] {
  const relevanceWeight = { High: 3, Medium: 2, Low: 1 };
  return [...analyses].sort((a, b) => {
    const weightA =
      relevanceWeight[a.relevance] + (a.crossDomainThemes.length > 0 ? 1 : 0);
    const weightB =
      relevanceWeight[b.relevance] + (b.crossDomainThemes.length > 0 ? 1 : 0);
    return weightB - weightA;
  });
}

function groupByCategory(analyses: Analysis[]): Record<string, Analysis[]> {
  const groups: Record<string, Analysis[]> = {
    tech: [],
    finance: [],
    geopolitics: [],
  };

  for (const analysis of analyses) {
    const titleLower = analysis.title.toLowerCase();
    const significanceLower = analysis.significance.toLowerCase();

    // Simple heuristic for categorization
    if (
      /\b(ai|artificial intelligence|cyber|security|hack|tech|software|quantum|robot|chip|semiconductor|space|cloud|big tech|google|meta|microsoft|apple|openai|startup)\b/i.test(
        titleLower + significanceLower
      )
    ) {
      groups.tech.push(analysis);
    } else if (
      /\b(stock|market|finance|crypto|bitcoin|inflation|recession|interest rate|fed|bank|trading|equity|bond|oil|commodity|economic|tariff|trade)\b/i.test(
        titleLower + significanceLower
      )
    ) {
      groups.finance.push(analysis);
    } else {
      groups.geopolitics.push(analysis);
    }
  }

  return groups;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildStorySection(
  analysis: Analysis,
  categoryEmoji: string
): string {
  const domain = (() => {
    try {
      return new URL(analysis.url).hostname.replace(/^www\./, "");
    } catch {
      return "unknown";
    }
  })();

  return `### [${analysis.title}](${analysis.url})
**Source:** ${domain} | **Published:** Unknown | **Relevance:** ${analysis.relevance}

${analysis.significance}

> **${analysis.keyQuote}**

`;
}

function buildTldr(analyses: Analysis[]): string {
  // Find the most impactful story (High relevance + cross-domain themes)
  const topStory =
    analyses.find(
      (a) => a.relevance === "High" && a.crossDomainThemes.length > 0
    ) ||
    analyses.find((a) => a.relevance === "High") ||
    analyses[0];

  if (!topStory) return "No significant stories found this cycle.";

  const domain = new URL(topStory.url).hostname.replace(/^www\./, "");

  return `${topStory.significance} This story sits at the intersection of ${topStory.crossDomainThemes.join(" and ") || "multiple domains"}, with potential ripple effects across tech, finance, and geopolitics. (Source: ${domain})`;
}

function buildDeepDive(analyses: Analysis[]): string {
  // Find main story — highest relevance with cross-domain themes
  const mainStory =
    analyses.find(
      (a) => a.relevance === "High" && a.crossDomainThemes.length > 0
    ) ||
    analyses.find((a) => a.relevance === "High") ||
    analyses[0];

  if (!mainStory) {
    return "No dominant story identified this cycle — the news cycle appears fragmented.";
  }

  const domain = new URL(mainStory.url).hostname.replace(/^www\./, "");

  let deepDive = `**${mainStory.title}**\n\n`;

  // Build narrative around the 3 key points
  deepDive += `The most consequential development this week centres on ${mainStory.title.toLowerCase()}. `;
  deepDive += `This story matters because: ${mainStory.threePoints.slice(0, 2).join("; ")}.\n\n`;

  // Join dots across domains
  if (mainStory.crossDomainThemes.length > 0) {
    deepDive += `**Cross-domain impact:** ${mainStory.crossDomainThemes.join(", ") || "This story reverberates across multiple sectors."}\n\n`;
  }

  // Add secondary context from other high-relevance stories
  const otherHigh = analyses
    .filter(
      (a) => a.url !== mainStory.url && a.relevance === "High"
    )
    .slice(0, 2);

  if (otherHigh.length > 0) {
    deepDive += `**Related signals:** `;
    deepDive +=
      otherHigh
        .map(
          (a) =>
            `${a.title} (${new URL(a.url).hostname.replace(/^www\./, "")})`
        )
        .join("; ") + ".\n\n";
  }

  deepDive += `Read the full story at [${domain}](${mainStory.url}).`;

  return deepDive;
}

function buildByTheNumbers(analyses: Analysis[]): string {
  // Generate plausible stats based on the analyses
  const rows: string[] = [];
  const highCount = analyses.filter((a) => a.relevance === "High").length;
  const crossDomain = analyses.filter(
    (a) => a.crossDomainThemes.length > 0
  ).length;

  rows.push("| Metric | Value | Context |");
  rows.push("|--------|-------|---------|");
  rows.push(`| Stories analysed | ${analyses.length} | Total articles processed this cycle |`);
  rows.push(`| High-relevance stories | ${highCount} | Breaking or major implications |`);
  rows.push(`| Cross-domain themes | ${crossDomain} | Stories touching multiple beats |`);
  rows.push(`| Tech stories | ${analyses.filter((a) => /\b(ai|cyber|tech|quantum|robot|chip)\b/i.test(a.title + a.significance)).length} | From the technology beat |`);
  rows.push(`| Finance stories | ${analyses.filter((a) => /\b(stock|market|crypto|inflation|bank)\b/i.test(a.title + a.significance)).length} | From the finance beat |`);
  rows.push(`| Geopolitics stories | ${analyses.filter((a) => !/\b(ai|cyber|tech|quantum|robot|chip|stock|market|crypto|inflation|bank)\b/i.test(a.title + a.significance)).length} | From the geopolitics beat |`);

  return rows.join("\n");
}

function buildSignalsFromTheEdge(analyses: Analysis[]): string {
  // Low/Medium relevance stories that are still worth noting
  const edgeStories = analyses
    .filter((a) => a.relevance !== "High")
    .slice(0, 5);

  if (edgeStories.length === 0) return "No peripheral signals this cycle.";

  return edgeStories
    .map(
      (a) =>
        `- **${a.title}** — ${a.significance.slice(0, 100)}${a.significance.length > 100 ? "..." : ""} [` +
        new URL(a.url).hostname.replace(/^www\./, "") +
        "]"
    )
    .join("\n");
}

export function compileReport(
  analyses: Analysis[],
  tier: Tier,
  outputPath: string,
  runtimeMs: number
): CompiledReport {
  const date = formatDate(new Date());
  const reportsDir = path.dirname(outputPath);
  const issue = calcIssueNumber(reportsDir);
  const config = TIER_CONFIG[tier];
  const analyserModel = "minimax-m2.7:cloud";

  // Sort and cap at tier limit
  const sorted = sortByRelevanceAndRecency(analyses);
  const selected = sorted.slice(0, config.stories);

  // Group by category
  const grouped = groupByCategory(selected);

  // Build sections
  const lines: string[] = [];

  // Frontmatter
  lines.push("---");
  lines.push(`publication: Prismal`);
  lines.push(`date: ${date}`);
  lines.push(`issue: ${issue}`);
  lines.push(`tier: ${tier}`);
  lines.push(`sources: ${analyses.length}`);
  lines.push(`runtime: ${runtimeMs}ms`);
  lines.push(`model: ${analyserModel}`);
  lines.push("---");
  lines.push("");

  // Header
  lines.push("# PRISMAL");
  lines.push(`### ${date} · Issue ${issue} · Tech × Finance × Geopolitics`);
  lines.push("");
  lines.push(PRISMAL.masthead.trim());
  lines.push("");

  // TLDR
  lines.push(SECTION_HEADERS.tldr);
  lines.push("");
  lines.push(buildTldr(selected));
  lines.push("");

  // Tech
  lines.push(SECTION_HEADERS.tech);
  lines.push("");
  for (const a of grouped.tech.slice(0, Math.ceil(config.stories / 3))) {
    lines.push(buildStorySection(a, CATEGORY_EMOJI.tech));
  }
  lines.push("");

  // Geopolitics
  lines.push(SECTION_HEADERS.geopolitics);
  lines.push("");
  for (const a of grouped.geopolitics.slice(0, Math.ceil(config.stories / 3))) {
    lines.push(buildStorySection(a, CATEGORY_EMOJI.geopolitics));
  }
  lines.push("");

  // Finance
  lines.push(SECTION_HEADERS.finance);
  lines.push("");
  for (const a of grouped.finance.slice(0, Math.ceil(config.stories / 3))) {
    lines.push(buildStorySection(a, CATEGORY_EMOJI.finance));
  }
  lines.push("");

  // Deep Dive
  lines.push(`${SECTION_HEADERS.deepDive}${selected[0]?.title || "Main Story of the Week"}`);
  lines.push("");
  lines.push(buildDeepDive(selected));
  lines.push("");

  // By the Numbers
  lines.push(SECTION_HEADERS.byTheNumbers);
  lines.push("");
  lines.push(buildByTheNumbers(selected));
  lines.push("");

  // Signals from the Edge
  lines.push(SECTION_HEADERS.signals);
  lines.push("");
  lines.push(buildSignalsFromTheEdge(selected));
  lines.push("");

  // Footer
  lines.push(SECTION_HEADERS.footer);

  const content = lines.join("\n");

  return {
    frontmatter: {
      publication: "Prismal",
      date,
      issue,
      tier,
      sources: analyses.length,
      runtime: runtimeMs,
      model: analyserModel,
    },
    content,
    outputPath,
  };
}

export function writeReport(report: CompiledReport): void {
  const dir = path.dirname(report.outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(report.outputPath, report.content, "utf-8");
}
