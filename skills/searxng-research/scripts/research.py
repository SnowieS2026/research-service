#!/usr/bin/env python3
"""
Deep research — runs multiple search waves and fetches top sources,
then prints a structured intelligence report.
Usage:
  python research.py "topic" [--depth basic|standard|deep] [--query NUM]
  python research.py "Athif Sarwar" --depth standard
  python research.py "muslim brotherhood uk mosques" --depth deep
"""
import argparse
import concurrent.futures
import json
import os
import sys
import re
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from search import search
from fetch import fetch

DEPTH_CONFIG = {
    "basic":    {"search_rounds": 1, "fetch_top": 2, "query_count": 5},
    "standard": {"search_rounds": 2, "fetch_top": 4, "query_count": 8},
    "deep":    {"search_rounds": 3, "fetch_top": 6, "query_count": 12},
}

# Expanded query templates per round
QUERY_TEMPLATES = [
    # Round 1 — core topic
    [],
    # Round 2 — follow-up angles
    ["{q} controversy scandal", "{q} funding donors", "{q} investigation"],
    # Round 3 — deep dive
    ["{q} offshore shell company", "{q} intelligence security", "{q} linked to {q2}"],
]

MAX_WORKERS = 6


def normalize_query(q: str) -> str:
    """Strip trailing qualifiers to use as a base for round 2 queries."""
    return re.sub(r'\s+(scandal|controversy|funding|donors|investigation|offshore|intelligence)$', '', q, flags=re.I).strip()


def dedup_results(results: list) -> list:
    """Deduplicate results by domain."""
    seen = set()
    out = []
    for r in results:
        domain = re.sub(r'^https?://', '', r["url"]).split("/")[0]
        if domain not in seen:
            seen.add(domain)
            out.append(r)
    return out


def run_research(topic: str, depth: str = "standard", queries_override: list = None) -> dict:
    config = DEPTH_CONFIG.get(depth, DEPTH_CONFIG["standard"])
    rounds = config["search_rounds"]
    fetch_top = config["fetch_top"]

    all_results = []
    queries_used = []

    if queries_override:
        query_lists = queries_override[:rounds] if isinstance(queries_override[0], list) else [queries_override]
    else:
        base = normalize_query(topic)
        query_lists = []
        for i in range(rounds):
            templates = QUERY_TEMPLATES[i] if i < len(QUERY_TEMPLATES) else []
            qlist = [topic]
            for t in templates:
                q = t.replace("{q}", base)
                if base.lower() != topic.lower():
                    q = t.replace("{q2}", base)
                qlist.append(q)
            query_lists.append(qlist)

    for round_idx, qlist in enumerate(query_lists):
        print(f"  Round {round_idx+1}: {len(qlist)} queries...", file=sys.stderr)
        with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
            futures = {ex.submit(search, q, count=8): q for q in qlist}
            for future in concurrent.futures.as_completed(futures):
                try:
                    result = future.result()
                    if "error" not in result:
                        all_results.extend(result.get("results", []))
                        queries_used.append({"round": round_idx+1, "query": future.result()["query"]})
                except Exception:
                    pass
        time.sleep(0.3)  # brief pause between rounds

    # Dedupe by domain
    all_results = dedup_results(all_results)

    # Fetch top sources
    fetched = []
    fetch_count = min(fetch_top, len(all_results))
    print(f"  Fetching top {fetch_count} sources...", file=sys.stderr)
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:
        futures = {ex.submit(fetch, r["url"]): r for r in all_results[:fetch_count]}
        for future in concurrent.futures.as_completed(futures):
            try:
                fr = future.result()
                if "error" not in fr:
                    fetched.append(fr)
            except Exception:
                pass

    return {
        "topic": topic,
        "depth": depth,
        "total_unique_results": len(all_results),
        "queries_used": queries_used,
        "sources_fetched": len(fetched),
        "fetched_content": fetched,
        "all_results": all_results[:30],  # keep top 30 for reference
    }


def main():
    parser = argparse.ArgumentParser(
        description="Deep research: multi-round search + source fetch into structured report"
    )
    parser.add_argument("topic", help="Research topic or question")
    parser.add_argument("--depth", choices=["basic", "standard", "deep"],
                        default="standard",
                        help="Research depth (default: standard)")
    parser.add_argument("--queries", nargs="+",
                        help="Override queries for round 1 (space separated)")
    parser.add_argument("--json", action="store_true",
                        help="Output raw JSON")

    args = parser.parse_args()
    topic = args.topic

    if args.queries:
        # Custom queries provided
        overrides = [args.queries]
        result = run_research(topic, depth=args.depth, queries_override=overrides)
    else:
        result = run_research(topic, depth=args.depth)

    if args.json:
        print(json.dumps(result, indent=2, default=str))
        return 0

    # Human-readable research report
    print(f"\n{'='*70}")
    print(f"  RESEARCH REPORT: {result['topic']}")
    print(f"  Depth: {result['depth']} | Sources: {result['sources_fetched']} | "
          f"Queries: {len(result['queries_used'])}")
    print(f"{'='*70}\n")

    for src in result.get("fetched_content", []):
        print(f"\n{'─'*70}")
        print(f"📄 {src.get('title', 'No title')}")
        print(f"🔗 {src['url']}")
        print(f"{'─'*70}")
        content = src.get("content", "")
        if content:
            print(content[:3000])
            if len(content) > 3000:
                print(f"\n[... {len(content)-3000} more characters ...]")
        else:
            print("[No content extracted]")
        print()

    return 0


if __name__ == "__main__":
    sys.exit(main())
