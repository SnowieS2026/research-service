#!/usr/bin/env python3
"""
Enhanced SearxNG search — structured results with engine info.
Usage:
  python search.py "query" [-n COUNT] [-l LANGUAGE] [--json] [--engines ENGINE1,ENGINE2]
"""
import argparse
import json
import os
import sys
import urllib.request
import urllib.parse

DEFAULT_URL = os.environ.get("SEARXNG_URL", "http://localhost:8080")


def search(query: str, count: int = 10, language: str = "en",
           engines: list = None, safesearch: int = 0) -> dict:
    searxng_url = os.environ.get("SEARXNG_URL", DEFAULT_URL)

    params = {
        "q": query,
        "format": "json",
        "language": language,
        "safesearch": str(safesearch),
        "count": count,
        "theme": "simple"
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
                    "parsed_url": item.get("parsed_url", {}),
                })

            return {
                "query": query,
                "total_returned": len(results),
                "results": results,
                "unresponsive_engines": data.get("unresponsive_engines", []),
            }
    except urllib.error.HTTPError as e:
        return {"error": f"HTTP {e.code}: {e.reason}"}
    except urllib.error.URLError as e:
        return {"error": f"Cannot connect to SearxNG at {searxng_url}"}
    except Exception as e:
        return {"error": str(e)}


def main():
    parser = argparse.ArgumentParser(
        description="Fast web search via local SearxNG — returns structured results"
    )
    parser.add_argument("query", help="Search query")
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

    args = parser.parse_args()
    engines = [e.strip() for e in args.engines.split(",") if e.strip()] or None

    result = search(args.query, count=args.count, language=args.language,
                    engines=engines, safesearch=args.safesearch)

    if args.json:
        print(json.dumps(result, indent=2))
        return 0

    if "error" in result:
        print(f"Error: {result['error']}", file=sys.stderr)
        return 1

    print(f"\n🔍 [{result['query']}] — {result['total_returned']} results\n")
    print(f"{'#':<4} {'Title':<65} {'Engine':<12}")
    print("-" * 85)
    for i, item in enumerate(result["results"], 1):
        title = item["title"][:62] + (".." if len(item["title"]) > 62 else "")
        print(f"{i:<4} {title:<65} {item['engine']:<12}")
        print(f"     URL: {item['url']}")
        snippet = item["snippet"]
        if snippet:
            print(f"     {snippet[:180]}{'...' if len(snippet) > 180 else ''}")
        print()

    if result.get("unresponsive_engines"):
        ue = result["unresponsive_engines"]
        if isinstance(ue, list):
            ue = ", ".join(str(x) for x in ue)
        print(f"[!] Unresponsive engines: {ue}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
