// AI-powered content analyser using Ollama

import type { ScrapedArticle } from "./scraper";

export interface Analysis {
  url: string;
  title: string;
  threePoints: string[];
  significance: string;
  crossDomainThemes: string[];
  relevance: "High" | "Medium" | "Low";
  keyQuote: string;
}

const OLLAMA_BASE = "http://localhost:11434";
const ANALYSER_MODEL = "minimax-m2.7:cloud";

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

interface OllamaGenerateResponse {
  response: string;
  done: boolean;
}

async function ollamaGenerate(prompt: string): Promise<string> {
  const body: OllamaGenerateRequest = {
    model: ANALYSER_MODEL,
    prompt,
    stream: false,
    options: {
      temperature: 0.3,
      num_predict: 500,
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = (await response.json()) as OllamaGenerateResponse;
    return data.response.trim();
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

export async function analyseArticle(
  article: ScrapedArticle
): Promise<Analysis> {
  const prompt = `You are a news analyst for a newsletter called Prismal. Analyse this article and provide a structured analysis.

Article Title: ${article.title}
Source: ${article.domain}
URL: ${article.url}
Content/Description: ${(article.content || article.description || "No content available").slice(0, 2000)}

Provide your analysis in exactly this format (JSON only, no markdown):
{
  "threePoints": ["Point 1", "Point 2", "Point 3"],
  "significance": "2-3 sentences about why this matters and what's novel vs noise",
  "crossDomainThemes": ["theme1", "theme2"],
  "relevance": "High",
  "keyQuote": "A compelling direct quote or finding from the article, max 100 chars"
}

Relevance guidelines:
- High = Breaking, major implications, multi-domain impact
- Medium = Notable but not critical, single-domain
- Low = Interesting but minor, routine news

Cross-domain themes to look for: tech/finance crossover (e.g. AI affecting markets), geopolitics/tech (e.g. sanctions on chips), finance/geopolitics (e.g. oil wars), or all three.
JSON only, no explanation outside the JSON block.`;

  try {
    const rawResponse = await ollamaGenerate(prompt);

    // The cloud model may prepend a <thinking> block — strip everything before the first {
    let jsonStr = rawResponse;
    const firstBrace = rawResponse.indexOf("{");
    if (firstBrace !== -1) {
      jsonStr = rawResponse.slice(firstBrace);
    }
    // Also strip anything after the last closing brace
    const lastBrace = jsonStr.lastIndexOf("}");
    if (lastBrace !== -1) {
      jsonStr = jsonStr.slice(0, lastBrace + 1);
    }

    const parsed = JSON.parse(jsonStr) as {
      threePoints?: string[];
      significance?: string;
      crossDomainThemes?: string[];
      relevance?: string;
      keyQuote?: string;
    };

    return {
      url: article.url,
      title: article.title,
      threePoints: Array.isArray(parsed.threePoints)
        ? parsed.threePoints.slice(0, 3)
        : ["No key points extracted"],
      significance: parsed.significance || "Unable to determine significance.",
      crossDomainThemes: Array.isArray(parsed.crossDomainThemes)
        ? parsed.crossDomainThemes
        : [],
      relevance: ["High", "Medium", "Low"].includes(parsed.relevance || "")
        ? (parsed.relevance as "High" | "Medium" | "Low")
        : "Medium",
      keyQuote:
        parsed.keyQuote ||
        `Source: ${article.domain} — ${(article.description || "").slice(0, 80)}...`,
    };
  } catch (err) {
    // Fallback if Ollama fails
    return {
      url: article.url,
      title: article.title,
      threePoints: [
        `Content from ${article.domain}`,
        article.description || "No description available",
        `Published: ${article.publishedDate || "Unknown date"}`,
      ],
      significance: `Article from ${article.domain}${article.description ? `: ${article.description.slice(0, 100)}...` : ""}`,
      crossDomainThemes: [],
      relevance: "Medium",
      keyQuote:
        article.description?.slice(0, 100) || `Read more at ${article.url}`,
    };
  }
}

export async function analyseArticles(
  articles: ScrapedArticle[]
): Promise<Analysis[]> {
  const analyses: Analysis[] = [];

  for (const article of articles) {
    if (article.success && (article.content || article.description)) {
      const analysis = await analyseArticle(article);
      analyses.push(analysis);
    }
    // Rate limit to avoid overwhelming Ollama
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  return analyses;
}
