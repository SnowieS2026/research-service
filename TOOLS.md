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

### OSINT (bounty-passive-pipeline)

- **SearxNG**: `http://localhost:8080`
  - Start: `docker run -d --name searxng -p 8080:8080 -v searxng:/etc/searxng --restart unless-stopped searxng/searxng:latest`
  - Stop: `docker stop searxng`
  - Config env: `SEARXNG_URL=http://localhost:8080`
  - The pipeline falls back to public instances (searx.party, searx.mw.io, searx.work, searxng.site) if local is unavailable

### Vector Store (Chroma + Ollama)

- **Chroma server**: `http://localhost:8000` (Docker)
  - Start: `docker-compose up -d` from workspace root (uses docker-compose.yml)
  - Or: `docker run -d --name chroma -p 8000:8000 -v ./bounty-passive-pipeline/logs/vectorstore:/data chromadb/chroma:latest`
  - Persisted to: `bounty-passive-pipeline/logs/vectorstore/`
- **Ollama model**: `nomic-embed-text` (137M params, ~274MB)
  - Pull: `ollama pull nomic-embed-text`
- **Vector store scripts**:
  - `bounty-passive-pipeline/src/vector-store.ts` — core library (add/query/peek/count)
  - `bounty-passive-pipeline/sync-memory.ts` — sync agent memory → vector DB
  - `bounty-passive-pipeline/ingest-pipeline.ts` — sync pipeline outputs → vector DB
- **Two collections**:
  - `pipeline_findings` — snapshots, reports, scan results, discovery logs
  - `agent_memory` — daily memory logs, USER.md, MEMORY.md, HEARTBEAT.md, research docs
- **Usage**:
  ```
  npx tsx sync-memory.ts              # sync agent memory (one-time bulk load)
  npx tsx ingest-pipeline.ts          # ingest all pipeline outputs
  npx tsx ingest-pipeline.ts scanner  # ingest scan results only
  ```
- **Auto-chunking**: docs >4000 chars split into overlapping chunks for embedding
- **Embedding**: Ollama REST API → nomic-embed-text → 768-dim vectors

---

Add whatever helps you do your job. This is your cheat sheet.
