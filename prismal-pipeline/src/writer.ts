// Writer orchestration -- Ollama direct call fallback
// Persistent subagent session wiring is planned for v2

import * as fs from "fs";
import * as path from "path";

const WRITER_PROMPT_PATH = path.join(__dirname, "..", "agents", "writer-agent.md");

export interface ArticleForWriter {
  title: string;
  url: string;
  domain: string;
  beat: string;
  relevance: string;
  content: string;
  publishedDate?: string;
  score?: number;
}

export interface WriteRequest {
  mode: "daily" | "weekly";
  dateLabel: string;
  articles: ArticleForWriter[];
  topStory?: ArticleForWriter;
  weekNumbers?: Record<string, number>;
}

export interface WriteResult {
  success: boolean;
  content?: string;
  error?: string;
}

function loadWriterPrompt(): string {
  try {
    return fs.readFileSync(WRITER_PROMPT_PATH, "utf8");
  } catch {
    return "You are the Prismal writer. Sharp, curious, direct.";
  }
}

/**
 * Format a single article for the writer. Content is paraphrased only --
 * never copy sentences verbatim. The writer must synthesise from multiple
 * sources and cite inline using [SourceName] notation.
 */
function formatArticle(a: ArticleForWriter, i: number): string {
  // Paraphrase the content: truncate at 1,500 chars but mark it as raw material
  // The writer is instructed to NEVER copy phrasing directly
  const content = ((a.content || a.title) as string).slice(0, 1500);
  return [
    `[${i + 1}] ${a.beat.toUpperCase()} | ${a.relevance.toUpperCase()} | ${a.domain.toUpperCase()}`,
    `    Title: ${a.title}`,
    `    Source: ${a.domain} -- ${a.url}`,
    `    Published: ${a.publishedDate || "Unknown"}`,
    `    Material: ${content}`,
    "",
  ].join("\n");
}

/**
 * Pair two articles on the same topic into a single dual-sourced story slot.
 * Both sources are presented together so the writer synthesises rather than copies.
 */
function formatArticlePair(a1: ArticleForWriter, a2: ArticleForWriter, i: number): string {
  const c1 = ((a1.content || a1.title) as string).slice(0, 1200);
  const c2 = ((a2.content || a2.title) as string).slice(0, 1200);
  return [
    `[${i + 1}] ${a1.beat.toUpperCase()} | DUAL-SOURCED -- BOTH SOURCES MUST BE USED`,
    "",
    "  SOURCE A:",
    `  Title: ${a1.title}`,
    `  Source: ${a1.domain} -- ${a1.url}`,
    `  Published: ${a1.publishedDate || "Unknown"}`,
    `  Material: ${c1}`,
    "",
    "  SOURCE B:",
    `  Title: ${a2.title}`,
    `  Source: ${a2.domain} -- ${a2.url}`,
    `  Published: ${a2.publishedDate || "Unknown"}`,
    `  Material: ${c2}`,
    "",
  ].join("\n");
}

function formatTopStory(topStory?: ArticleForWriter): string {
  if (!topStory) return "";
  const content = ((topStory.content || "") as string).slice(0, 3000);
  return [
    "",
    "## TOP STORY FOR FEATURE -- DUAL SOURCES PROVIDED",
    `Title: ${topStory.title}`,
    `Source: ${topStory.domain} -- ${topStory.url}`,
    `Content: ${content}`,
  ].join("\n");
}

/**
 * Build article list pairing articles on the same topic/beat.
 * Tries to pair consecutive articles of the same beat; falls back to single.
 */
function buildArticleList(articles: ArticleForWriter[]): string {
  const selected = articles.slice(0, 12);
  const lines: string[] = [];
  let i = 0;
  let slot = 1;

  while (i < selected.length) {
    const a = selected[i];
    // Try to pair with next article of same beat
    const next = selected[i + 1];
    if (next && next.beat === a.beat) {
      lines.push(formatArticlePair(a, next, slot - 1));
      i += 2;
    } else {
      lines.push(formatArticle(a, slot - 1));
      i += 1;
    }
    slot++;
  }

  return lines.join("\n");
}

