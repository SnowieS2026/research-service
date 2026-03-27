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

---

_Last major update: 2026-03-25_
