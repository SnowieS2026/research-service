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

function formatArticle(a: ArticleForWriter, i: number): string {
  const content = ((a.content || a.title) as string).slice(0, 600);
  return [
    `[${i + 1}] ${a.beat.toUpperCase()} | ${a.relevance.toUpperCase()} | ${a.domain}`,
    `    Title: ${a.title}`,
    `    URL: ${a.url}`,
    `    Published: ${a.publishedDate || "Unknown"}`,
    `    Content: ${content}`,
    "",
  ].join("\n");
}

function formatTopStory(topStory?: ArticleForWriter): string {
  if (!topStory) return "";
  const content = ((topStory.content || "") as string).slice(0, 1200);
  return [
    "",
    "## TOP STORY FOR FEATURE",
    `Title: ${topStory.title}`,
    `URL: ${topStory.url}`,
    `Domain: ${topStory.domain}`,
    `Content: ${content}`,
  ].join("\n");
}

function buildTaskPrompt(req: WriteRequest): string {
  const articleList = req.articles.slice(0, 12).map((a, i) => formatArticle(a, i)).join("\n");
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
        "8. SIGNALS FROM THE EDGE (1-3 underreported or misreported stories, 3-4 sentences each, explain what the press missed or got wrong)",
        "9. Footer: *Subscribe at prismal.beehiiv.com | Not financial advice*",
        "",
        "Every story must have: specific figures, named actors, exact consequences.",
        "Minimum word count: 700 words of editorial content.",
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

  return [
    `# PRISMAL WRITER TASK -- ${req.mode === "daily" ? "DAILY NEWSLETTER" : "WEEKLY ROUNDUP"}`,
    "",
    "## Today's Date Label",
    req.dateLabel,
    topBlock,
    weekNote,
    "",
    "## Source Material -- all available facts",
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
        model: "minimax-m2.7:cloud",
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.75,
          num_predict: 4000,
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
