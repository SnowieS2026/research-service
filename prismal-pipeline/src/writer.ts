// Writer orchestration — spawns the persistent writer subagent for BeeHiiv content

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

function buildTaskPrompt(req: WriteRequest): string {
  const articleList = req.articles
    .slice(0, 12)
    .map((a, i) => `[${i + 1}] ${a.beat.toUpperCase()} | ${a.relevance.toUpperCase()} | ${a.domain}
    Title: ${a.title}
    URL: ${a.url}
    Published: ${a.publishedDate || "Unknown"}
    Content: ${(a.content || a.title).slice(0, 600)}`)
    .join("\n\n");

  const topStoryBlock = req.topStory
    ? `\n## TOP STORY FOR FEATURE\nTitle: ${req.topStory.title}\nURL: ${req.topStory.url}\nDomain: ${req.topStory.domain}\nContent: ${(req.topStory.content || "").slice(0, 1200)}`
    : "";

  return `# PRISMAL WRITER TASK — ${req.mode === "daily" ? "DAILY NEWSLETTER" : "WEEKLY ROUNDUP"}

## Today's Date Label
${req.dateLabel}

${topStoryBlock}

## Source Material (${req.articles.length} articles — use the best 6-8)

${articleList}

${req.mode === "weekly" && req.weekNumbers
  ? `\n## Week at a Glance\nStories by beat: ${Object.entries(req.weekNumbers).map(([b, n]) => `${b}: ${n}`).join(", ")}`
  : ""}

Follow the Prismal voice and format guidelines in your system prompt.

${req.mode === "daily" ? `
Write the DAILY newsletter. Structure:
- Hook (1 sentence, 10 words max)
- Brief intro (2-3 sentences)
- The Big Story (3-4 sentences)
- 💻 Tech (2-3 items, 2 sentences each)
- 🏛️ Geopolitics (2-3 items, 2 sentences each)
- 💸 Finance (2-3 items, 2 sentences each)
- What to Watch (2-3 forward-looking items)
- Footer with subscribe link + disclaimer

Target: 400-550 words. Be selective. Most articles are noise — pick the 5-6 that actually matter.` : `
Write the WEEKLY ROUNDUP. Structure:
- Week in one sentence
- Top 5 Stories (ranked by impact, each 2 sentences)
- The Week in Tech (4-5 items)
- The Week in Finance (4-5 items)
- The Week in Geopolitics (4-5 items)
- By the Numbers (table with week's key data)
- One Thing to Watch Next Week
- Footer

Target: 600-800 words. Pick the week's real stories.`}

Return ONLY the final newsletter content in Markdown. Start directly with the first heading or hook.
`;
}

/** Run the writer via Ollama (fallback when subagent not available) */
export async function writeNewsletterFallback(req: WriteRequest): Promise<WriteResult> {
  const systemPrompt = loadWriterPrompt();
  const taskPrompt = buildTaskPrompt(req);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "minimax-m2.7:cloud",
        prompt: `${systemPrompt}\n\n${taskPrompt}`,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 1400,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: `Ollama error: ${errText}` };
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
