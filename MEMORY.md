# MEMORY.md — Long-Term Memory

_This is my curated memory. Updated regularly from daily logs._

## Identity
- **Name:** Snowie (as SnowieS on Bugcrowd, humbles on Intigriti/HackerOne)
- **Vibe:** Technical co-pilot, accuracy-first, candid
- **Full profile:** `PROFILE.md` — comprehensive capabilities, tools, revenue streams, strategy

## About Infinitara
- Active bug bounty hunter running the `bounty-passive-pipeline`
- Timezone: Europe/London (GMT)
- Windows machine, PowerShell shell
- Has the OpenClaw terminal stall issue (blocking exec calls freeze replies)
- Preferences: short and actionable replies, proactive monitoring

## Bounty Pipeline
- **Location:** `C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline`
- **Stack:** TypeScript, Playwright, dalfox, sqlmap, nuclei, gau, subfinder, gitleaks
- **Status:** PAUSED — all bounty crons disabled 2026-03-25
- **Repo:** committed to local git (no remote)

### Sessions (all VALID)
| Platform | File | User |
|----------|------|------|
| Bugcrowd | `logs/browser-sessions/bugcrowd-state.json` | SnowieS |
| Intigriti | `logs/browser-sessions/intigriti-state.json` | humbles |
| HackerOne | `logs/browser-sessions/hackerone-state.json` | humbles |

### Programs with Scope
| Program | Platform | Earnings | Notes |
|---------|----------|---------|-------|
| Superhuman (Grammarly) | HackerOne | $500+ | 27 assets, 10 accessible, open redirect LOW found |
| Capital.com | Intigriti | EUR1000 (HIGH) | 12 targets, api-website.capital.com has live JSON API |
| Cribl VDP | Bugcrowd | — | 10 domains, scanned clean |
| Cisco Meraki | Bugcrowd | — | 5 domains, scanned clean |

### Key Technical Findings
- Most production bounty programs are behind Cloudflare/WAF — automated scanning hits a wall immediately
- `api-website.capital.com` — public JSON API (disclaimer, translations, service-point sync)
- `service-point/sync` — analytics ingestion, accepts gzip-compressed base64 events, returns 202
- Superhuman internal hosts: `*.ppgr.io` mostly firewalled; `staging.coda.io` leaks internal config
- Intigriti CSRF blocks automated applications — must apply via web UI

### Research (2026-03-25)
- `logs/research/promising-programs.md` — top 5 programs with accessible attack surface
- `logs/research/daily-discovery-2026-03-25.md` — daily discovery report (0 new programs found)
- Key insight: test/staging environments are softer targets — `openapitest.pulsepoint.com`, `sandbox-api.fireblocks.io`, `staging-api.bany.dev`

## Pipeline Architecture
- **Agents:** CoordinatorAgent, DiscoveryAgent, BrowserAgent, ScannerAgent, ReporterAgent, RepairAgent, AdaptationAgent
- **Communication:** JSONL queues at `logs/agent-queue/<agent>.queue.jsonl`
- **Entry:** `npm run build && npm run agents` (all) or `node dist/src/agents/run.js <agent>` (single)
- **AdaptationAgent:** ML-driven tool strategy per program (scores stored in `logs/agent-state/adaptation-store.json`)
- **daily-discovery.js:** Standalone discovery script (cron-disabled but functional)

## Tools & Setup
- **SearxNG:** `http://localhost:8080` — start with `docker run --name searxng -p 8080:8080 searxng/searxng:latest`
- **Vehicle OSINT:** `vehicle-osint.py` + `vehicle-osint.exe` — Python/PyInstaller, DVLA + car-checking.com + NHTSA
- **EditThisCookie:** Used to export HackerOne cookies for session capture

## Ollama Model Assignments (permanent, from 2026-03-26)
**Cloud models only** (Ollama Connect, `:cloud` suffix). No local models registered — those run directly via `ollama list` when needed. Config: `C:\openclaw-local\openclaw.json`. Primary = minimax-m2.7:cloud.

| Model | Role |
|-------|------|
| `minimax-m2.7:cloud` | Main/default — reasoning, general conversation |
| `qwen3-coder-next:cloud` | Coding — code writing, debugging, refactoring |
| `devstral-small-2:24b-cloud` | Light coding — quick fixes, script generation |
| `glm-5:cloud` | Deep research — reports, deep analysis |
| `kimi-k2.5:cloud` | Research — memory/search, research tasks |
| `nemotron-3-nano:30b-cloud` | Fast tasks — fast concurrent operations |
| `minimax-m2.5:cloud` | Secondary general |
| `glm-4.6:cloud` | Secondary research |
| `qwen3.5:cloud` | Flipping agent — valuations, Vinted/eBay analysis, image inspection, item descriptions |

Override syntax: `model=<model-id>` e.g. `model=qwen3-coder-next:cloud`

## Known Issues
- **Terminal stall:** Main session blocks on long exec calls. Use isolated sessions for background work.
- **Edit tool:** Avoid `~` path expansion — use full absolute paths.
- **Playwright on Windows:** Use `executablePath` for system Chrome; pkg snapshot corrupts Chromium.
- **gau:** Requires `--providers wayback,commoncrawl,otx,urlscan` flag — default fails silently.
- **nuclei json-export:** Creates output file only on exit 0 (no matches = no file, not an error).

