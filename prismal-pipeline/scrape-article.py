#!/usr/bin/env python3
"""Prismal article scraper — URL passed via stdin, JSON result on stdout."""
import sys
import json
import urllib.request
import html
import re

def get_meta(text):
    desc = None
    pubdate = None
    for pat in [
        '<meta[^>]+property="og:description"[^>]+content="([^"]+)"',
        '<meta[^>]+name="description"[^>]+content="([^"]+)"',
    ]:
        m = re.search(pat, text, re.I)
        if m:
            desc = m.group(1)
            break
    pd = re.search(r'<meta[^>]+property="article:published_time"[^>]+content="([^"]+)"', text, re.I)
    if pd:
        pubdate = pd.group(1)
    return desc, pubdate

def extract_title(text):
    for pat in [
        '<meta[^>]+property="og:title"[^>]+content="([^"]+)"',
        '<title[^>]*>([^<]+)</title>',
    ]:
        m = re.search(pat, text, re.I)
        if m:
            return html.unescape(m.group(1).strip())
    return "Untitled"

def extract_body(text):
    for sel in [
        r"<article[^>]*>(.*?)</article>",
        r"<main[^>]*>(.*?)</main>",
    ]:
        m = re.search(sel, text, re.DOTALL | re.I)
        if m and len(m.group(1)) > 300:
            body = m.group(1)
            for tag in ["script", "style", "nav", "footer", "header", "aside", "noscript"]:
                body = re.sub(f"<{tag}[^>]*>.*?</{tag}>", "", body, flags=re.DOTALL | re.I)
            body = re.sub(r"<br\s*/?>", "\n", body, flags=re.I)
            body = re.sub(r"<p[^>]*>", "\n\n", body)
            body = re.sub(r"<div[^>]*>", "\n", body)
            body = re.sub(r"<[^>]+>", "", body)
            body = html.unescape(body)
            body = re.sub(r"[ \t]+", " ", body)
            body = re.sub(r"\n[ \t]*\n", "\n\n", body).strip()
            return body if len(body) > 200 else None
    return None

# Read URL from stdin (not argv — avoids Windows exec quoting issues)
url = sys.stdin.read().strip()

if not url:
    sys.stderr.write("SCRAPER_ERROR: No URL provided via stdin\n")
    sys.exit(1)

try:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        ct = resp.headers.get("Content-Type", "")
        enc = "utf-8"
        if "charset=" in ct:
            enc = ct.split("charset=")[-1].split(";")[0].strip()
        text = resp.read().decode(enc, errors="replace")

    desc, pubdate = get_meta(text)
    title = extract_title(text)
    body = extract_body(text)
    content = (body or desc or "")[:5000]

    result = {
        "title": title[:300],
        "desc": (desc or "")[:500],
        "pubdate": pubdate or "",
        "content": content,
    }
    print("SCRAPER_RESULT:" + json.dumps(result))
except Exception as e:
    import traceback
    sys.stderr.write("SCRAPER_ERROR:" + str(e) + "\n")
    sys.exit(1)
