# Prismal — Newsletter Automation Plan
## Status: IN PROGRESS | Updated: 2026-03-27

---

## 🏗️ Architecture Overview

```
prismal-pipeline/
├── src/
│   ├── index.ts              — CLI entry point
│   ├── search.ts              — Multi-engine search (SearxNG → Wikipedia → DDG HTML)
│   ├── scraper.ts             — Python readability extraction (temp-file approach)
│   ├── article-store.ts        — SQLite article logger (stores every scraped article)
│   ├── article-db.sqlite       — SQLite DB: articles, tags, beats, dates, URLs
│   ├── quality-filter.ts        — Domain allowlist, date filter, advertorial block
│   ├── relevance-scorer.ts      — Scores articles by recency × relevance × domain authority
│   ├── writer.ts               — WriterAgent orchestration (subagent, session: prismal-writer)
│   ├── compiler-daily.ts        — Daily report template (Mon-Fri output)
│   └── compiler-weekly.ts       — Weekly roundup template (Sunday output)
├── beehiiv/
│   └── publish.ts              — BeeHiiv API publish module
├── agents/
│   └── writer-agent.ts          — Dedicated BeeHiiv writer subagent system prompt
├── reports/
│   └── daily/                  — Daily MD reports (Mon-Fri)
│   └── weekly/                 — Weekly roundup MD reports (Sundays)
└── logs/
    └── search.log              — Search query log
```

---

## 📡 Newsletter Schedule

| Day | Trigger | Output | Content |
|-----|---------|--------|---------|
| Monday | Cron 07:00 GMT | Daily | Mon news only |
| Tuesday | Cron 07:00 GMT | Daily | Tue news only |
| Wednesday | Cron 07:00 GMT | Daily | Wed news only |
| Thursday | Cron 07:00 GMT | Daily | Thu news only |
| Friday | Cron 07:00 GMT | Daily | Fri news only |
| Saturday | No run | — | Nothing |
| Sunday | Cron 09:00 GMT | Weekly Round-up | Fri + Sat + Sun scan, week-in-review format |

---

## 🔍 Article Store (SQLite)

**Purpose:** Every article scraped gets logged. Used by Sunday's weekly roundup to reference stories from across the week.

**Schema:**
```sql
CREATE TABLE articles (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  url         TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  domain      TEXT NOT NULL,
  beat        TEXT NOT NULL,       -- 'tech' | 'finance' | 'geopolitics'
  relevance   TEXT NOT NULL,        -- 'high' | 'medium' | 'low'
  content     TEXT,
  description TEXT,
  published_date TEXT,             -- extracted from page, nullable
  scraped_at  TEXT NOT NULL,       -- ISO timestamp when we scraped it
  used_in     TEXT,                -- 'daily-YYYY-MM-DD' | 'weekly-YYYY-WXX' | NULL
  notes       TEXT
);

CREATE INDEX idx_articles_date ON articles(scraped_at);
CREATE INDEX idx_articles_beat ON articles(beat);
CREATE INDEX idx_articles_used ON articles(used_in);
```

---

## 🎯 Quality Filter

**Allowed domains (priority order):**
- Tier 1 (always use): reuters.com, apnews.com, bbc.com, ft.com, bloomberg.com, theguardian.com, cnbc.com, nytimes.com, washingtonpost.com, wsj.com, economist.com, politico.com, CNN.com
- Tier 2 (use if no Tier 1 available): arstechnica.com, techcrunch.com, wired.com, theverge.com, businessinsider.com,axios.com, zerb绒dget.com, economist.com
- Tier 3 (fallback only): wikipedia.org, wikinews.org

**Blocked:**
- Any URL containing "advertorial", "press-release", "sponsored"
- Domains: cryptonews.com (advertorial farm), fool.com (paywall), benzinga.com (low quality), foxnews.com (politically charged, use AP/Reuters instead)
- Paywalled sources we can't scrape

**Date filter:** Reject any article where `publishedDate` is > 24 hours old OR unknown (when available from meta tags). For weekly roundup: 7 days.

**Recency scoring:** Published today = +40 points, yesterday = +20, this week = +10, older = 0.

