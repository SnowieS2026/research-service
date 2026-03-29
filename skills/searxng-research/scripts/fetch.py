#!/usr/bin/env python3
"""
Enhanced web fetcher — extracts readable text from any URL.
Usage:
  python fetch.py <url> [-m MAX_CHARS] [--raw] [--meta]
"""
import argparse
import re
import sys
import urllib.request
import urllib.parse
import urllib.error
from html.parser import HTMLParser

DEFAULT_MAX = 15000


class TextExtractor(HTMLParser):
    """Strip HTML, preserve structure."""

    def __init__(self):
        super().__init__()
        self.result = []
        self.skip_depth = 0
        self.skip_tags = {"script", "style", "nav", "footer", "header",
                         "aside", "noscript", "iframe", "form"}
        self.block_tags = {"p", "div", "h1", "h2", "h3", "h4", "h5", "h6",
                           "li", "blockquote", "table", "tr", "td", "th",
                           "article", "section"}
        self._in_skip = False

    def handle_starttag(self, tag, attrs):
        if tag in self.skip_tags:
            self.skip_depth += 1
        elif tag in self.block_tags:
            self.result.append("\n")

    def handle_endtag(self, tag):
        if tag in self.skip_tags:
            self.skip_depth = max(0, self.skip_depth - 1)
        elif tag in self.block_tags:
            self.result.append("\n")

    def handle_data(self, data):
        if self.skip_depth == 0:
            self.result.append(data)

    def get_text(self) -> str:
        text = "".join(self.result)
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = re.sub(r"[ \t]+", " ", text)
        return text.strip()


def fetch(url: str, max_chars: int = DEFAULT_MAX,
          user_agent: str = "Mozilla/5.0 (compatible; research-bot/1.0)") -> dict:
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": user_agent,
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "identity",
        })
        with urllib.request.urlopen(req, timeout=20) as resp:
            raw = resp.read()
            content_type = resp.headers.get("Content-Type", "")

            # Detect encoding
            if "charset=" in content_type:
                enc = content_type.split("charset=")[-1].split(";")[0].strip()
            else:
                enc = "utf-8"
            html = raw.decode(enc, errors="replace")

            # Title
            m = re.search(r"<title[^>]*>([^<]+)</title>", html, re.I)
            title = m.group(1).strip() if m else "No title"

            # Meta description
            m_desc = re.search(
                r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']',
                html, re.I)
            description = m_desc.group(1) if m_desc else ""

            # Main text
            extractor = TextExtractor()
            extractor.feed(html)
            text = extractor.get_text()

            # Site name from meta og
            m_site = re.search(
                r'<meta[^>]+property=["\']og:site_name["\'][^>]+content=["\']([^"\']+)["\']',
                html, re.I)
            site = m_site.group(1) if m_site else url.split("/")[2]

            truncated = len(text) > max_chars
            if truncated:
                text = text[:max_chars] + "\n\n[Content truncated...]"

            return {
                "url": url,
                "title": title,
                "site": site,
                "description": description,
                "content": text,
                "length": len(text),
                "truncated": truncated,
            }

    except urllib.error.HTTPError as e:
        return {"url": url, "error": f"HTTP {e.code}: {e.reason}"}
    except urllib.error.URLError as e:
        return {"url": url, "error": f"Connection error: {e.reason}"}
    except Exception as e:
        return {"url": url, "error": str(e)}


def main():
    parser = argparse.ArgumentParser(
        description="Fetch a URL and extract readable text content"
    )
    parser.add_argument("url", help="URL to fetch")
    parser.add_argument("-m", "--max-chars", type=int, default=DEFAULT_MAX,
                        help=f"Max characters (default: {DEFAULT_MAX})")
    parser.add_argument("--raw", action="store_true",
                        help="Plain text only, no headers")
    parser.add_argument("--meta", action="store_true",
                        help="Include meta description in output")

    args = parser.parse_args()
    result = fetch(args.url, max_chars=args.max_chars)

    if "error" in result:
        print(f"Error: {result['error']}", file=sys.stderr)
        return 1

    if not args.raw:
        print(f"📄 {result['title']}")
        print(f"🔗 {result['url']}")
        if args.meta and result.get("description"):
            print(f"📝 {result['description'][:200]}")
        print(f"📊 {result['length']} chars{' (truncated)' if result.get('truncated') else ''}")
        print("─" * 70)
        print(result["content"])
    else:
        print(result["content"])

    return 0


if __name__ == "__main__":
    sys.exit(main())
