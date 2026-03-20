# Web Browser Best Practices

## When to Use Each Tool

### search.py
- **Quick fact-finding**: "What year did X happen?"
- **Current events**: "Latest news on topic Y"
- **Research**: "Best practices for Z"
- **Discovery**: Finding relevant URLs for deeper fetching

### fetch.py
- **Deep reading**: Extracting full article content
- **Documentation**: Reading API docs or technical pages
- **Analysis**: Processing page content for summaries

## Search Tips

**Optimize result count:**
- Use `-n 5` for quick answers
- Use `-n 20` for comprehensive research

**Language targeting:**
- `-l de` for German results
- `-l fr` for French results

**SearxNG Configuration:**
- Set `SEARXNG_URL` env var if not using default `http://localhost:8080`
- SearxNG aggregates multiple search engines for comprehensive results

## Fetch Tips

**Content extraction:**
- Default 10,000 char limit prevents token overload
- Increase with `-m 50000` for long-form content
- Use `--raw` for piping to other tools

**Handling failures:**
- Some sites block automated requests (403/429 errors)
- Try fetching via textise dot iitty if direct fetch fails
- JavaScript-heavy sites may return incomplete content

## Workflow Patterns

**Research pipeline:**
```
1. Search for topic → get URLs
2. Fetch most promising results
3. Synthesize findings
```

**Fact verification:**
```
1. Search for claim
2. Fetch primary sources
3. Cross-reference multiple sources
```

**Documentation lookup:**
```
1. Search: "library X function Y documentation"
2. Fetch official docs URL
3. Extract relevant sections
```
