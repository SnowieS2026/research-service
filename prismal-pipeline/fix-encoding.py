# -*- coding: utf-8 -*-
import re

# Fix publish-manually.html
with open("publish-manually.html", "r", encoding="utf-8") as f:
    data = f.read()

# Remove non-ASCII characters that shouldn't be there (Chinese chars, etc.)
# Keep only basic ASCII printable chars
def remove_non_ascii(text):
    return re.sub(r'[^\x20-\x7E\x09\x0A\x0D]', '', text)

fixed = data.replace("\u5047", "maintained")
with open("publish-manually.html", "w", encoding="utf-8") as f:
    f.write(fixed)

# Also fix the markdown source
with open("reports/daily/2026-03-27.md", "r", encoding="utf-8") as f:
    md = f.read()
md = md.replace("\u5047", "maintained")
with open("reports/daily/2026-03-27.md", "w", encoding="utf-8") as f:
    f.write(md)

print("Fixed encoding issues")