---

## ✍️ Writer Agent (prismal-writer)

**Session:** `session:prismal-writer` (persistent, reusable)

**System prompt:** Lives in `agents/writer-agent.md`

**Voice & Style Rules:**
- Write like a sharp, curious human editor — not an AI
- Sentences vary in length: punchy one-liners mixed with longer analytical ones
- Never use: "In today's rapidly evolving landscape", "It's worth noting that", "As we can see", "The intersection of X and Y"
- Always use: specific numbers, named people, exact consequences
- Hook in first sentence — every section needs to earn the reader's attention in the first 8 words
- Connect dots explicitly: how does this story affect the reader's money, safety, or worldview?
- Tone: curious, clear, slightly irreverent. Not dry academic. Not breathless tabloid.

**Structure for daily:**
```
[HOOK — 1 sentence, must make someone stop scrolling]
[3-paragraph brief on top story — who, what, when, so what]
[3 beat sections: Tech / Finance / Geopolitics — each 2-3 items, 2 sentences each]
[1 "What to watch" — 2-3 things coming up]
[Footer: Subscribe link, disclaimer]
```

**Structure for weekly:**
```
[Week in one sentence]
[Top 5 stories of the week — ranked, each 3 sentences]
[Beat breakdown: the week in Tech, Finance, Geopolitics — each 4 sentences]
[Data table: the week's numbers]
[One thing to watch next week]
[Footer]
```

**Marketing angle:** "For people who need to understand the world in 10 minutes a day." — Content speaks to: professionals making decisions, investors, curious minds, people who want to sound informed without reading everything.

---

## 📤 BeeHiiv Publish Module

**File:** `beehiiv/publish.ts`

```typescript
// Key functions:
async function createPost(title: string, content: string, format: 'html' | 'markdown'): Promise<string>
async function publishPost(postId: string): Promise<void>
async function getPublicationStats(): Promise<Stats>
```

**Flow:**
1. Writer agent outputs Markdown
2. `compiler-daily.ts` or `compiler-weekly.ts` wraps it in HTML email template
3. `publish.ts` calls `POST /posts` on BeeHiiv API
4. Post saved as draft OR auto-published based on flag

---

## 🔄 Cron Setup (after full build)

```typescript
// Daily (Mon-Fri 07:00 GMT)
{ name: 'prismal-daily', schedule: '0 7 * * 1-5', payload: { kind: 'agentTurn', message: 'Run Prismal daily pipeline. Mode: daily. Today is {{date}}.', sessionTarget: 'isolated', delivery: { mode: 'announce', channel: 'telegram' } } }

// Weekly (Sunday 09:00 GMT)
{ name: 'prismal-weekly', schedule: '0 9 * * 0', payload: { kind: 'agentTurn', message: 'Run Prismal weekly roundup. Mode: weekly. This week: {{dateRange}}.', sessionTarget: 'isolated', delivery: { mode: 'announce', channel: 'telegram' } } }
```

---

## ✅ Todo

- [x] Plan written (this file)
- [x] article-store.ts (SQLite logger)
- [x] quality-filter.ts (domain allowlist, date filter, advertorial block)
- [x] relevance-scorer.ts
- [x] writer-agent.md (system prompt for BeeHiiv writer)
- [x] writer.ts (Ollama direct call — subagent wiring pending)
- [x] compiler-daily.ts (Mon-Fri output template)
- [x] compiler-weekly.ts (Sunday output template)
- [x] beehiiv.ts (BeeHiiv API — READ WORKS, POST requires Enterprise)
- [ ] BeeHiiv post-to-editor HTML export tool (API post blocked on free trial — manual paste workaround)

---

## 🧠 Key Principles

1. **Quality over quantity** — 3 great stories > 10 mediocre ones
2. **Marketing hook in every opener** — assume reader has 4 seconds attention span
3. **Specificity wins** — "Fed cut rates by 0.25%" not "Fed made a decision"
4. **Cross-domain dots** — always note when tech/finance/geopolitics collide
5. **Human bylines** — not "compiled by Snowie" but the writer persona carries the voice
6. **Never publish advertorial** — if in doubt, leave it out