function buildTaskPrompt(req: WriteRequest): string {
  const articleList = buildArticleList(req.articles);
  const topBlock = formatTopStory(req.topStory);
  const weekNote = req.weekNumbers
    ? "\n## Week at a Glance\nStories by beat: " +
      Object.entries(req.weekNumbers).map(([b, n]) => `${b}: ${n}`).join(", ") + "\n"
    : "";

  const sectionRules = req.mode === "daily"
    ? [
        "Write the DAILY newsletter. Include ALL of the following sections in order:",
        "",
        "1. # PRISMAL header (today's date, Issue 1, Tech x Finance x Geopolitics)",
        "2. THE BIG STORY (5-7 sentences, lead with consequence not event, name specific actors and figures)",
        "3. TECH (2-3 stories, each 4-6 full sentences with specific numbers, dates, and consequences)",
        "4. FINANCE (2-3 stories, each 4-6 full sentences with specific market levels, percentages, and figures)",
        "5. GEOPOLITICS (2-3 stories, each 4-6 sentences focused on power dynamics and specific consequences)",
        "6. WHAT TO WATCH (3 items, each naming a specific observable indicator with a specific trigger level or event)",
        "7. BY THE NUMBERS (6-10 exact data points with real figures, no rounding)",
        "8. SIGNALS FROM THE EDGE (3-5 underreported, misreported, or obscured stories, 4-6 sentences each. For each: name what is being hidden, who benefits from the underreporting, and the actual plain significance. Use investigative depth, not summary.)",
        "9. Footer: *Subscribe at prismal.beehiiv.com | Not financial advice*",
        "",
        "Every story must have: specific figures, named actors, exact consequences.",
        "Minimum word count: 1,000 words of editorial content.",
        "Never use emdashes (--) or double dashes as sentence interrupts.",
      ].join("\n")
    : [
        "Write the WEEKLY ROUNDUP. Include ALL of the following sections in order:",
        "",
        "1. # PRISMAL WEEKLY header (week date range, Issue 1)",
        "2. THE WEEK'S BIG STORY (6-8 sentences, full context and consequences)",
        "3. TECH (3-4 stories, 4-6 sentences each with specific figures from the week)",
        "4. FINANCE (3-4 stories, each with weekly open/close levels, range for the week, biggest single-day move)",
        "5. GEOPOLITICS (3-4 stories, 4-6 sentences each focused on power dynamics and specific consequences)",
        "6. BY THE NUMBERS (8-12 exact weekly data points: open, close, high, low for the week where relevant)",
        "7. WHAT TO WATCH NEXT WEEK (3-4 specific observable indicators with named triggers or events)",
        "8. SIGNALS FROM THE EDGE (1-3 underreported stories from the week, 3-4 sentences each, explain what was missed)",
        "9. Footer: *Subscribe at prismal.beehiiv.com | Not financial advice*",
        "",
        "Every story must have: specific figures, named actors, exact consequences.",
        "Minimum word count: 1200 words of editorial content.",
        "Never use emdashes (--) or double dashes as sentence interrupts.",
      ].join("\n");

  const modeLabel = req.mode === "daily" ? "DAILY NEWSLETTER" : "WEEKLY ROUNDUP";
  return [
    `# PRISMAL WRITER TASK -- ${modeLabel}`,
    "",
    "## Today's Date Label",
    req.dateLabel,
    topBlock,
    weekNote,
    "",
    "## Source Material -- all available facts (PARAPHRASE ONLY -- NEVER COPY WORD FOR WORD)",
    articleList,
    "",
    sectionRules,
    "",
    "Return ONLY the final newsletter content in Markdown. Start with # PRISMAL.",
  ].join("\n");
}

export async function writeNewsletterFallback(req: WriteRequest): Promise<WriteResult> {
  const systemPrompt = loadWriterPrompt();
  const taskPrompt = buildTaskPrompt(req);
  const fullPrompt = systemPrompt + "\n\n" + taskPrompt;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180000);

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "glm-5:cloud",
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.75,
          num_predict: 16000,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: "Ollama error: " + errText };
    }

    const data = await response.json() as { response?: string };
    const content = data.response?.trim() || "";

    if (!content) {
      return { success: false, error: "Empty response from Ollama" };
    }

    return { success: true, content };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
