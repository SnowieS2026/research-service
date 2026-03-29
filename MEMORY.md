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
- **Vehicle OSINT:** Full pipeline at `bounty-passive-pipeline/`. Python CLI: `python vehicle-osint.py [PLATE]`. Report: `reports/osint/YYYY-MM-DD/vehicle-PLATE-full.md` (14-section emoji format). Sources: car-checking.com (Cloudflare-blocked in headless, use OpenClaw browser fallback), gov.uk DVLA (cloudscraper + Playwright anti-detect), check-mot-history.co.uk (cloudscraper, full 18-entry MOT timeline), data.gov.uk MOT API (free JSON). Skill: `skills/vehicle-osint/SKILL.md`. TypeScript collectors in `src/osint/collectors/VehicleCollector.ts`.
- **EditThisCookie:** Used to export HackerOne cookies for session capture
- **Document Creation:** Local Python tools for Word, Excel, PowerPoint, PDF. Skill: `skills/document-creator/SKILL.md`. Tools: `tools/docx_create.py`, `tools/xlsx_create.py`, `tools/pptx_create.py`, `tools/pdf_create.py`, `tools/md_to_docx.py`, `tools/md_to_pdf.py`. Dependencies: `python-docx`, `openpyxl`, `python-pptx`, `reportlab`, `markdown-it-py`.
- **Image Generation:** Stability AI SDXL via REST API. Skill: `skills/image-generator/SKILL.md`. Tool: `tools/img_generate.py`. API key in `credentials/stability-ai.json`. 25 free credits. Generates: book covers, thumbnails, product images, banners. Dimensions auto-snapped to SDXL-allowed sizes.
- **OSINT Toolkit:** Unified wrapper at `tools/osint-toolkit.py` — all free tools, no API keys required. Wraps: maigret, holehe, sherlock, spiderfoot, exifread. Web-based launchers: Yandex Images, PimEyes, Google Lens, Jeffrey's Exif, Hunter.io, Social Blade, Pushshift/Reddit, Spydialer, Truecaller, WhatsMyName. Entry: `python tools/osint-toolkit.py <command> [args]`. Full list: `python tools/osint-toolkit.py --help`. Sherlock at `tools/sherlock/`, SpiderFoot at `tools/spiderfoot/`.

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

## Active Skills (workspace-managed)
| Skill | What it does |
|-------|-------------|
| `vehicle-osint` | UK vehicle OSINT pipeline -- 14-section report from DVLA, MOT history, valuations, risk analysis. Entry: `python vehicle-osint.py [PLATE]`. |
| `document-creator` | Create Word, Excel, PowerPoint, PDF documents from structured input. Entry: `python tools/docx_create.py`, `xlsx_create.py`, `pptx_create.py`, `pdf_create.py`. |
| `image-generator` | Generate AI images via Stability AI SDXL. Entry: `python tools/img_generate.py --prompt "..." --output image.png`. |
| `research-service` | Full research pipeline: SearxNG search -> scrape -> structured report |
| `web-browser` | Fast web search + content extraction via SearxNG |
| `osint-toolkit` | Unified OSINT: username (Maigret/Sherlock/Holehe), email discovery, image metadata (EXIF/ELA), reverse image, phone lookup, Hunter.io, Social Blade. Entry: `python tools/osint-toolkit.py <command> [args]`. No API keys needed. |

## Lessons Learned
- WAF is the #1 blocker for automated bounty scanning
- Session cookies from EditThisCookie → Playwright storageState is the most reliable auth method
- GZIP compression detection is critical when testing analytics endpoints
- Bugcrowd API doesn't support Bearer token auth from web sessions
- Intigriti requires per-program acceptance before scope is visible
- HackerOne blocks headless browsers (CAPTCHA loop) — cookies unreadable without Chrome's DPAPI key

