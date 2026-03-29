#!/usr/bin/env python3
"""
SearxNG search with engine rotation, automatic fallback, and usage tracking.
Usage:
  python search.py "query" [-n COUNT] [--engines ENGINE1,ENGINE2]
"""
import argparse
import json
import os
import sys
import time
import random
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime, timedelta

DEFAULT_URL = os.environ.get("SEARXNG_URL", "http://localhost:8080")

# ── Engine Pool ──────────────────────────────────────────────────────────────────
# Engines known to work well on SearxNG. Lower-quality ones commented out.
ENGINE_POOL = [
    "wikipedia", "wikidata",       # Factual / structured
    "startpage",                   # Google proxy, high quality
    "qwant",                       # European, good for UK/EU
    "wiby",                        # Small web, niche
    "mojeek",                      # Independent, no tracking
    "presearch",                   # Decentralised search
    # "brave",                    # Brave Search (sometimes slow)
    # "youcom",                   # You.com (often suspended)
]

# Track engine failures across calls (in-memory, resets on restart)
_engine_failures = {}  # {engine: datetime_of_failure}
_FAILURE_RESET_HOURS = 2  # Reset failure after 2 hours


def _is_engine_available(engine: str) -> bool:
    """Check if engine was recently marked as failed."""
    if engine not in _engine_failures:
        return True
    failed_at = _engine_failures[engine]
    if datetime.now() - failed_at > timedelta(hours=_FAILURE_RESET_HOURS):
        del _engine_failures[engine]
        return True
    return False


def _mark_engine_failed(engine: str):
    """Record a failure for an engine."""
    _engine_failures[engine] = datetime.now()


def _get_working_engines(preferred: list = None, max_engines: int = 6) -> list:
    """
    Return a shuffled list of up to max_engines working engines.
    preferred: list of explicitly requested engines (always try these first)
    """
    if preferred:
        # Use preferred but filter out known-bad ones
        working = [e for e in preferred if _is_engine_available(e)]
        if working:
            return working

    available = [e for e in ENGINE_POOL if _is_engine_available(e)]
    random.shuffle(available)
    return available[:max_engines]


def _call_searxng(query: str, engines: list, count: int = 10,
                  language: str = "en", safesearch: int = 0) -> dict:
    """Make a single SearxNG request and handle errors."""
    searxng_url = os.environ.get("SEARXNG_URL", DEFAULT_URL)
    params = {
        "q": query,
        "format": "json",
        "language": language,
        "safesearch": str(safesearch),
        "count": count,
        "theme": "simple",
    }
    if engines:
        params["engines"] = ",".join(engines)

    url = f"{searxng_url}/search?{urllib.parse.urlencode(params)}"
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=20) as response:
            data = json.loads(response.read().decode("utf-8"))
            results = []
            for item in data.get("results", [])[:count]:
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "snippet": item.get("content", ""),
                    "engine": item.get("engine", ""),
                    "engines": item.get("engines", []),
                })
            unresponsive = data.get("unresponsive_engines", [])
            return {
                "query": query,
                "total_returned": len(results),
                "results": results,
                "engines_used": engines,
                "unresponsive_engines": unresponsive,
            }
    except urllib.error.HTTPError as e:
        return {"error": f"HTTP {e.code}: {e.reason}"}
    except urllib.error.URLError:
        return {"error": f"Cannot connect to SearxNG at {searxng_url}"}
    except Exception as e:
        return {"error": str(e)}


def search(query: str, count: int = 10, language: str = "en",
           engines: list = None, safesearch: int = 0) -> dict:
    """
    Main search function. Handles engine failures automatically.
    Returns results from first engine group that responds.
    """
    # Determine which engines to try
    preferred = [e.strip() for e in engines] if engines else None
    working_engines = _get_working_engines(preferred=preferred, max_engines=6)

    # Try first group
    result = _call_searxng(query, working_engines, count, language, safesearch)

    if "error" in result:
        return result

    # Handle unresponsive engines: mark them as failed
    for ue in result.get("unresponsive_engines", []):
        if isinstance(ue, str):
            _mark_engine_failed(ue)

    # If zero results and we have more engines, retry
    if result["total_returned"] == 0 and len(ENGINE_POOL) > len(working_engines):
        remaining = [e for e in ENGINE_POOL if e not in working_engines and _is_engine_available(e)]
        if remaining:
            retry_result = _call_searxng(query, remaining[:5], count, language, safesearch)
            if "error" not in retry_result and retry_result["total_returned"] > 0:
                # Merge results
                seen_urls = {r["url"] for r in result["results"]}
                for r in retry_result["results"]:
                    if r["url"] not in seen_urls:
                        result["results"].append(r)
                        result["total_returned"] += 1
                result["engines_used"] = working_engines + remaining[:5]

    return result


def main():
    parser = argparse.ArgumentParser(
        description="Fast web search via local SearxNG with automatic engine fallback"
    )
    parser.add_argument("query", nargs="?", default=None, help="Search query")
    parser.add_argument("-n", "--count", type=int, default=10,
                        help="Number of results (default: 10)")
    parser.add_argument("-l", "--language", default="en",
                        help="Language code e.g. en, de, fr (default: en)")
    parser.add_argument("--engines", default="",
                        help="Comma-separated engine names e.g. wikipedia,wikidata")
    parser.add_argument("--json", action="store_true",
                        help="Output raw JSON")
    parser.add_argument("-s", "--safesearch", type=int, default=0,
                        help="SafeSearch level: 0=off, 1=moderate, 2=strict")
    parser.add_argument("--show-engines", action="store_true",
                        help="Show available engines and their status then exit")

    args = parser.parse_args()

    if args.show_engines:
        print(f"\nEngine pool ({len(ENGINE_POOL)} engines):")
        for e in ENGINE_POOL:
            status = "AVAILABLE" if _is_engine_available(e) else f"SUSPENDED (resets {_engine_failures.get(e, '?')})"
            print(f"  {e:<15} {status}")
        print(f"\nTotal available: {sum(1 for e in ENGINE_POOL if _is_engine_available(e))}/{len(ENGINE_POOL)}")
        return 0

    if not args.query and not args.show_engines:
        print("Error: query required (or use --show-engines)", file=sys.stderr)
        return 1

    engines = [e.strip() for e in args.engines.split(",") if e.strip()] or None

    result = search(args.query, count=args.count, language=args.language,
                    engines=engines, safesearch=args.safesearch)

    if args.json:
        print(json.dumps(result, indent=2))
        return 0

    if "error" in result:
        print(f"Error: {result['error']}", file=sys.stderr)
        return 1

    print(f"\n[{result['query']}] -- {result['total_returned']} results")
    if result.get("unresponsive_engines"):
        print(f"[!] Engines suspended: {', '.join(str(x) for x in result['unresponsive_engines'])}")
    print(f"    Using: {', '.join(result.get('engines_used', ['default']))}")
    print(f"\n{'#':<4} {'Title':<65} {'Engine':<12}")
    print("-" * 85)
    for i, item in enumerate(result["results"], 1):
        title = item["title"][:62] + (".." if len(item["title"]) > 62 else "")
        print(f"{i:<4} {title:<65} {item['engine']:<12}")
        print(f"     URL: {item['url']}")
        snippet = item["snippet"]
        if snippet:
            print(f"     {snippet[:180]}{'...' if len(snippet) > 180 else ''}")
        print()

    return 0


if __name__ == "__main__":
    sys.exit(main())
