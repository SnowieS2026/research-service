#!/usr/bin/env python3
"""
Fast web search using local SearxNG instance.
Returns structured results with title, URL, and snippet.
"""

import argparse
import json
import os
import urllib.request
import urllib.parse
from typing import List, Dict, Any


def search_searxng(query: str, count: int = 10, language: str = "en") -> Dict[str, Any]:
    """
    Search the web using local SearxNG instance.
    
    Args:
        query: Search query string
        count: Number of results
        language: Language code (e.g., 'en', 'de')
    
    Returns:
        Dict with 'results' list containing title, url, snippet
    """
    # Get SearxNG URL from environment or use default
    searxng_url = os.environ.get("SEARXNG_URL", "http://localhost:8080")
    
    params = {
        "q": query,
        "format": "json",
        "language": language,
        "safesearch": "0",
        "theme": "simple"
    }
    
    query_string = urllib.parse.urlencode(params)
    full_url = f"{searxng_url}/search?{query_string}"
    
    try:
        req = urllib.request.Request(full_url, method="GET")
        with urllib.request.urlopen(req, timeout=15) as response:
            data = json.loads(response.read().decode('utf-8'))
            
            results = []
            for item in data.get("results", [])[:count]:
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "snippet": item.get("content", ""),
                    "engine": item.get("engine", "")
                })
            
            return {
                "query": query,
                "total_results": len(results),
                "results": results
            }
            
    except urllib.error.HTTPError as e:
        return {"error": f"HTTP Error {e.code}: {e.reason}"}
    except urllib.error.URLError as e:
        return {"error": f"Cannot connect to SearxNG at {searxng_url}. Is it running?"}
    except Exception as e:
        return {"error": str(e)}


def main():
    parser = argparse.ArgumentParser(description="Fast web search via local SearxNG")
    parser.add_argument("query", help="Search query")
    parser.add_argument("-n", "--count", type=int, default=10, help="Number of results")
    parser.add_argument("-l", "--language", default="en", help="Language code (e.g., en, de, fr)")
    parser.add_argument("--json", action="store_true", help="Output raw JSON")
    
    args = parser.parse_args()
    
    result = search_searxng(
        query=args.query,
        count=args.count,
        language=args.language
    )
    
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        if "error" in result:
            print(f"Error: {result['error']}")
            return 1
        
        print(f"\n🔍 Results for: '{result['query']}' ({result['total_results']} found)\n")
        for i, item in enumerate(result["results"], 1):
            engine_str = f" [{item['engine']}]" if item.get("engine") else ""
            print(f"{i}. {item['title']}{engine_str}")
            print(f"   URL: {item['url']}")
            print(f"   {item['snippet'][:200]}{'...' if len(item['snippet']) > 200 else ''}")
            print()
    
    return 0


if __name__ == "__main__":
    exit(main())