## Contacts
- **Infinitara** (851533398) -- primary user, Telegram @Infinitara, Europe/London
- **Shell** (5958934302) -- authorized sender, Telegram @shell_biatch

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

### Issue 2 (2026-03-29) -- COMPLETE (published manually)
- Distribution files all present: `substack-2026-03-29.txt`, `beehiiv-2026-03-29.html`, `x-2026-03-29.txt`, `x-thread-2026-03-29.txt`, `tiktok-2026-03-29.txt`
- `.issue-lock` manually set to 2 before this run
- Ran manually by Infinitara ~2hr before this session (2026-03-29 ~01:36)

### Issue 3 -- NEXT RUN
- `.issue-lock` set to 2 (advances automatically via cron or manual run)

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

## Flip Finder (2026-03-29 -- ACTIVE)

**Location:** `C:\Users\bryan\.openclaw\workspace\flip-finder\`

**Sources:** Gumtree (primary, working via Playwright+system Chrome `channel='chrome'`) | Preloved (secondary, Scottish listings only) | Freegle (dead/DNS blocked)

**Coverage:** Perth, Kirkcaldy, Dundee, St Andrews via Gumtree `/for-sale/{location}/{category}` pages. Preloved adds Scottish-only listings via postcode/town filter.

**Cron:** `flip-finder-daily` — `0 8,12,16,20 * * *` (8am/12pm/4pm/8pm GMT) via isolated `nemotron-3-nano:30b-cloud` agent. Reports to Telegram 851533398 with top flippable items + spreadsheet path.

**Stack:** TypeScript, Playwright (system Chrome `channel='chrome'`), SQLite (better-sqlite3), xlsx

**Commands:**
```bash
cd C:\Users\bryan\.openclaw\workspace\flip-finder
node dist/index.js scrape   # scrape all sources
node dist/index.js status   # show top listings
node dist/index.js export  # export to Excel
```

**Assessor:** Keyword-based scoring across 13 categories: electronics, tools, sports, furniture, collectibles, appliances, auto, home, toys, console_games, clothing, equestrian, pet_livestock. Price boost for free/cheap items. `flipScore >= 60` = flippable. `>= 75` = top pick (green in spreadsheet).

**DB:** `flip-finder/data/listings.db` — SQLite WAL mode, dedup by URL, upsert on re-scrape.

**Known issues:** Gumtree `/search?location=...` URL 404s — must use `/for-sale/{location}/{category}` format. Edinburgh listings from Gumtree Perth location page — filtered via Scottish postcode/town list (PH/KY/DD + Scottish towns).

_Last major update: 2026-03-29 02:37_

---

## Geopolitical Investigation (2026-03-28/29 -- COMPLETE)

**All research outputs:** `geopolitics/research/`
**Vector store:** 626 docs in `pipeline_findings` collection (Chroma at localhost:8000)

### Reports Written (20 total)

**UK Political POI Reports:**
- SADIQ-KHAN-POI-report.md — No offshore/shell companies; Harris Bokhari (anti-Ahmadiyya sectarian) flagged; MCB engagement during 2009-2021 ban
- HUMZA-YOUSAF-POI-report.md — Father Mohammad Sarwar was Punjab Governor under BOTH PML-N and PTI; £512K Alex Salmond settlement (not £430M+)
- ANAS-SARWAR-POI-report.md — Brother Athif (Atif) Sarwar convicted £850K MTIC fraud, acquitted 2011; Anas transferred 25% business to trust 2017; Hutchesons' Grammar overlap with Yousaf
- WAYNE-COUPENS-report.md — Correct name: Couzens (Sarah Everard murderer 2021), Met firearms officer, 20-year pattern of offending
- ALEX-SALMOND-SETTLEMENT-report.md — £512,250 settlement, Court of Session ruled Scottish Govt investigation unlawful
- ASIM-SARWAR-FRAUD-report.md — Correct brother name: Athif/Atif, not Asim; £850K MTIC carousel fraud; father abandoned UK citizenship
- QATAR-UK-MOSQUE-FUNDING-report.md — Important: Qatar is NOT primary UK mosque funder; Saudi Arabia is (King Fahd £1.1M East London Mosque 1980s)
- MUSLIM-IMPACT-FORUM-report.md — MIF GROUP LTD company 16076107 incorporated Nov 2024; Yousaf keynote speaker (not employee); no charity registration
- UK-SECRETS-report.md — Brian Nelson (UDA/FRU agent), Kincora Boys Home, MI5 vs Wilson, Matrix Churchill, security force/UVF collusion

**Regional Secrets:**
- AMERICAS-SECRETS, EUROPE-SECRETS, MIDEAST-AFRICA-SECRETS, ASIA-SECRETS, UK-SECRETS

**Global Islamic Infrastructure (2026-03-29):**
- SAUDI-GLOBAL-ISLAMIC-INFRASTRUCTURE-report.md (51KB) — MWL, IIRO, Al Haramain, £1.1M East London Mosque, £2M London Central Mosque, 1,500+ mosques, Al-Yamamah arms
- IRAN-GLOBAL-ISLAMIC-INFRASTRUCTURE-report.md (23KB) — Quds Force $3B+ budget, $1B to Hezbollah in 10 months (2025), FinCEN $9B shadow banking, Mykonos assassinations, Albania MEK ops, Houthis weapons, Iraqi militias, UAE sanctions hub
- MUSLIM-BROTHERHOOD-GLOBAL-report.md (55KB) — Founded 1928 Egypt; MCB/MAB/ISB UK affiliates; Hamas=Brotherhood's Palestinian arm; Qatar/Qaradawi soft power; Waqf/Zakat financing; Saudi 2014 terrorist designation
- ISLAMIC-CHARITY-DAWAH-NETWORK-report.md (20KB) — IIRO (al-Qaeda financing), Al Haramain (designated/dissolved), Islamic Relief (UK HQ, Qatar Charity links), Tablighi Jamaat (banned by Saudi 2021), Deobandi UK network, Salafi literature distribution
- TURKEY-PAKISTAN-GLOBAL-ISLAMIC-NETWORKS-report.md (20KB) — Diyanet (2,000+ mosques/132 countries), DITIB Germany 900+ mosques (intelligence concerns), ICMG/Milli Gorus UK, Grey Wolves UK, ISI/Taliban/Haqqani/LeT, Hutchesons' Grammar overlap (Yousaf AND Sarwar both attended)

### Key Corrections
- Qatar is NOT primary UK mosque funder — Saudi Arabia is
- Athif Sarwar is the correct brother name (not Asim)
- Alex Salmond settlement = £512K not £430M+
- Wayne Couzens = correct spelling (Sarah Everard murderer)
- Muslim Impact Forum = MIF GROUP LTD, Yousaf keynote speaker not employee
- Tablighi Jamaat is Deobandi-derived, NOT Saudi-funded (banned by Saudi 2021)
- Islamic Relief Worldwide is UK-registered (not Saudi)
- Hutchesons' Grammar overlap = sociological elite formation not ideological pipeline

### SearxNG Skill (2026-03-29)
Built comprehensive skill at `skills/searxng-research/` with 4 scripts (search.py, fetch.py, multi.py, research.py). Running on local SearxNG Docker at localhost:8080. Already surfacing new intel that subagents missed (Labour donor £3.5M in Khan contracts, hate cleric donation).

### Hutchesons' Grammar Key Question
Both Humza Yousaf and Anas Sarwar attended Hutchesons' Grammar School Glasgow. This private school (feeder to top universities) may represent a Pakistani-Scottish elite formation pipeline. No religious or Saudi connection — mainstream Scottish independent school. Both families are Pakistani-Scottish business families. The connection is sociological, not financial.

_Last major update: 2026-03-29 02:37_
