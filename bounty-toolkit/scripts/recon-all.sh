#!/bin/bash
# Full recon pipeline for a target domain
# Usage: ./recon-all.sh target.com [wordlist]

TARGET="${1:?Usage: $0 <target.com> [wordlist]}"
WORDLIST="${2:-/opt/SecLists/Discovery/DNS/namelist.txt}"
OUTPUT_DIR="recon/$(echo $TARGET | sed 's/\./_/g')"
mkdir -p "$OUTPUT_DIR"

echo "🎯 Starting recon on: $TARGET"
echo "📁 Output directory: $OUTPUT_DIR"

# Phase 1: Passive subdomains
echo ""
echo "[1/8] 🔍 Passive subdomain enumeration..."
assetfinder --subs-only "$TARGET" > "$OUTPUT_DIR/subs_passive.txt"
echo "  ↳ Found $(wc -l < $OUTPUT_DIR/subs_passive.txt) passive subdomains"

# Phase 2: Active subdomains via amass
echo ""
echo "[2/8] 🔍 Active subdomain enumeration (amass)..."
amass enum -passive -d "$TARGET" -o "$OUTPUT_DIR/subs_amass.txt" 2>/dev/null || true
cat "$OUTPUT_DIR/subs_amass.txt" >> "$OUTPUT_DIR/subs_passive.txt" 2>/dev/null || true

# Phase 3: DNS bruteforce
echo ""
echo "[3/8] 💥 DNS bruteforce..."
puredns resolve "$WORDLIST" -r /opt/resolvers.txt -o "$OUTPUT_DIR/subs_bruteforced.txt" 2>/dev/null || true

# Phase 4: Merge & dedupe all subdomains
echo ""
echo "[4/8] 🧹 Merging and deduplicating..."
cat "$OUTPUT_DIR/subs_passive.txt" "$OUTPUT_DIR/subs_bruteforced.txt" 2>/dev/null \
  | grep -i "$TARGET" \
  | sort -u > "$OUTPUT_DIR/all_subs.txt"
echo "  ↳ Total unique subdomains: $(wc -l < $OUTPUT_DIR/all_subs.txt)"

# Phase 5: Probe alive hosts
echo ""
echo "[5/8] 🌐 Probing alive HTTP servers..."
if [ -s "$OUTPUT_DIR/all_subs.txt" ]; then
  cat "$OUTPUT_DIR/all_subs.txt" | httprobe -c 50 -t 5 -o "$OUTPUT_DIR/alive.txt" 2>/dev/null
else
  echo "  ↳ No subdomains found, skipping httprobe"
  touch "$OUTPUT_DIR/alive.txt"
fi
echo "  ↳ Alive hosts: $(wc -l < $OUTPUT_DIR/alive.txt)"

# Phase 6: Screenshot / title / tech detection
echo ""
echo "[6/8] 📸 Screenshot + tech detection..."
if [ -s "$OUTPUT_DIR/alive.txt" ]; then
  httpx -l "$OUTPUT_DIR/alive.txt" -title -tech-detect -status-code -o "$OUTPUT_DIR/details.txt" 2>/dev/null
  echo "  ↳ Details saved to details.txt"
fi

# Phase 7: Collect URLs via wayback + gau
echo ""
echo "[7/8] 📜 Fetching historical URLs..."
if [ -s "$OUTPUT_DIR/alive.txt" ]; then
  cat "$OUTPUT_DIR/alive.txt" | waybackurls > "$OUTPUT_DIR/urls_wayback.txt" 2>/dev/null || true
  gau "$TARGET" > "$OUTPUT_DIR/urls_gau.txt" 2>/dev/null || true
  cat "$OUTPUT_DIR/urls_wayback.txt" "$OUTPUT_DIR/urls_gau.txt" | sort -u > "$OUTPUT_DIR/all_urls.txt"
  echo "  ↳ Total URLs: $(wc -l < $OUTPUT_DIR/all_urls.txt)"
fi

# Phase 8: Run nuclei scan
echo ""
echo "[8/8] ⚡ Running nuclei vulnerability scan..."
if [ -s "$OUTPUT_DIR/alive.txt" ]; then
  nuclei -l "$OUTPUT_DIR/alive.txt" -t vulnerabilities/ -o "$OUTPUT_DIR/nuclei_results.txt" -severity medium,high,critical 2>/dev/null || true
  echo "  ↳ Nuclei scan complete"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Recon complete for $TARGET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Output files:"
ls -lh "$OUTPUT_DIR"
echo ""
echo "Quick wins to check manually:"
grep -E "upload|api|admin|debug|test|staging|dev|jenkins|gitlab|swagger|graphql|console" "$OUTPUT_DIR/all_subs.txt" 2>/dev/null || true
echo ""
echo "⚠️  Review nuclei results: $OUTPUT_DIR/nuclei_results.txt"
