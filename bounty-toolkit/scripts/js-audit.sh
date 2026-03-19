#!/bin/bash
# Scan JavaScript files for secrets, endpoints, and interesting parameters
# Usage: ./js-audit.sh target.com

TARGET="${1:?Usage: $0 <target.com>}"
OUTPUT_DIR="js-audit/$(echo $TARGET | sed 's/\./_/g')"
mkdir -p "$OUTPUT_DIR"

echo "🔍 JS Audit for: $TARGET"

# Get subdomains + alive hosts
echo "  ↳ Finding JS files via subdomain enumeration..."
assetfinder --subs-only "$TARGET" | httprobe -c 50 | grep "\.js$" > "$OUTPUT_DIR/js_live.txt" 2>/dev/null || true

# Also grab from wayback
echo "  ↳ Pulling JS URLs from Wayback..."
echo "$TARGET" | waybackurls | grep "\.js$" >> "$OUTPUT_DIR/js_live.txt" 2>/dev/null || true

# Also from gau
echo "  ↳ Pulling JS URLs from GAU..."
gau "$TARGET" | grep "\.js$" >> "$OUTPUT_DIR/js_live.txt" 2>/dev/null || true

# Dedupe
sort -u "$OUTPUT_DIR/js_live.txt" -o "$OUTPUT_DIR/js_live.txt"

echo "  ↳ Found $(wc -l < $OUTPUT_DIR/js_live.txt) JS files"

# Download and scan with trufflehog
echo ""
echo "🔑 Scanning for secrets (trufflehog)..."
mkdir -p "$OUTPUT_DIR/js_files"
while read url; do
  filename="$(echo $url | md5sum | cut -d' ' -f1).js"
  curl -sL "$url" -o "$OUTPUT_DIR/js_files/$filename" 2>/dev/null || true
done < "$OUTPUT_DIR/js_live.txt"

trufflehog filesystem "$OUTPUT_DIR/js_files" --json 2>/dev/null > "$OUTPUT_DIR/secrets.json" || true
echo "  ↳ Secrets scan done → secrets.json"

# LinkFinder for endpoints
echo ""
echo "🔗 Extracting endpoints from JS..."
for f in "$OUTPUT_DIR/js_files"/*.js; do
  [ -f "$f" ] || continue
  python3 -m linkfinder "$f" -o cli 2>/dev/null >> "$OUTPUT_DIR/endpoints.txt" || true
done

# RetireJS for vulnerable libraries
echo ""
echo "⚠️  Checking for vulnerable JS libraries..."
retire --path "$OUTPUT_DIR/js_files" --outputformat json --outputpath "$OUTPUT_DIR/vulns.json" 2>/dev/null || true

# Also grep manually for interesting strings
echo ""
echo "📝 Manual pattern scan..."
grep -rohE "(api[_-]?key|token|secret|password|auth|bearer|jwt|aws[_-]?key|azure|gcp)" \
  "$OUTPUT_DIR/js_files" 2>/dev/null | sort -u > "$OUTPUT_DIR/patterns.txt"

echo ""
echo "✅ JS Audit complete → $OUTPUT_DIR/"
echo "  secrets.json  - credentials/secrets found"
echo "  endpoints.txt - extracted endpoints/URLs"
echo "  vulns.json    - vulnerable libraries"
echo "  patterns.txt  - interesting keyword matches"
