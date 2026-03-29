# SearxNG Research — Best Practices

## When to Use Which Tool

| Situation | Tool | Why |
|-----------|------|-----|
| Quick fact check, single answer | `search.py -n 5` | Fast, lightweight |
| Investigating a person/company | `research.py --depth standard` | Multi-round + fetch |
| Concurrent multi-topic research | `multi.py --json` | Parallel, aggregated |
| Reading a specific article | `fetch.py <url>` | Clean text extraction |
| Verifying a breaking claim | `search.py` then `fetch` top 2-3 | Cross-reference |
| Deep dive into a scandal | `research.py --depth deep` | 3 rounds, 12 queries, 6 fetches |

## Effective Query Crafting

### Good queries:
- `"Athif Sarwar fraud appeal 2011"` — specific, finds exact article
- `"Sadiq Khan campaign donors Electoral Commission"` — targeted
- `"Humza Yousaf Qatar funding Middle East Eye"` — includes known source
- `"Muslim Brotherhood UK mosque funding Saudi"` — multi-angle

### Bad queries:
- `"Sadiq Khan"` alone — too broad, returns Wikipedia overview
- `"Islamic extremism finance"` — too vague, off-topic results

## Engine Awareness

The `engine` field in JSON tells you the source:
- `wikipedia` — factual, good for biographies and dates
- `wikidata` — structured data, relationships, identifiers
- `startpage` — Google-quality via privacy proxy, best for news
- `duckduckgo` — broad coverage, good for general topics
- `qwant` — European, good for EU topics
- `wiby` — small-web, good for niche/alternative topics

For intelligence work: check which engine returned each result. Wikipedia is reliable for factual verification; Startpage for recent news and investigations.

## Deduplication Strategy

`research.py` deduplicates by domain automatically. When doing manual research:
1. Search for the topic
2. Collect unique domains from top 10 results
3. Fetch 2-3 most relevant domains
4. Do a second search with a different angle
5. Repeat

## Handling Sensitive Topics

For sensitive investigations (politicians, dark money, extremism):
1. Use `--json` to get raw data without UI rendering
2. Check which engine returned each result
3. Cross-reference across at least 2 different engines
4. Fetch primary sources (Electoral Commission, Parliament, Charity Commission)
5. Note which results are from partisan sites vs neutral sources

## Quick Research Workflows

### Investigate a person:
```
# 1. Quick background
search.py "John Smith politician" -n 5

# 2. Full research
research.py "John Smith politician scandal" --depth standard

# 3. If needed, specific follow-up
search.py "John Smith company directors" -n 8
fetch.py <relevant_url>
```

### Investigate funding flows:
```
# Trace the money
multi.py "Donor name funding" "Donor name company" "Donor name Malta offshore" -n 8
```

### Verify a breaking claim:
```
search.py "claim keywords" -n 10 --json
# Then fetch top 3 sources
fetch.py <url1>
fetch.py <url2>
```

## Performance Notes

- `search.py`: ~1-3 seconds per query depending on number of engines responding
- `multi.py`: All queries run in parallel, total time ≈ slowest single query
- `research.py basic`: ~15-30 seconds
- `research.py standard`: ~30-60 seconds
- `research.py deep`: ~60-120 seconds

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot connect to SearxNG` | Container not running | `docker start searxng` |
| `HTTP 429` | Engine rate-limit | Wait, try again |
| `HTTP 403` | Site blocked | Use `fetch.py` with different User-Agent |
| Empty results | Engine unresponsive | Check `unresponsive_engines` in JSON output |
| Encoding error (Windows) | Emoji in output | Set `$env:PYTHONIOENCODING="utf-8"` |
