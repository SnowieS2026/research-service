// Quality Filter -- domain allowlist, date filter, advertorial blocker

export type Beat = "tech" | "finance" | "geopolitics";

// Domain tier list -- Tier 1 is preferred, Tier 3 is fallback only
const TIER1_DOMAINS = new Set([
  // Major news wires
  "reuters.com", "apnews.com", "bbc.com", "afp.com", "upi.com",
  // Finance
  "bloomberg.com", "ft.com", "wsj.com", "cnbc.com", "marketwatch.com",
  // General news
  "nytimes.com", "washingtonpost.com", "theguardian.com", "economist.com",
  "politico.com", "axios.com", "cnn.com",
  // Tech
  "arstechnica.com", "techcrunch.com", "wired.com", "theverge.com",
  "businessinsider.com", "engadget.com", " zdnet.com", "techmonitor.ai",
  // Finance alt
  "barrons.com", "investopedia.com", "financialtimes.com",
]);

const TIER2_DOMAINS = new Set([
  "news.yahoo.com", "news.google.com",
  "foxnews.com",  // Use with caution -- politically charged
  "nypost.com", "dailymail.co.uk",
  "huffpost.com", "slate.com",
  "vice.com", "buzzfeednews.com",
  "theregister.com", "securityweek.com", "darkreading.com",
  "scmagazine.com", "bleepingcomputer.com",
  "protocol.com", "digiday.com",
  "fastcompany.com", "inc.com", "forbes.com",
  "fortune.com", "economist.com",
  "thenextweb.com", "techmeme.com", "semafour.com",
  "wikinews.org",  // Only if no other source available
]);

// Never use -- advertorial, low quality, or paywalled
const BLOCKED_PATTERNS = new Set([
  "cryptonews.com",      // advertorial farm
  "fool.com",             // paywall + low quality
  "benzinga.com",        // low quality clickbait
  "investorvillage.com",  // low quality
  "seekingalpha.com",    // paywall
  "thestreet.com",        // low quality
  "investopedia.com",     // too basic
  "marketwatch.com",     // paywalled
  //Advertorial indicators in URL
  "advertorial",
  "press-release",
  "sponsored-content",
  "native-ad",
]);

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

export interface QualityResult {
  allowed: boolean;
  reason?: string;
  tier?: 1 | 2 | 3 | "blocked";
  domain?: string;
}

export function checkDomain(url: string): QualityResult {
  const domain = getDomain(url);

  // Check blocked patterns
  if (BLOCKED_PATTERNS.has(domain)) {
    return { allowed: false, reason: `Domain blocked: ${domain}`, tier: "blocked", domain };
  }

  // Check advertorial URL patterns
  const lower = url.toLowerCase();
  for (const pattern of BLOCKED_PATTERNS) {
    if (lower.includes(pattern)) {
      return { allowed: false, reason: `URL contains blocked pattern: ${pattern}`, tier: "blocked", domain };
    }
  }

  if (TIER1_DOMAINS.has(domain)) {
    return { allowed: true, tier: 1, domain };
  }
  if (TIER2_DOMAINS.has(domain)) {
    return { allowed: true, tier: 2, domain };
  }
  if (domain && domain !== "") {
    return { allowed: true, tier: 3, domain };
  }
  return { allowed: false, reason: "Could not parse domain", tier: "blocked", domain: "" };
}

export interface DateCheckResult {
  isRecent: boolean;
  age: "today" | "yesterday" | "this_week" | "older";
  publishedDate?: string;
  daysOld?: number;
}

/** Check if an article is recent enough. Returns age category. */
export function checkDate(publishedDate: string | undefined, maxAgeDays = 1): DateCheckResult {
  if (!publishedDate) {
    // No date found -- be permissive but note it
    return { isRecent: true, age: "today" };
  }

  let pubDate: Date;
  try {
    // Handle various ISO formats
    pubDate = new Date(publishedDate);
    if (isNaN(pubDate.getTime())) {
      return { isRecent: true, age: "today" };
    }
  } catch {
    return { isRecent: true, age: "today" };
  }

  const now = new Date();
  const diffMs = now.getTime() - pubDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  const age: DateCheckResult["age"] =
    diffDays < 1 ? "today" :
    diffDays < 2 ? "yesterday" :
    diffDays <= 7 ? "this_week" :
    "older";

  return {
    isRecent: diffDays <= maxAgeDays,
    age,
    publishedDate: pubDate.toISOString(),
    daysOld: Math.round(diffDays),
  };
}

/** Assign a beat based on query category */
export function assignBeat(query: string): Beat {
  const lower = query.toLowerCase();
  if (lower.includes("tech") || lower.includes("ai") || lower.includes("cybersecurity") ||
      lower.includes("software") || lower.includes("digital") || lower.includes("cyber")) {
    return "tech";
  }
  if (lower.includes("finance") || lower.includes("stock") || lower.includes("crypto") ||
      lower.includes("econom") || lower.includes("bank") || lower.includes("market") ||
      lower.includes("inflation") || lower.includes("recession") || lower.includes("treasury")) {
    return "finance";
  }
  if (lower.includes("geopolitic") || lower.includes("war") || lower.includes("conflict") ||
      lower.includes("diplomatic") || lower.includes("nato") || lower.includes("china") ||
      lower.includes("eu ") || lower.includes("european") || lower.includes("iran") ||
      lower.includes("russia") || lower.includes("ukraine") || lower.includes("trade")) {
    return "geopolitics";
  }
  return "tech"; // default
}

/** Estimate date from content snippet if not in meta tags */
export function estimateDateFromSnippet(snippet: string): string | undefined {
  const lower = snippet.toLowerCase();
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);

  if (lower.includes("today") || lower.includes("just now") || lower.includes("breaking")) {
    return today.toISOString();
  }
  if (lower.includes("yesterday")) {
    return yesterday.toISOString();
  }
  return undefined;
}
