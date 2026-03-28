# TOOLS.md — Complete Inventory

_Last updated: 2026-03-28_

---

## Critical Rules

### Path Rule
**Never use `~` in file paths with the edit/write tools on Windows.** The edit tool does NOT expand `~` to the user home directory. Always use full absolute Windows paths (e.g. `C:\Users\bryan\...`).

### Memory Rules
- **MEMORY.md** — read in main session only (contains personal context for Infinitara and Shell)
- **memory/YYYY-MM-DD.md** — daily logs; append only
- **Vector store** — Chroma + Ollama nomic-embed-text; semantic search via `memory_search` tool falls back to file search if unavailable

---

## Environment Summary

| Component | Status | Location |
|-----------|--------|----------|
| **OpenClaw** | Running | `C:\Users\bryan\AppData\Roaming\npm\node_modules\openclaw` |
| **Workspace** | `C:\Users\bryan\.openclaw\workspace` | |
| **Config** | `C:\openclaw-local\openclaw.json` | |
| **Gateway** | loopback only (no remote) | `http://localhost:18789` |

---

## OpenClaw Skills (npm global)

Located at `C:\Users\bryan\AppData\Roaming\npm\node_modules\openclaw\skills\`. Loaded automatically.

| Skill | When to use |
|-------|-------------|
| `coding-agent` | Delegate coding to Codex/Claude Code via background process |
| `gh-issues` | GitHub issues, PRs, CI runs, code review |
| `github` | gh CLI operations, repo management |
| `healthcheck` | Host security hardening, SSH/firewall audit |
| `node-connect` | OpenClaw mobile app pairing failures |
| `openai-whisper-api` | Audio transcription via OpenAI Whisper API |
| `skill-creator` | Create/edit/audit AgentSkills |
| `weather` | Current weather + forecasts via wttr.in / Open-Metee |

**Workspace skills** at `C:\Users\bryan\.openclaw\workspace\skills\` (not npm global):

| Skill | When to use | Location |
|-------|-------------|----------|
| `research-service` | Full research pipeline: SearxNG → scrape → structured report | `skills/research-service/` |
| `web-browser` | Fast web search + content extraction via SearxNG | `skills/web-browser/` |

---

## Ollama Models (Ollama Connect)

**Config:** `C:\openclaw-local\openclaw.json` — all models use `:cloud` suffix (Ollama Connect)

**Provider:** `ollama` at `http://127.0.0.1:11434`

| Model | Role | Reasoning |
|-------|------|----------|
| `minimax-m2.7:cloud` | Primary / default — reasoning, general conversation | Yes |
| `minimax-m2.5:cloud` | Secondary general | Yes |
| `glm-5:cloud` | Deep research — reports, Prismal newsletter, daily geo | No |
| `glm-4.6:cloud` | Secondary research | No |
| `nemotron-3-nano:30b-cloud` | Fast concurrent operations | No |
| `devstral-small-2:24b-cloud` | Light coding, quick scripts | No |
| `qwen3-coder-next:cloud` | Code writing, debugging, refactoring | No |
| `kimi-k2.5:cloud` | Research, memory/search | No |

**Note:** `qwen3.5:cloud` is used for flipping valuations (Vinted/eBay) but is NOT in the config — run it directly via `ollama run qwen3.5` when needed.

---

## Docker Containers

| Container | Status | Purpose | Port |
|-----------|--------|---------|------|
| `chroma` | Running | Vector store (Chroma v3.x) | 8000 |
| `searxng` | Running | Privacy-respecting search engine | 8080 |

**Start commands:**
```powershell
# Chroma vector store
docker run -d --name chroma -p 8000:8000 -v ./bounty-passive-pipeline/logs/vectorstore:/data chromadb/chroma:latest

# SearxNG search
docker run -d --name searxng -p 8080:8080 -v searxng:/etc/searxng --restart unless-stopped searxng/searxng:latest
```

**Stop:** `docker stop searxng` / `docker stop chroma`

**Public SearxNG fallbacks:** searx.party / searx.mw.io / searx.work / searxng.site

**Valkey** (internal SearxNG dependency): running on port 53007

---

## Python Environment

**Python:** v3.x, managed via pip

**Key packages installed:**

