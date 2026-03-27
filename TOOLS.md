# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

### X (Twitter) Integration — @InfinitaraReal
**Handle:** @InfinitaraReal (non-premium, 260 char limit)

**App-Only Token (Bearer):**
```
AAAAAAAAAAAAAAAAFFFFRygEAAAAAa9aASazSspXNn0%2FtnyaQfSufrF0%3Dvn2KSpAhBVZ46YQhTr0rFNvY8XcSeeNK7UnmRjq7tHihmkWpoG
```

**OAuth 1.0a:**
- Consumer Key: `EyLjlwhrNOAmSEjX6fYjEJS1K`
- Consumer Key Secret: `WCrFZs9PyHBWPUiXZ3xjxezNKiyNNlJfluBJhrj1pRNpFIYkZP`

**OAuth 2.0 (PKCE):**
- Client ID: `ckU4dkU5Y3NlXzc4VnUyVFl2RXU6MTpjaQ`
- Client Secret: `waxKcSoRg2bP7gLVH65D-w7RdgcGFc--sMqFRAk1sBFDOvTP9R`

**Note:** For posting, OAuth 1.0a is used (no callback URL needed for standalone posting). Store access token + secret alongside consumer keys in the credential set above when obtained.

---

### ⚠️ Edit Tool — Path Rule
**Never use `~` in file paths with the edit/write tools on Windows.** The edit tool does NOT expand `~` to the user home directory — it passes it literally and fails with "File not found." Always use full absolute Windows paths (e.g. `C:\Users\bryan\...`).

### Research Service

- **Research tool:** `tools/research-tool/research.py` — TypeScript + Python pipeline
  - Input: `--topic`, `--goal`, `--tier` (kickstart/standard/deep), `--output`
  - Runs: SearxNG search → content scrape → structured markdown report
  - Usage: `python C:\Users\bryan\.openclaw\workspace\tools\research-tool\research.py --topic "..." --goal "..." --tier standard --output "reports/my-report.md"`
  - Prerequisites: `pip install requests beautifulsoup4 lxml`
  - SearxNG: same instances as OSINT below

### OSINT (bounty-passive-pipeline)

- **SearxNG**: `http://localhost:8080`
  - Start: `docker run -d --name searxng -p 8080:8080 -v searxng:/etc/searxng --restart unless-stopped searxng/searxng:latest`
  - Stop: `docker stop searxng`
  - Config env: `SEARXNG_URL=http://localhost:8080`
  - The pipeline falls back to public instances (searx.party, searx.mw.io, searx.work, searxng.site) if local is unavailable

### Vector Store (Chroma + Ollama)
- **Chroma server**: `http://localhost:8000` (Docker, chromadb v3.x)
  - Start: `docker-compose up -d` from workspace root
  - Or: `docker run -d --name chroma -p 8000:8000 -v ./bounty-passive-pipeline/logs/vectorstore:/data chromadb/chroma:latest`
  - API: REST v2 at `/api/v2/tenants/default_tenant/databases/default_database/collections/{uuid}/*`
  - Collections: `agent_memory` + `pipeline_findings` (real UUIDs from Chroma, cached at startup)
- **Ollama model**: `nomic-embed-text` (137M params, ~274MB, F16)
  - Pull: `ollama pull nomic-embed-text`
- **Vector store library**: `bounty-passive-pipeline/src/vector-store.ts`
  - Direct REST API client (no chromadb Node SDK — SDK uses deprecated v1 API)
  - Ollama embed endpoint: `POST http://localhost:11434/api/embeddings`
- **Scripts**:
  - `bounty-passive-pipeline/session-startup.ts` — run at session start (wired into AGENTS.md step 5)
  - `bounty-passive-pipeline/auto-ingest.ts` — incremental sync, skips unchanged files (cursor at `logs/vectorstore/.sync-cursor.json`)
  - `bounty-passive-pipeline/sync-memory.ts` — full re-ingest all memory files
  - `bounty-passive-pipeline/ingest-pipeline.ts` — ingest pipeline outputs (snapshots, scans, reports)
- **Startup flow**: `session-startup.ts` → auto-ingest → vector store primed → session context enriched
- **Heartbeat flow**: `auto-ingest.ts` runs every ~3 heartbeats to pick up changed files