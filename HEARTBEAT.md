# HEARTBEAT.md — Proactive Monitoring

## Philosophy
- Heartbeat fires every ~30 min. Keep each check fast (<30s).
- Batch checks across heartbeats — don't do everything every time.
- Only message the user if something needs their attention.
- Keep the main session free — never block on long operations here.

## State tracking
Read `memory/heartbeat-state.json` to know what was last checked.

## Heartbeat Loop (rotate through these)

### 1. Git Status (every 3rd heartbeat)
`git status --porcelain` in workspace.
- Uncommitted changes → check if intentional (WIP) or should commit
- Commit good work with a brief message

### 2. Memory Maintenance (every 7th heartbeat)
- Read today's `memory/YYYY-MM-DD.md`, update MEMORY.md with any new learnings.
- Check if new memory/research files exist that aren't yet in the vector store.
- If vector store is accessible, query it for relevant context instead of reading all files.

### 3. Pipeline Health (if bounty hunting re-enabled)
Quick smoke test — check last snapshot timestamp:
```
logs/snapshots/ — most recent file should be <8h old
```
If oldest snapshot >8h and pipeline cron hasn't run recently → message user.

## Cron Jobs
| Job | Schedule | Purpose | Status |
|-----|----------|---------|--------|
| Bounty passive pipeline | Every 6h | Full scan, notifies on changes | **DISABLED** |
| Daily discovery | Daily 08:00 UTC | Find new programs with accessible targets | **DISABLED** |
| Weekly nuclei templates | Sundays 03:00 UTC | Update nuclei templates | Active (but delivery broken) |

## Vector Store
- **Chroma**: `http://localhost:8000` (Docker) — run `docker-compose up -d` if down
- **Collections**: `pipeline_findings` + `agent_memory`
- **Sync scripts**: `sync-memory.ts` (agent), `ingest-pipeline.ts` (pipeline)
- See TOOLS.md for full details.

## DO in main session heartbeat
- Quick file checks (read logs, check timestamps)
- State tracking updates
- Brief Telegram messages

## DON'T in main session heartbeat
- No long exec calls (>30s)
- No rebuilds unless broken
- No subagent spawning (use isolated sessions for background work)

## If something needs attention
Respond with a short, actionable message.