| Package | Purpose |
|---------|---------|
| `requests`, `httpx`, `aiohttp` | HTTP clients |
| `beautifulsoup4`, `lxml`, `html5lib` | HTML parsing |
| `playwright` | Browser automation (Windows-compatible) |
| `selenium` | Legacy browser automation |
| `sqlmap` | SQL injection detection |
| `pwntools` | CTF/exploit dev |
| `ghunt`, `maigret`, `holehe`, `sherlock` | OSINT / username enumeration |
| `pymisp`, `censys`, `greynoise`, `shodan` | Threat intel |
| `OTXv2`, `threatminer`, `pysafebrowsing` | Threat intel |
| `ipython` | Enhanced Python shell |
| `python-nmap` | Nmap wrapper |
| `paramiko` | SSH |
| `discord.py` | Discord bot |
| `Telethon` | Telegram bot (MTProto) |
| `tweepy` | Twitter/X API |
| `PyGithub` | GitHub API |
| `fastapi`, `flask`, `uvicorn` | Web frameworks |
| `jinja2` | Template engine |
| `pydantic` | Data validation |
| `pdfminer.six`, `pdfplumber`, `pypdf` | PDF parsing |
| `Pillow` | Image processing |
| `numpy`, `scipy` | Numerical computing |
| `matplotlib` | Plotting |
| `phonenumbers` | Phone number parsing |
| `tldextract` | URL parsing |
| `colorama` | Coloured terminal output |
| `tqdm` | Progress bars |
| `rich` | Rich terminal output |
| `pyyaml` | YAML parsing |
| `cryptography` | Crypto operations |
| `bcrypt`, `paramiko` | Auth |
| `passivetotal`, `securitytrails`, `zetalytics` | Brand/infra intel |

---

## Node.js / npm Environment

**Node:** v22.22.0

**Global packages:**
- `openclaw` — main framework
- `typescript`, `tsx`, `ts-node` — TypeScript runtime

**Local workspaces:**

| Project | Dependencies |
|---------|-------------|
| `bounty-passive-pipeline/` | `better-sqlite3`, `chromadb`, `@playwright/test`, `tsx`, `typescript`, `cross-env` |
| `prismal-pipeline/` | `better-sqlite3`, `tsx`, `typescript` |

---

## Pipeline: Bounty Passive Scanner

**Location:** `C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline`

**Stack:** TypeScript, Playwright, dalfox, sqlmap, nuclei, gau, subfinder, gitleaks

**Status:** PAUSED — all crons disabled 2026-03-25

**Entry:** `npm run build && npm run agents` (all agents) or `node dist/src/agents/run.js <agent>` (single)

**Agents:**
- `CoordinatorAgent` — orchestrates the pipeline
- `DiscoveryAgent` — finds targets and assets
- `BrowserAgent` — Playwright browser automation, session management
- `ScannerAgent` — runs nuclei, dalfox, sqlmap, httpx, subfinder, gitleaks
- `ReporterAgent` — compiles findings into reports
- `RepairAgent` — self-heals broken tool executions
- `AdaptationAgent` — ML-driven tool strategy per program (scores in `logs/agent-state/adaptation-store.json`)

**Source modules:**
- `src/agents/` — agent classes
- `src/browser/` — Playwright + auth (EditThisCookie → storageState)
- `src/scanner/` — individual scanner wrappers (NucleiScanner, SqlmapScanner, DalfoxScanner, GauScanner, HttpxScanner, SubfinderScanner, GitleaksScanner, XSSScanner, SSRFScanner, AuthScanner, ApiScanner, DiscoveryScanner, ParallelScanner)
- `src/storage/` — SQLite article store + scan results
- `src/diff/` — change detection
- `src/osint/` — vehicle OSINT

**Sessions:** `logs/browser-sessions/<platform>-state.json`
- Bugcrowd: user SnowieS
- Intigriti + HackerOne: user humbles

**Credentials:** EditThisCookie-exported browser session files

**Nuclei templates:** `nuclei-templates/` (git submodule)

---

## Pipeline: Prismal Newsletter

**Location:** `C:\Users\bryan\.openclaw\workspace\prismal-pipeline`

**Model:** `glm-5:cloud` (deep research, 16k token output via `num_predict`)

**Daily cron:** `prismal-daily` — `0 1 * * 1-5` (1 AM GMT Mon-Fri)

**Weekly cron:** `prismal-weekly` — `0 1 * * 0` (1 AM GMT Sundays)

