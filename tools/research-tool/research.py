#!/usr/bin/env python3
"""
Bryan Research — Research Tool
Accepts a research brief and produces a structured markdown report.

Usage:
    python research.py --topic "..." --goal "..." --tier "standard" --output "path/to/report.md"
"""

import argparse
import json
import os
import sys
import time
import textwrap
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode

try:
    import requests
except ImportError:
    print("ERROR: 'requests' not found. Install with: pip install requests")
    sys.exit(1)

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("ERROR: 'beautifulsoup4' not found. Install with: pip install beautifulsoup4")
    sys.exit(1)

# ─── Configuration ────────────────────────────────────────────────────────────

SEARXNG_INSTANCES = [
    "http://localhost:8080",
    "http://searx.party",
    "http://searx.mw.io",
    "http://searx.work",
    "http://searxng.site",
]

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)

HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-GB,en;q=0.9",
}

TIMEOUT = 15

# Tier defaults
TIER_CONFIG = {
    "kickstart": {"max_results": 10, "max_source_chars": 3000, "query_count": 3},
    "standard":  {"max_results": 20, "max_source_chars": 6000, "query_count": 5},
    "deep":      {"max_results": 40, "max_source_chars": 12000, "query_count": 8},
}

# ─── SearxNG Search ────────────────────────────────────────────────────────────

def get_searxng_instance():
    """Return the first reachable SearxNG instance."""
    for instance in SEARXNG_INSTANCES:
        try:
            r = requests.get(instance, headers=HEADERS, timeout=5)
            if r.status_code in (200, 403):
                return instance
        except requests.RequestException:
            continue
    return None


def search_searxng(instance, query, categories="general", limit=10):
    """
    Search via SearxNG and return list of {'title', 'url', 'snippet', 'engine'}.
    """
    params = {
        "q": query,
        "categories": categories,
        "limit": limit,
        "format": "json",
        "engines": "google,bing,duckduckgo,ecosia",
    }
    url = f"{instance.rstrip('/')}/search?{urlencode(params)}"
    try:
        r = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        if r.status_code != 200:
            return []
        results = r.json().get("results", []) or r.json().get("web", [])
        return results[:limit]
    except (requests.RequestException, ValueError, KeyError):
        return []


def rotate_instance(current):
    """Return next available instance, skipping the current one."""
    idx = SEARXNG_INSTANCES.index(current) + 1
    for inst in SEARXNG_INSTANCES[idx:] + SEARXNG_INSTANCES[:idx]:
        try:
            requests.get(inst, headers=HEADERS, timeout=5)
            return inst
        except requests.RequestException:
            continue
    return current


# ─── Web Scraping ─────────────────────────────────────────────────────────────

def fetch_page_text(url, timeout=TIMEOUT):
    """
    Fetch a URL and extract clean text content.
    Falls back gracefully on errors.
    """
    try:
        r = requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
        r.raise_for_status()
        content_type = r.headers.get("Content-Type", "")
        if "html" not in content_type and "text" not in content_type:
            return None
        # Decode
        r.encoding = r.apparent_encoding or "utf-8"
        soup = BeautifulSoup(r.text, "lxml")
        # Remove noise
        for tag in soup.find_all(["script", "style", "nav", "footer", "header", "aside", "noscript"]):
            tag.decompose()
        text = soup.get_text(separator="\n", strip=True)
        # Collapse blank lines
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        return "\n".join(lines)
    except Exception:
        return None


def extract_relevant_snippets(text, query_terms, max_chars):
    """
    Pull out sentences/paragraphs from text that mention query terms.
    Returns truncated content focused on relevance.
    """
    if not text:
        return ""
    text_lower = text.lower()
    query_lower = query_terms.lower()

    # Find paragraphs containing any query term
    paragraphs = [p.strip() for p in text.split("\n") if p.strip()]
    scored = []
    for para in paragraphs:
        score = sum(1 for term in query_lower.split() if term in para.lower())
        if score > 0:
            scored.append((score, para))

    scored.sort(key=lambda x: x[0], reverse=True)

    result_parts = []
    chars = 0
    for _, para in scored:
        if chars + len(para) > max_chars:
            remaining = max_chars - chars
            if remaining > 100:
                result_parts.append(para[:remaining] + "…")
            break
        result_parts.append(para)
        chars += len(para)

    return "\n\n".join(result_parts)


# ─── Query Generation ──────────────────────────────────────────────────────────

def generate_queries(topic, goal, count):
    """
    Generate search queries from topic + goal.
    Returns a list of query strings.
    """
    base_queries = [topic]
    if goal:
        base_queries.append(f"{topic} {goal}")

    # Expand with common research modifiers
    modifiers = [
        "market size",
        "competitors",
        "trends",
        "statistics",
        "news",
        "analysis",
    ]
    extra_queries = [f"{topic} {mod}" for mod in modifiers[:count - 1]]
    queries = (base_queries + extra_queries)[:count]
    return queries


# ─── Report Generation ────────────────────────────────────────────────────────

