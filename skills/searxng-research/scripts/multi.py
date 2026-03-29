#!/usr/bin/env python3
"""
Run multiple SearxNG searches concurrently and aggregate results.
Usage:
  python multi.py "query1" "query2" "query3" ... [-n COUNT] [--json]
  echo "query1"$'\n'"query2"$'\n'"query3" | python multi.py --stdin [-n COUNT] [--json]
"""
import argparse
import concurrent.futures
import json
import sys
import os

# Add parent dir to path for import
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from search import search, _get_working_engines, _is_engine_available, _mark_engine_failed

DEFAULT_COUNT = 8
MAX_WORKERS = 10


def run_search(q: str, count: int) -> dict:
    # Rotate: pick different random engine subsets for each query to spread load
    engines = _get_working_engines(max_engines=5)
    return search(q, count=count, engines=engines)


def main():
    parser = argparse.ArgumentParser(
        description="Run multiple SearxNG searches in parallel"
    )
    parser.add_argument("queries", nargs="*", help="Search queries")
    parser.add_argument("-n", "--count", type=int, default=DEFAULT_COUNT,
                        help=f"Results per query (default: {DEFAULT_COUNT})")
    parser.add_argument("--json", action="store_true",
                        help="Output combined JSON")
    parser.add_argument("--stdin", action="store_true",
                        help="Read queries from stdin, one per line")

    args = parser.parse_args()

    # Collect queries
    queries = []
    if args.stdin:
        queries = [line.strip() for line in sys.stdin if line.strip()]
    else:
        queries = args.queries

    if not queries:
        print("Error: no queries provided", file=sys.stderr)
        return 1

    if args.json:
        # Parallel execution
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(len(queries), MAX_WORKERS)) as ex:
            futures = {ex.submit(run_search, q, args.count): q for q in queries}
            combined = {}
            for future in concurrent.futures.as_completed(futures):
                q = futures[future]
                try:
                    combined[q] = future.result()
                except Exception as e:
                    combined[q] = {"error": str(e)}
        print(json.dumps(combined, indent=2))
        return 0

    # Human-readable output
    print(f"\n{'='*70}")
    print(f"  MULTI-SEARCH — {len(queries)} queries × {args.count} results")
    print(f"{'='*70}\n")

    with concurrent.futures.ThreadPoolExecutor(max_workers=min(len(queries), MAX_WORKERS)) as ex:
        futures = {ex.submit(run_search, q, args.count): q for q in queries}
        for future in concurrent.futures.as_completed(futures):
            q = futures[future]
            try:
                result = future.result()
                if "error" in result:
                    print(f"❌ [{q}] — {result['error']}\n")
                    continue
                print(f"🔍 [{q}] — {result['total_returned']} results")
                for i, r in enumerate(result["results"][:args.count], 1):
                    print(f"   {i}. {r['title'][:70]}")
                    print(f"      [{r['engine']}] {r['url'][:70]}")
                print()
            except Exception as e:
                print(f"❌ [{q}] — Error: {e}\n")

    return 0


if __name__ == "__main__":
    sys.exit(main())
