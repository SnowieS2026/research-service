# SearxNG Research — SKILL.md

> Use this skill whenever you need to research anything factual — people, organisations,
> events, companies, history, current events, or verify claims.

**SearxNG** is your primary research tool. It is a privacy-respecting meta-search engine
running locally via Docker at `http://localhost:8080`. It queries 60+ engines simultaneously
(DuckDuckGo, Google, Wikipedia, Bing, Startpage, and many others) and aggregates results
without tracking or bias.

---

## Core Commands

### 1. search.py — Web Search
```bash
python skills/searxng-research/scripts/search.py "your query" [-n COUNT] [--json]
```

### 2. fetch.py — Read a Page
```bash
python skills/searxng-research/scripts/fetch.py <url> [-m MAX_CHARS] [--raw]
```

### 3. research.py — Deep Research (multi-source)
```bash
python skills/searxng-research/scripts/research.py "topic" [--depth basic|standard|deep]
```

### 4. multi.py — Parallel Multi-Query
```bash
python skills/searxng-research/scripts/multi.py "query1" "query2" "query3" [--json]
```

---

## When to Use Each Tool

| Need | Tool |
|------|------|
| Quick fact check | `search.py -n 5` |
| In-depth research on a topic | `research.py --depth standard` |
| Investigating a person/company | `search.py` + `fetch.py` on top results |
| Breaking down a complex question | `research.py --depth deep` |
| Comparing multiple queries side-by-side | `multi.py --json` |
| Getting a specific engine result | `search.py` + inspect `engine` field in JSON |

---

## Usage Patterns

### Pattern 1: Quick Fact
```
search.py "Athif Sarwar fraud" -n 5
```
Inspect `engine` field to see which engine returned each result.

### Pattern 2: Deep Research (person investigation)
```
# Step 1: Background search
research.py "Athif Sarwar Scotland companies" --depth standard

# Step 2: Pull specific sources
fetch.py <url1>
fetch.py <url2>
```

### Pattern 3: Concurrent Multi-Query (for agents)
```
multi.py "Sadiq Khan Electoral Commission donors" "Humza Yousaf Qatar funding" "Anas Sarwar business" --json
```
Returns structured JSON with all results. Perfect for agents doing parallel research.

### Pattern 4: Verify a claim
```
search.py "claim to verify" -n 10
# Then fetch 2-3 top sources to confirm
fetch.py <top_url>
```

---

## Engine Diversity

SearxNG returns results from multiple engines. Check the `engine` field in JSON output:
- `wikipedia` — encyclopedic, good for biographical facts
- `wikidata` — structured data, relationships
- `startpage` — private Google proxy, high quality
- `duckduckgo` — broad coverage
- `google` — via Startpage fallback

**Tip:** When investigating sensitive topics (politicians, dark money, etc.), use the raw JSON
output and look at which engines returned results. Wikipedia/ wikidata results are good
for facts; Startpage/DuckDuckGo for recent news.

---

## Environment Variables

```bash
SEARXNG_URL=http://localhost:8080   # default
```

**Windows note:** Set `PYTHONIOENCODING=utf-8` before running scripts to avoid emoji encoding errors:
```powershell
$env:PYTHONIOENCODING="utf-8"; python scripts/search.py "query"
# Or globally for the session:
[System.Environment]::SetEnvironmentVariable("PYTHONIOENCODING", "utf-8")
```

---

## Limitations

- JavaScript-rendered pages (SPAs) may need browser tool instead
- Some engines rate-limit; SearxNG handles this gracefully
- `safesearch=0` by default (no safe search filtering)
- Max 10 results per engine in JSON mode; use `count` param to request more

---

## Best Practices for Intelligence Research

1. **Always use `--depth standard` or `--depth deep`** for person/company investigations
2. **Cross-reference** — don't trust a single source; fetch 2-3 top results
3. **Check engine source** — Wikipedia is good for facts, news engines for recent events
4. **Use `multi.py`** when you need to run multiple searches in one go (for agents)
5. **JSON output** for scripting and agent workflows
6. **Startpage engine** consistently returns high-quality results for UK/EU topics