## Lessons Learned
- WAF is the #1 blocker for automated bounty scanning
- Session cookies from EditThisCookie → Playwright storageState is the most reliable auth method
- GZIP compression detection is critical when testing analytics endpoints
- Bugcrowd API doesn't support Bearer token auth from web sessions
- Intigriti requires per-program acceptance before scope is visible
- HackerOne blocks headless browsers (CAPTCHA loop) — cookies unreadable without Chrome's DPAPI key

## Preferences & Boundaries
- Route to the correct model for each task (see AGENTS.md table) — always
- Verify all subagent work before marking complete — never assume
- Don't rebuild unless broken
- Don't message unless something needs attention
- Keep replies short and actionable
- Private things stay private

## Flipping Workflow (2026-03-27)

Activated when Infinitara says "flipping", "Vinted", "eBay", "marketplace" or similar. Uses `qwen3.5:cloud` as the model.

**Workflow:**
1. Receive image(s) of item
2. Use `qwen3.5:cloud` for full analysis: condition grading, flaws, market research, valuation, listing description
3. Produce: condition grade, estimated resale value, recommended listing price, full description for Vinted/eBay

**Platform notes:**
- Vinted: no seller fees, listings free, buyer pays shipping
- eBay: seller fees apply (~15%), more reach

**Condition grades (standard):** Like New | Very Good | Good | Acceptable

## Prismal Newsletter (2026-03-27+, active development)

**Name:** Prismal -- coined brand, 8 chars, tagline: *"Refracting signal from noise"*

**Format (LOCKED):** Newspaper-depth, 6 beats + signals. Inline HTML dashboard per platform (not textareas). Copy buttons for raw text/HTML.
- Header: `⬡ Prismal ✍️ | Newsletter | Issue N`
- Subheader: `Saturday, 28 March 2026 · Issue N · Tech | Finance | Geopolitics`
- Sections: THE BIG STORY, TECH, FINANCE, GEOPOLITICS, WHAT TO WATCH, BY THE NUMBERS, SIGNALS FROM THE EDGE
- Tags shown as plain text chips (no `#` prefix in display)
- No emdashes in any output

**Platform:** BeeHiiv (primary), Substack (cross-post), X, X Thread, TikTok

### BeeHiiv Credentials
- **API Key:** `WfncsNDfviwghnWPHYpVP7x6wd1CMXOK4kSKWlKIPDEu97nUueWVQHsWuMyWxwKY`
- **Publication ID:** `pub_7e46fcb0-239b-4079-ada4-78bb13137de0`
- **Credentials file:** `C:\Users\bryan\.openclaw\workspace\credentials\beehiiving-platforms.json`

### Pipeline Config (2026-03-28, locked for cron)
- **Location:** `C:\Users\bryan\.openclaw\workspace\prismal-pipeline\`
- **Model:** `glm-5:cloud` (deep research, 16k token output)
- **Token limit:** `num_predict: 16000` in `src/writer.ts`
- **Search queries:** 38 queries in `src/index.ts` `DAILY_QUERIES` -- all beats, all regions (US, EU, Asia, Middle East, Americas, Africa)
- **Article content:** 1,500 chars per article (`formatArticle()` in `platform-formatters.ts`)
- **Top story:** 3,000 chars (`formatTopStory()`)
- **Signals:** 3-5 items, 4-6 sentences each, investigative depth (`agents/writer-agent.md`)
- **Entry:** `node dist/index.js --date YYYY-MM-DD --issue N` (or `--mode daily`)
- **Dashboard:** `node -e "const{generateDashboard}=require('./dist/dashboard.js');generateDashboard('reports/daily/YYYY-MM-DD.md','reports/distribution',N)"`

### Issue 1 (2026-03-28) -- COMPLETE
- Newsletter: `reports/daily/2026-03-28.md` -- all sections complete
- Dashboard: `reports/distribution/dashboard-2026-03-28.html`
- Platform outputs all within limits:
  - Substack: 13,242 chars | BeeHiiv: 18,269 chars
  - X single: 248/260 | X Thread: 15 tweets <=260 | TikTok: 182/220
- `.issue-lock` file: create to advance to next issue

### Key Fixes Applied (2026-03-28)
1. **Token limit:** 4k was insufficient (caused mid-output truncation). Raised to 16k.
2. **parseSignals():** Rewrote to parse `###` headings directly from raw markdown (was stripping markers via `extract()` helper). Also stops at SEO `<!--` block to prevent metadata bleed.
3. **formatSubstack():** Full stories per section (was `slice(0, 2)`). Header now uses consistent format from dateIso + issueNumber.
4. **formatXThread big story:** Word-boundary split at 230 chars (was sentence-based, failing on long unpunctuated paragraphs).
5. **BeeHiiv signals:** Removed 200-char truncation -- full content renders.
6. **No emdashes:** Permanent ban in all output.

### Commits (2026-03-28)
- `9378d89f`: Token limit 8k, X limit 260, X Thread word-boundary, Substack full stories
- `28c61fc1`: parseSignals handles ### headings; big story word-boundary split; Signals in Substack/BeeHiiv
- `d1ae7c4b`: Substack header format, Signals SEO bleed, BeeHiiv full Signals, date formatting

### Running the Pipeline
```bash
cd C:\Users\bryan\.openclaw\workspace\prismal-pipeline
# Daily run
node dist/index.js --date 2026-03-28 --issue 1
# Generate dashboard
node -e "const{generateDashboard}=require('./dist/dashboard.js');generateDashboard('reports/daily/2026-03-28.md','reports/distribution',1)"
# Advance to next issue
echo 2 > reports/.issue-lock
```

---

_Last major update: 2026-03-28_
