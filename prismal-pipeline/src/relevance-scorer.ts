// Relevance Scorer -- ranks articles by recency x quality x relevance

import type { ScrapedArticle } from "./scraper.js";
import { checkDomain, checkDate, type QualityResult } from "./quality-filter.js";

export interface ScoredArticle extends ScrapedArticle {
  score: number;
  tier: Exclude<QualityResult["tier"], undefined | "blocked">;
  isRecent: boolean;
  age: "today" | "yesterday" | "this_week" | "older";
  beat: string;
  relevance: string;
}

/** Score components (higher = better) */
const SCORE = {
  TIER1:       40,
  TIER2:       20,
  TIER3:       5,
  TODAY:       40,
  YESTERDAY:   20,
  THIS_WEEK:   10,
  HIGH:        30,
  MEDIUM:      15,
  LOW:         5,
  HAS_CONTENT: 15,   // Has full article body (not just meta description)
  CONTENT_LONG: 10,  // Content > 500 chars
  RELEVANCE_HIGH: 20, // Explicitly high relevance label
};

export function scoreArticle(article: ScrapedArticle): ScoredArticle {
  const domainCheck = checkDomain(article.url);
  const dateCheck = checkDate(article.publishedDate, 1); // max 1 day for daily

  const tier = typeof domainCheck.tier === "number" ? domainCheck.tier
    : domainCheck.tier === "blocked" ? 3
    : 3;

  let score = 0;
  score += tier === 1 ? SCORE.TIER1 : tier === 2 ? SCORE.TIER2 : SCORE.TIER3;
  score += dateCheck.age === "today" ? SCORE.TODAY
    : dateCheck.age === "yesterday" ? SCORE.YESTERDAY
    : dateCheck.age === "this_week" ? SCORE.THIS_WEEK
    : -100; // penalise old articles

  // Boost for content quality
  if (article.content && article.content.length > 100) score += SCORE.HAS_CONTENT;
  if (article.content && article.content.length > 500) score += SCORE.CONTENT_LONG;

  // Penalise articles with no useful content
  if (!article.content || article.content.length < 50) score -= 20;

  // Penalise articles with only a description (thin content)
  if (article.content && article.description &&
      article.content.trim() === article.description.trim()) {
    score -= 10;
  }

  const beat = guessBeat(article);
  const relevance: string = score > 50 ? "high" : score > 30 ? "medium" : "low";
  return {
    ...article,
    score,
    tier: tier as 1 | 2 | 3,
    isRecent: dateCheck.isRecent,
    age: dateCheck.age,
    beat,
    relevance,
  };
}

export function rankArticles(articles: ScrapedArticle[]): ScoredArticle[] {
  return articles
    .map(scoreArticle)
    .filter(a => a.score > 0 && a.tier <= 3)
    .sort((a, b) => b.score - a.score);
}

/** Pick top N articles per beat for a daily report */
export function pickTopPerBeat(
  articles: ScrapedArticle[],
  perBeat = 4
): Record<string, ScoredArticle[]> {
  const ranked = rankArticles(articles);
  const byBeat: Record<string, ScoredArticle[]> = { tech: [], finance: [], geopolitics: [] };

  for (const article of ranked) {
    const beat = guessBeat(article);
    if (byBeat[beat].length < perBeat) {
      byBeat[beat].push(article);
    }
  }
  return byBeat;
}

/** Pick top articles globally (for when per-beat doesn't give enough) */
export function pickTopGlobal(articles: ScrapedArticle[], count = 9): ScoredArticle[] {
  return rankArticles(articles).slice(0, count);
}

/** Guess the beat from article content if not already known */
function guessBeat(article: ScrapedArticle): string {
  const text = `${article.title} ${article.content || ""} ${article.description || ""}`.toLowerCase();

  const financeKeywords = ["stock", "market", "fed", "inflation", "recession", "bitcoin",
    "bank", "shares", "trading", "dollar", "treasury", "rate", "nasdaq", "s&p", "crypto",
    "econom", "revenue", "profit", "loss", "earnings", "investment", "hedge", "fund"];
  const geopolKeywords = ["war", "conflict", "ukraine", "russia", "nato", "iran", "china",
    "trade war", "sanctions", "diplomatic", "g7", "g20", "summit", "treaty", "military",
    "sovereign", "border", "ceasefire", "president", "government", "election"];

  let financeCount = 0, geopolCount = 0;
  for (const kw of financeKeywords) if (text.includes(kw)) financeCount++;
  for (const kw of geopolKeywords) if (text.includes(kw)) geopolCount++;

  if (financeCount > geopolCount && financeCount >= 2) return "finance";
  if (geopolCount > financeCount && geopolCount >= 2) return "geopolitics";
  return "tech"; // default
}