def generate_report(topic, goal, tier, queries, all_results, source_content, output_path):
    """Generate and write the structured markdown report."""

    tier_labels = {"kickstart": "Kickstart", "standard": "Standard", "deep": "Deep Dive"}
    tier_label = tier_labels.get(tier, tier.capitalize())
    date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Build key findings from snippets
    key_findings = []
    seen_urls = set()
    for result in all_results:
        if result["url"] in seen_urls:
            continue
        seen_urls.add(result["url"])
        snippet = result.get("snippet", "").strip()
        if snippet:
            key_findings.append(f"- **{result['title']}** — {snippet}")

    # Build sources section
    sources = []
    for i, result in enumerate(sorted(seen_urls), 1):
        sources.append(f"{i}. [{result}]({result})")

    # Executive summary (synthesised from top snippets)
    top_snippets = [r["snippet"] for r in all_results[:5] if r.get("snippet")]
    exec_summary_lines = []
    if top_snippets:
        combined = " ".join(top_snippets[:3])
        exec_summary_lines.append(
            textwrap.fill(combined[:500], width=100) if len(combined) > 100 else combined
        )
    exec_summary_lines.append(
        f"This report covers {len(seen_urls)} distinct sources and {len(all_results)} total search results."
    )
    exec_summary = "\n".join(exec_summary_lines)

    # Detail section — group by source
    detail_sections = []
    for result in all_results:
        if not result.get("content"):
            continue
        detail_sections.append(
            f"### {result['title']}\n"
            f"<{result['url']}>\n\n"
            f"{result['content'][:2000]}"
        )

    # Assemble report
    report = f"""# {topic} — Research Report

**Tier:** {tier_label}
**Date:** {date}
**Goal:** {goal or "General research on: " + topic}

---

## Executive Summary

{exec_summary}

---

## Key Findings

{chr(10).join(key_findings[:10]) if key_findings else "*No structured findings extracted — see detail below.*"}

---

## Detail

{chr(10).join(detail_sections[:5]) if detail_sections else "*No detailed content extracted — see raw sources.*"}

---

## Sources

{chr(10).join(sources)}

---

*Report generated by Bryan Research — {date}*
"""

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(report)

    return output_path, len(seen_urls), len(all_results)


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Bryan Research — Automated Research Tool")
    parser.add_argument("--topic", required=True, help="Research topic/question")
    parser.add_argument("--goal",  default="", help="End goal or context (e.g. 'product launch evaluation')")
    parser.add_argument("--tier",  required=True, choices=["kickstart", "standard", "deep"],
                        help="Research tier (determines depth and source count)")
    parser.add_argument("--max-results", type=int, default=None,
                        help="Override max search results (default: tier-dependent)")
    parser.add_argument("--output", required=True, help="Output .md file path")
    args = parser.parse_args()

    tier_cfg = TIER_CONFIG[args.tier]
    max_results = args.max_results or tier_cfg["max_results"]
    max_source_chars = tier_cfg["max_source_chars"]

    print(f"\n{'='*60}")
    print(f" Bryan Research — {args.tier.upper()} RESEARCH")
    print(f"{'='*60}")
    print(f" Topic: {args.topic}")
    print(f" Goal:  {args.goal or '(not specified)'}")
    print(f" Output: {args.output}")
    print()

    # Find available SearxNG
    searxng = get_searxng_instance()
    if not searxng:
        print("ERROR: No SearxNG instance reachable.")
        print("Start one with: docker run -d --name searxng -p 8080:8080 searxng/searxng:latest")
        print("Or check SEARXNG_INSTANCES in this script.")
        sys.exit(1)
    print(f" Using SearxNG: {searxng}")

    # Generate queries
    queries = generate_queries(args.topic, args.goal, tier_cfg["query_count"])
    print(f"\n Queries ({len(queries)}): {queries}")

    # Run searches
    all_results = []
    seen_urls = set()
    for q in queries:
        print(f"\n Searching: {q[:80]}...")
        results = search_searxng(searxng, q, limit=max_results // len(queries))
        print(f"  -> {len(results)} results")
        for r in results:
            url = r.get("url", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                all_results.append({
                    "title": r.get("title", "Untitled"),
                    "url": url,
                    "snippet": r.get("content", "") or r.get("snippet", ""),
                    "engine": r.get("engine", ""),
                    "content": "",
                })
        time.sleep(0.5)  # Rate limit kindness

    print(f"\n Total unique URLs: {len(seen_urls)}")

    # Scrape top sources
    print(f"\n Fetching content from top {min(5, len(all_results))} sources...")
    for i, result in enumerate(all_results[:5]):
        print(f"  [{i+1}] {result['url'][:80]}...")
        text = fetch_page_text(result["url"])
        if text:
            result["content"] = extract_relevant_snippets(text, args.topic, max_source_chars // 5)
        time.sleep(0.3)

    # Generate report
    print(f"\n Writing report to: {args.output}")
    output_path, source_count, result_count = generate_report(
        topic=args.topic,
        goal=args.goal,
        tier=args.tier,
        queries=queries,
        all_results=all_results,
        source_content="",  # already embedded in all_results
        output_path=args.output,
    )

    print(f"\n{'='*60}")
    print(f" DONE — {source_count} sources, {result_count} results")
    print(f" Report: {output_path}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
