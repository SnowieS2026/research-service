# -*- coding: utf-8 -*-
import re

with open("publish-manually.html", "r", encoding="utf-8") as f:
    data = f.read()

# Extract the actual newsletter title from the content for SEO
title_match = re.search(r'<h3>([^<]+)</h3>', data)
if title_match:
    newsletter_title = title_match.group(1).strip()
else:
    newsletter_title = "Daily Newsletter"

# Extract a description from the opening paragraph
para_match = re.search(r'<p>([^<]{80,200})</p>', data)
if para_match:
    description = para_match.group(1).strip()
else:
    description = "Sharp analysis on tech, finance, and geopolitics -- for readers who want the real picture, faster."

# SEO meta tags
seo_tags = f"""\
  <!-- SEO Meta Tags -->
  <title>Prismal -- Friday 27 March 2026 | Tech x Finance x Geopolitics</title>
  <meta name="description" content="{description}">
  <meta name="keywords" content="daily newsletter, tech news, finance news, geopolitics, market analysis, AI, Federal Reserve, cybersecurity, ransomware, Bitcoin">
  <meta name="author" content="Prismal">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://prismal.beehiiv.com">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="Prismal -- Friday 27 March 2026">
  <meta property="og:description" content="{description}">
  <meta property="og:url" content="https://prismal.beehiiv.com">
  <meta property="og:site_name" content="Prismal">
  <meta property="article:published_time" content="2026-03-27">
  <meta property="article:section" content="Tech x Finance x Geopolitics">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="Prismal -- Friday 27 March 2026">
  <meta name="twitter:description" content="{description}">
  <meta name="twitter:site" content="@prismal">

"""

# Insert SEO tags after the charset meta tag
data = data.replace(
    '<meta charset="utf-8">\n<title>',
    '<meta charset="utf-8">\n' + seo_tags + '<title>'
)

with open("publish-manually.html", "w", encoding="utf-8") as f:
    f.write(data)

print("SEO tags added to publish-manually.html")
print("Title:", title_match.group(1) if title_match else "not found")
print("Description:", description[:80] + "...")
