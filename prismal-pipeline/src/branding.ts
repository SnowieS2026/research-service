// Prismal branding constants and section templates

export const PRISMAL = {
  name: "Prismal",
  tagline: "Refracting signal from noise",
  emoji: "⬡",
  accentColor: "#6C5CE7",
  baseUrl: "https://prismal.beehiiv.com",
  social: {
    twitter: "@PrismalHQ",
  },
  beats: ["Technology", "Finance", "Geopolitics"] as const,
  masthead: `
╔══════════════════════════════════════════════════════╗
║  ⬡ PRISMAL   --   Refracting signal from noise         ║
╚══════════════════════════════════════════════════════╝`,
};

// Tier configuration
export const TIER_CONFIG = {
  kickstart: { results: 10, queries: 3, stories: 6 },
  standard: { results: 20, queries: 5, stories: 9 },
  deep: { results: 40, queries: 8, stories: 15 },
} as const;

export type Tier = keyof typeof TIER_CONFIG;

// Search queries per category
export const SEARCH_QUERIES = {
  tech: [
    "latest technology news 2026",
    "AI artificial intelligence breakthroughs 2026",
    "cybersecurity data breach news 2026",
    "quantum computing news 2026",
    "space technology news 2026",
    "robotics AI automation 2026",
    "big tech antitrust regulation 2026",
    "semiconductor chip shortage news 2026",
  ],
  finance: [
    "stock market news today 2026",
    "cryptocurrency bitcoin news 2026",
    "global economy recession inflation 2026",
    "federal reserve interest rates 2026",
    "oil commodity prices 2026",
    "banking financial crisis 2026",
    "IPO venture capital funding 2026",
    "trade tariff economic news 2026",
  ],
  geopolitics: [
    "geopolitics war conflict news 2026",
    "EU politics news 2026",
    "US China relations trade 2026",
    "Russia Ukraine war news 2026",
    "Middle East conflict news 2026",
    "NATO alliance news 2026",
    "climate policy summit 2026",
    "UN security council news 2026",
  ],
} as const;

export const CATEGORY_EMOJI: Record<string, string> = {
  tech: "💻 technology",
  finance: "💸 finance",
  geopolitics: "🏛️ geopolitics",
};

// Section headers
export const SECTION_HEADERS = {
  tldr: "## TLDR",
  tech: "## 💻 technology",
  finance: "## 💸 finance",
  geopolitics: "## 🏛️ geopolitics",
  deepDive: "## 🔍 Deep Dive -- ",
  byTheNumbers: "## 📊 By the Numbers",
  signals: "## ⚡ Signals from the Edge",
  footer:
    "*Compiled by Snowie 🤖  --  Data sourced via SearxNG  --  Not financial advice  --  Subscribe at prismal.beehiiv.com*",
};
