#!/bin/bash
# Web enumeration pipeline - crawl, dirbust, screenshot, XSS check
# Usage: ./web-enum.sh https://target.com

TARGET="${1:?Usage: $0 <https://target.com>}"
OUTPUT_DIR="web-enum/$(echo $TARGET | sed 's/https\?:\/\///' | sed 's/\./_/g')"
mkdir -p "$OUTPUT_DIR"

echo "🌐 Starting web enumeration on: $TARGET"
echo "📁 Output: $OUTPUT_DIR"

# Crawl with gospider
echo ""
echo "[1/6] 🕷️  Crawling with gospider..."
gospider -s "$TARGET" -o "$OUTPUT_DIR/crawled" -t 10 -d 2 2>/dev/null &
GPID=$!

# Crawl with katana
echo ""
echo "[2/6] 🕷️  Crawling with katana..."
katana -u "$TARGET" -o "$OUTPUT_DIR/katana_out.txt" -d 3 2>/dev/null &

wait $GPID

# Merge all discovered URLs
echo ""
echo "[3/6] 📜 Collecting and deduplicating URLs..."
find "$OUTPUT_DIR" -name "*.txt" -exec cat {} \; 2>/dev/null \
  | grep -v "^\[" | sort -u > "$OUTPUT_DIR/all_urls.txt"
echo "  ↳ Total URLs discovered: $(wc -l < $OUTPUT_DIR/all_urls.txt 2>/dev/null || echo 0)"

# Quick XSS scan with dalfox
echo ""
echo "[4/6] 💉 Quick XSS scan (dalfox)..."
if [ -s "$OUTPUT_DIR/all_urls.txt" ]; then
  dalfox file "$OUTPUT_DIR/all_urls.txt" --depth 1 -o "$OUTPUT_DIR/xss_results.txt" 2>/dev/null || true
  echo "  ↳ XSS scan done → xss_results.txt"
fi

# Fuzz common paths with ffuf
echo ""
echo "[5/6] 🔍 Fuzzing directories with ffuf..."
mkdir -p "$OUTPUT_DIR/ffuf"
ffuf -u "$TARGET/FUZZ" \
  -w /opt/SecLists/Discovery/Web-Content/common.txt \
  -mc 200,204,301,302,307,401,403 \
  -o "$OUTPUT_DIR/ffuf/dirbust.json" \
  -of json 2>/dev/null || true
echo "  ↳ Directory fuzzing complete"

# Extract interesting endpoints
echo ""
echo "[6/6] 🔎 Pulling interesting endpoints..."
if [ -s "$OUTPUT_DIR/all_urls.txt" ]; then
  grep -E "(\.js|\.json|api|swagger|graphql|config|env|\.git|debug|admin|login|reset)" \
    "$OUTPUT_DIR/all_urls.txt" > "$OUTPUT_DIR/interesting.txt" 2>/dev/null
  echo "  ↳ Interesting endpoints → interesting.txt ($(wc -l < $OUTPUT_DIR/interesting.txt 2>/dev/null || echo 0) found)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Web enumeration complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Key files:"
echo "  all_urls.txt     - all discovered URLs"
echo "  xss_results.txt  - potential XSS findings"
echo "  interesting.txt  - endpoints worth investigating"
echo ""
