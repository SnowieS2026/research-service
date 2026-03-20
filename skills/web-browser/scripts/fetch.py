#!/usr/bin/env python3
"""
Fetch and extract readable content from web pages.
Converts HTML to clean markdown or text.
"""

import argparse
import re
import urllib.request
import urllib.parse
import urllib.error
from html.parser import HTMLParser
from typing import Optional


class HTMLToTextParser(HTMLParser):
    """Simple HTML to text converter."""
    
    def __init__(self):
        super().__init__()
        self.text_parts = []
        self.skip_tags = {'script', 'style', 'nav', 'header', 'footer', 'aside'}
        self.skip_depth = 0
        self.current_tag = None
        
    def handle_starttag(self, tag, attrs):
        self.current_tag = tag
        if tag in self.skip_tags:
            self.skip_depth += 1
        elif tag in ['p', 'div', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li']:
            self.text_parts.append('\n')
        elif tag == 'a':
            attrs_dict = dict(attrs)
            if 'href' in attrs_dict:
                self.text_parts.append(f" [{attrs_dict['href']}] ")
                
    def handle_endtag(self, tag):
        if tag in self.skip_tags:
            self.skip_depth -= 1
        elif tag in ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li']:
            self.text_parts.append('\n')
            
    def handle_data(self, data):
        if self.skip_depth == 0:
            self.text_parts.append(data)
            
    def get_text(self) -> str:
        text = ''.join(self.text_parts)
        # Clean up whitespace
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = re.sub(r'[ \t]+', ' ', text)
        return text.strip()


def fetch_url(url: str, max_chars: Optional[int] = None, 
              user_agent: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0") -> dict:
    """
    Fetch and extract content from a URL.
    
    Args:
        url: The URL to fetch
        max_chars: Maximum characters to return (None for all)
        user_agent: User agent string
    
    Returns:
        Dict with 'url', 'title', 'content', and optional 'error'
    """
    try:
        headers = {
            'User-Agent': user_agent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'identity',
            'Connection': 'keep-alive',
        }
        
        req = urllib.request.Request(url, headers=headers, method='GET')
        
        with urllib.request.urlopen(req, timeout=20) as response:
            content_type = response.headers.get('Content-Type', '')
            
            # Try to detect encoding
            encoding = 'utf-8'
            if 'charset=' in content_type:
                encoding = content_type.split('charset=')[-1].split(';')[0].strip()
            
            html = response.read().decode(encoding, errors='replace')
            
            # Extract title
            title_match = re.search(r'<title[^>]*>([^<]+)</title>', html, re.IGNORECASE)
            title = title_match.group(1).strip() if title_match else "No title"
            
            # Convert to text
            parser = HTMLToTextParser()
            parser.feed(html)
            text = parser.get_text()
            
            # Truncate if needed
            if max_chars and len(text) > max_chars:
                text = text[:max_chars] + "\n\n[Content truncated...]"
            
            return {
                "url": url,
                "title": title,
                "content": text,
                "length": len(text)
            }
            
    except urllib.error.HTTPError as e:
        return {"url": url, "error": f"HTTP {e.code}: {e.reason}"}
    except urllib.error.URLError as e:
        return {"url": url, "error": f"URL Error: {e.reason}"}
    except Exception as e:
        return {"url": url, "error": str(e)}


def main():
    parser = argparse.ArgumentParser(description="Fetch and extract web page content")
    parser.add_argument("url", help="URL to fetch")
    parser.add_argument("-m", "--max-chars", type=int, default=10000,
                        help="Maximum characters to extract (default: 10000)")
    parser.add_argument("--raw", action="store_true", help="Output raw text without formatting")
    
    args = parser.parse_args()
    
    result = fetch_url(args.url, max_chars=args.max_chars)
    
    if "error" in result:
        print(f"Error: {result['error']}")
        return 1
    
    if not args.raw:
        print(f"\n📄 {result['title']}")
        print(f"🔗 {result['url']}")
        print(f"📊 {result['length']} characters\n")
        print("─" * 60)
    
    print(result['content'])
    
    return 0


if __name__ == "__main__":
    exit(main())
