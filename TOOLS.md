# TOOLS.md — Complete Inventory

_Last updated: 2026-03-28_

---

## Critical Rules

### Path Rule
**Never use `~` in file paths with the edit/write tools on Windows.** The edit tool does NOT expand `~` to the user home directory. Always use full absolute Windows paths (e.g. `C:\Users\bryan\...`).

### Memory Rules
- **MEMORY.md** — read in main session only (contains personal context for Infinitara)
- **memory/YYYY-MM-DD.md** — daily logs; append only
- **Vector store** — Chroma + Ollama nomic-embed-text, used for semantic search; falls back to file search if unavailable

---

## Available Skills

Workspace skills are at `~/.openclaw/workspace/skills/` and are loaded automatically.

| Skill | When to use | Location |
|-------|-------------|----------|
| `coding-agent` | Delegate coding to Codex/Claude Code | npm global |
| `gh-issues` | GitHub issues, PRs, CI runs | npm global |
| `github` | gh CLI operations, repo management | npm global |
| `healthcheck` | Host security hardening, SSH/firewall audit | npm global |
| `node-connect` | OpenClaw mobile app pairing failures | npm global |
| `openai-whisper-api` | Audio transcription via OpenAI Whisper | npm global |
| `skill-creator` | Create/edit/audit AgentSkills | npm global |
| `weather` | Current weather + forecasts (wttr.in / Open-Meteo) | npm global |
| `research-service` | Full research pipeline: SearxNG → scrape → markdown report | `skills/research-service/SKILL.md` |
| `web-browser` | Fast web search + content extraction via SearxNG | `skills/web-browser/SKILL.md` |

---

## Pipeline: Bounty Passive Scanner

**Location:** `C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline`

**Stack:** TypeScript, Playwright, dalfox, sqlmap, nuclei, gau, subfinder, gitleaks

**Status:** PAUSED — all crons disabled 2026-03-25

**Entry:** `npm run build && npm run agents` (all) or `node dist/src/agents/run.js <agent>` (single)

**Agents:** CoordinatorAgent, DiscoveryAgent, BrowserAgent, ScannerAgent, ReporterAgent, RepairAgent, AdaptationAgent

**Sessions:** `logs/browser-sessions/<platform>-state.json` (EditThisCookie → Playwright storageState)

**Auth:** Bugcrowd user: SnowieS / Intigriti+HackerOne user: humbles

**AdaptationStore:** `logs/agent-state/adaptation-store.json` — ML-driven tool strategy per program

---

## Pipeline: Prismal Newsletter

**Location:** `C:\Users\bryan\.openclaw\workspace\prismal-pipeline`

**Model:** `glm-5:cloud` (deep research, 16k tokens) — Ollama Connect

**Runs:** Daily 1 AM Mon-Fri (`prismal-daily`), Weekly 1 AM Sunday (`prismal-weekly`)

**Daily queries:** 51 queries across Tech/Finance/Geopolitics + intelligence angles

**Weekly queries:** 51 queries with 7-day depth

**Key files:**
- `src/index.ts` — pipeline entry, query sets
- `src/writer.ts` — article pairing, dual-source blocks, Ollama API calls
- `src/platform-formatters.ts` — Substack, BeeHiiv, X, X Thread, TikTok formatters
- `src/dashboard.ts` — newsletter parser, multi-platform dashboard generator
- `src/beehiiv.ts` — BeeHiiv API integration
- `agents/writer-agent.md` — Tom Clancy briefing tone, inline citations, paraphrase-only
- `fix-encoding.py` — strips Chinese character artifacts from model output

**Issue lock files:**
- `reports/.issue-lock` — daily issue counter
- `reports/.issue-lock-weekly` — weekly issue counter

**Dashboard generation (not wired to CLI):**
```
node -e "const{generateDashboard}=require('./dist/dashboard.js');generateDashboard('reports/daily/YYYY-MM-DD.md','reports/distribution',N)"
```

