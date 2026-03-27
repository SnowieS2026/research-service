# Prismal Newsletter Pipeline

Automated newsletter compilation for **Tech × Finance × Geopolitics** news. Powered by SearxNG + Ollama.

## Setup

```bash
cd prismal-pipeline
npm install
```

No API keys required — everything runs through SearxNG (search) and Ollama (AI analysis).

### Prerequisites

- **Node.js** >= 20.0.0
- **Ollama** running locally at `http://localhost:11434`
- **SearxNG** at `http://localhost:8080` (or public fallback instances)

### Ollama Model

The pipeline uses `minimax-m2.7:cloud` for content analysis. Make sure it's available:

```bash
ollama list
# If minimax-m2.7:cloud isn't shown, it will be fetched from Ollama Connect on first run
```

## Usage

```bash
# Standard tier (default) — 9 stories, 5 queries per category
node dist/index.js

# Kickstart — quick 6-story digest
node dist/index.js --tier kickstart

# Deep dive — comprehensive 15-story report
node dist/index.js --tier deep

# Custom output path
node dist/index.js --tier standard --output reports/my-report.md

# Development mode (tsx, no build step)
npm run dev
```

### Tier Reference

| Tier | Stories | Queries/Beat | Use Case |
|------|---------|-------------|----------|
| `kickstart` | 6 | 3 | Quick daily digest |
| `standard` | 9 | 5 | Weekly newsletter |
| `deep` | 15 | 8 | Comprehensive analysis |

## Output

Reports are written to `reports/YYYY-MM-DD.md` (or custom path). Format follows the Prismal newsletter template:

- Frontmatter with metadata
- Masthead and issue header
- TLDR executive summary
- Categorized stories (Tech / Finance / Geopolitics)
- Deep Dive centrepiece analysis
- By the Numbers stats table
- Signals from the Edge (shorter items)

## Architecture

```
prismal-pipeline/
  src/
    index.ts        — CLI entry, orchestrates pipeline
    search.ts       — SearxNG multi-instance searcher
    scraper.ts      — Article content extraction
    analyser.ts     — Ollama-powered content analysis
    compiler.ts     — Report assembly and formatting
    branding.ts     — Prismal constants and templates
  reports/          — Compiled newsletter output
  logs/             — Search and debug logs
```

## SearxNG Configuration

The searcher tries instances in this order:
1. `http://localhost:8080` (if running locally)
2. `https://searx.party`
3. `https://searx.mw.io`
4. `https://searx.work`
5. `https://searxng.site`

Rate-limited to 1 request/second. All queries are logged to `logs/search.log`.

## Ollama Fallback

If Ollama is unavailable at `localhost:11434`, the analyser falls back to extraction mode — pulling available metadata and descriptions without AI analysis.

## Building

```bash
npm run build   # Compiles src/ → dist/
```
