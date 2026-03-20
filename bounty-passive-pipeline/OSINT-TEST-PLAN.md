# OSINT Tools — Test & Fix Plan
**Last updated:** 2026-03-20 01:32
**Status:** In progress

## Tool Status

| Tool | Status | Notes |
|------|--------|-------|
| VehicleCollector | ❌ BROKEN | Advisory parsing empty — MOT block detection bug |
| UsernameCollector | ⚠️ UNTESTED | 30 platforms, HEAD requests, may block |
| PersonCollector | ⚠️ UNTESTED | DuckDuckGo HTML scraping |
| BusinessCollector | ⚠️ UNTESTED | DuckDuckGo + CRTSH |
| DomainCollector | ⚠️ UNTESTED | CRTSH + Cloudflare DoH — looks solid |
| IpCollector | ⚠️ UNTESTED | ip-api + BGPView + RDAP — looks solid |
| PhoneCollector | ⚠️ UNTESTED | DuckDuckGo only |
| EmailCollector | ⚠️ UNTESTED | DuckDuckGo + HIBP/Hunter (need keys) |
| GeneralCollector | ⚠️ UNTESTED | DuckDuckGo only |

## Root Cause: VehicleCollector Advisory Parsing

**Symptom:** `estimateAdvisories()` works perfectly in isolation (returns 7 items, £400–£1325).
  But `advisoryLines` is empty when called from the collector.

**Root cause:** The MOT block split `text.split(/(?=MOT #\d+)/gi)` creates blocks where
  "Result:" appears mid-block (after whitespace, not at line start). The regex
  `/\bResult:\s*\n?\s*Pass\b/i` with `^` anchor never matches. The `recentPassBlock`
  variable ends up empty, so the advisory extraction loop never runs.

**Raw text structure (approximate):**
  - Block header: "MOT #23" alone on one line
  - Block body: Test data, advisories
  - Block footer: "Result: Pass" preceded by whitespace/newline
  - Split at `(?=MOT #\d+)` creates a block that starts with "MOT #23" header only

**Fix strategy:** Don't rely on MOT block splitting. Extract advisory items directly
  from the full raw text using a multiline regex that finds all "Advice/Advisory"
  lines, then deduplicate.

## Test Strategy

### Smoke Tests (quick — each collector with a known target)
Each test: run the collector, confirm no errors, confirm at least one finding.

| Collector | Test Target | Expected |
|-----------|-------------|----------|
| DomainCollector | example.com | WHOIS, DNS, CRTSH data |
| IpCollector | 8.8.8.8 | Geo, BGP, RDAP data |
| PhoneCollector | +447700900000 | Validation result |
| EmailCollector | test@example.com | Format check + web search |
| GeneralCollector | Edinburgh | Web results + wiki |
| BusinessCollector | Tesco | Company data |
| PersonCollector | John Smith | Social profiles |
| UsernameCollector | tomsmith | Platform results |

### Full Validation (per tool)
After smoke test passes, run with realistic targets and verify output quality.

## Execution Plan

### Phase 1: Fix VehicleCollector (PRIORITY)
- [ ] Rewrite advisory extraction to use multiline regex on full raw text
- [ ] Build and test
- [ ] Verify `advisory_total_min > 0` in output
- [ ] Verify report shows per-item cost breakdown

### Phase 2: Smoke test all other collectors
- [ ] Run each collector with test target
- [ ] Log errors and finding counts
- [ ] Identify any that are blocked or broken

### Phase 3: Fix broken ones
- [ ] Fix any issues found in Phase 2
- [ ] Iterate until all 9 tools return valid data

## Test Output
Results written to: `reports/osint/YYYY-MM-DD/` as JSON + markdown files.
Also logged to: `logs/bounty.db` and `logs/last-run.json`

## Cron Schedule
Overnight testing via isolated agentTurn cron jobs.