**Credentials:** `C:\Users\bryan\.openclaw\workspace\credentials\beehiiving-platforms.json`

---

## OSINT: Vehicle Checks

**Tool:** `vehicle-osint.py` + `vehicle-osint.exe` (PyInstaller build)

**Capabilities:** UK DVLA, car-checking.com, NHTSA (US)

**Usage:**
```
python C:\Users\bryan\.openclaw\workspace\tools\vehicle-osint.py --reg AB12XYZ
python C:\Users\bryan\.openclaw\workspace\tools\vehicle-osint.py --vin 1HGBH41JXMN109186
```

**Reports output:** `reports/osint/YYYY-MM-DD/vehicle-<REG>.md`

---

## Research Tool

**Location:** `tools/research-tool/research.py`

**Prerequisites:** `pip install requests beautifulsoup4 lxml`

**Usage:**
```
python C:\Users\bryan\.openclaw\workspace\tools\research-tool\research.py \
  --topic "..." --goal "..." --tier standard --output "reports/my-report.md"
```

**Tiers:** `kickstart` (fast) / `standard` / `deep` (comprehensive)

**Search:** SearxNG (local at `http://localhost:8080` or public fallback instances)

---

## Geopolitical Intelligence

**Location:** `geopolitics/`

**Structure:**
- `countries/<Country>/profile.md` — country profile (regime, military, economy, key people)
- `countries/<Country>/news-30days.md` — recent news synthesis
- `queue/suppressed.json` — underreported story queue
- `queue/contradictions.json` — contradictory narratives across sources
- `queue/patterns.json` — recurring intelligence patterns
- `geo-coordinator-prompt.md` — coordinator agent prompt
- `geo-daily-report-prompt.md` — daily report generation prompt

**Daily geo report:** Cron `geo-daily-report` runs at 6 AM GMT via `glm-5:cloud`

---

## Agent Dashboard

**Location:** `agent-dashboard/` (React, Node backend)

**Purpose:** Visual dashboard for OpenClaw agents and pipeline status

**Currently:** Not actively deployed; frontend/backend stubs present

---

## Credentials Store

**Location:** `credentials/`

**Files:**
- `beehiiving-platforms.json` — BeeHiiv API key + publication ID

**Format:** JSON, not committed to git

---

## Vector Store (Semantic Memory)

**Chroma server:** `http://localhost:8000` (Docker, chromadb v3.x)

**Start:** `docker run -d --name chroma -p 8000:8000 -v ./bounty-passive-pipeline/logs/vectorstore:/data chromadb/chroma:latest`

**Ollama model:** `nomic-embed-text` (137M params, F16)

**Collections:**
- `agent_memory` — memory files, workspace docs
- `pipeline_findings` — bounty scan reports, Prismal outputs

**Scripts:**
- `bounty-passive-pipeline/session-startup.ts` — run at session start
- `bounty-passive-pipeline/sync-memory.ts` — full re-ingest all memory files
- `bounty-passive-pipeline/auto-ingest.ts` — incremental sync (runs every ~3 heartbeats)
- `bounty-passive-pipeline/ingest-pipeline.ts` — ingest pipeline outputs

---

## SearxNG (Search)

**Local:** `http://localhost:8080`

**Start:** `docker run -d --name searxng -p 8080:8080 -v searxng:/etc/searxng --restart unless-stopped searxng/searxng:latest`

**Stop:** `docker stop searxng`

**Public fallbacks:** searx.party / searx.mw.io / searx.work / searxng.site

---

## Known Issues

- **Terminal stall:** Main session blocks on long exec calls. Use isolated subagent sessions for background work.
- **Playwright on Windows:** Use `executablePath` for system Chrome; pkg snapshot corrupts Chromium.
- **gau:** Requires `--providers wayback,commoncrawl,otx,urlscan` flag — default fails silently.
- **nuclei json-export:** Creates output file only on exit 0 (no matches = no file, not an error).
- **emmys:** None — all tools documented above.
