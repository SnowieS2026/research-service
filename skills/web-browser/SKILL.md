---
name: web-browser
description: Fast web search and content extraction for research, fact-finding, and browsing. Use when the user needs to (1) search the web for information, (2) fetch and read content from specific URLs, (3) research topics, (4) verify facts, or (5) browse websites. Provides instant results via local SearxNG instance and clean HTML-to-text extraction.
---

# Web Browser

Seamless web search and content extraction with minimal latency using local SearxNG.

## Quick Start

**Search the web:**
```bash
python scripts/search.py "your query here"
```

**Fetch a webpage:**
```bash
python scripts/fetch.py https://example.com/article
```

## Tools

### search.py - Fast Web Search

Search via local SearxNG instance for instant, private results.

```bash
# Basic search
python scripts/search.py "python best practices"

# Limit results
python scripts/search.py "machine learning" -n 5

# Language-specific
python scripts/search.py "documentation" -l de

# JSON output for scripting
python scripts/search.py "api documentation" --json
```

**Options:**
- `-n, --count`: Number of results (default: 10)
- `-l, --language`: Language code (en, de, fr, etc.)
- `--json`: Raw JSON output

**Environment:** Set `SEARXNG_URL` if not running on default `http://localhost:8080`

### fetch.py - Webpage Extraction

Fetch and convert HTML to clean text.

```bash
# Basic fetch
python scripts/fetch.py https://example.com

# Limit content length
python scripts/fetch.py https://long-article.com -m 5000

# Raw output (no headers)
python scripts/fetch.py https://example.com --raw
```

**Options:**
- `-m, --max-chars`: Maximum characters (default: 10000)
- `--raw`: Text only, no formatting

## Common Workflows

**Research a topic:**
```bash
# 1. Search for relevant pages
python scripts/search.py "topic" -n 10

# 2. Fetch promising results
python scripts/fetch.py <url-from-search>
```

**Quick fact check:**
```bash
python scripts/search.py "fact to verify" -n 3 -f month
```

**Read documentation:**
```bash
python scripts/fetch.py https://docs.example.com/api --max-chars 20000
```

## Best Practices

See [references/best-practices.md](references/best-practices.md) for:
- When to search vs fetch
- Optimizing queries
- Handling different content types
- Workflow patterns

## Limitations

- JavaScript-rendered content may not extract fully
- Some sites block automated requests (403/429)
- Fetch extracts main text; may miss dynamic content
- Requires local SearxNG instance running (default: http://localhost:8080)