**Source files:**
- `src/index.ts` — pipeline entry + query sets (51 queries daily + weekly)
- `src/writer.ts` — article pairing (SOURCE A/B blocks), Ollama API calls
- `src/platform-formatters.ts` — Substack, BeeHiiv, X, X Thread, TikTok formatters
- `src/dashboard.ts` — newsletter parser, multi-platform dashboard generator
- `src/beehiiv.ts` — BeeHiiv API integration
- `src/scraper.ts` — Python readability extraction (URL via temp file)
- `src/search.ts` — multi-engine search (SearxNG → Wikipedia → DuckDuckGo)
- `src/analyser.ts` — article analysis
- `src/compiler.ts` / `compiler-daily.ts` / `compiler-weekly.ts` — newsletter assembly
- `src/branding.ts` — PRISMAL masthead, beat emojis, tagline
- `src/article-store.ts` — SQLite article storage
- `agents/writer-agent.md` — Tom Clancy briefing tone, inline [OutletName] citations, paraphrase-only rules
- `fix-encoding.py` — strips Chinese character artifacts from model output

**Issue lock files:**
- `reports/.issue-lock` — daily issue counter
- `reports/.issue-lock-weekly` — weekly issue counter

**Dashboard generation (not wired to CLI):**
```powershell
node -e "const{generateDashboard}=require('./dist/dashboard.js');generateDashboard('reports/daily/YYYY-MM-DD.md','reports/distribution',N)"
```

**BeeHiiv credentials:** `C:\Users\bryan\.openclaw\workspace\credentials\beehiiving-platforms.json`
- API Key: `WfncsNDfviwghnWPHYpVP7x6wd1CMXOK4kSKWlKIPDEu97nUueWVQHsWuMyWxwKY`
- Publication ID: `pub_7e46fcb0-239b-4079-ada4-78bb13137de0`

---

## Pipeline: Geopolitical Intelligence

**Location:** `geopolitics/`

**Daily report cron:** `geo-daily-report` — `0 6 * * *` (6 AM GMT daily)

**Structure:**
- `countries/<Country>/profile.md` — country profile (regime, military, economy, key people)
- `countries/<Country>/news-30days.md` — recent news synthesis (35 countries)
- `queue/suppressed.json` — underreported story queue
- `queue/contradictions.json` — contradictory narratives across sources
- `queue/patterns.json` — recurring intelligence patterns
- `geo-coordinator-prompt.md` — coordinator agent prompt
- `geo-daily-report-prompt.md` — daily report generation prompt
- `scrape-article.py` — standalone Python article scraper

---

## OSINT Tools

### Vehicle OSINT
**Location:** `tools/vehicle-osint.py` + `tools/vehicle-osint.exe` (PyInstaller build)

**Capabilities:** UK DVLA, car-checking.com, NHTSA (US)

**Usage:**
```
python C:\Users\bryan\.openclaw\workspace\tools\vehicle-osint.py --reg AB12XYZ
python C:\Users\bryan\.openclaw\workspace\tools\vehicle-osint.py --vin 1HGBH41JXMN109186
```

### Research Tool
**Location:** `tools/research-tool/research.py`

**Prerequisites:** `pip install requests beautifulsoup4 lxml`

**Usage:**
```
python C:\Users\bryan\.openclaw\workspace\tools\research-tool\research.py \
  --topic "..." --goal "..." --tier standard --output "reports/my-report.md"
```

**Tiers:** `kickstart` / `standard` / `deep`

### Username OSINT
`sherlock`, `maigret`, `holehe` — username enumeration across platforms

### Threat Intel
`ghunt` — OSINT on Google accounts, OAuth tokens
`pymisp` — MISP threat intel platform client
`greynoise` — internet noise scanner
`censys` — internet asset discovery
`shodan` — device/shodan search
`securitytrails`, `passivetotal`, `zetalytics` — DNS/infra intel

---

## Credentials Store

**Location:** `credentials/`

**Files:**
- `beehiiving-platforms.json` — BeeHiiv API key + publication ID

**Format:** JSON, NOT committed to git

---

## Known Issues

| Issue | Workaround |
|-------|-----------|
| **Terminal stall** — main session blocks on long exec calls | Use isolated subagent sessions for background work |
| **Playwright on Windows** — pkg snapshot corrupts Chromium | Use `executablePath` for system Chrome |
| **gau default fails silently** | Always use `--providers wayback,commoncrawl,otx,urlscan` |
| **nuclei json-export creates output file only on exit 0** | No matches = no file, not an error — check file existence before reading |
| **qwen3.5:cloud not in config** | Run directly via `ollama run qwen3.5` for flipping valuations |
| **memory_search routing** — was hitting OpenAI instead of Ollama | Config `agents.defaults.memorySearch` now routes through Ollama nomic-embed-text |

---

_Last updated: 2026-03-28_
