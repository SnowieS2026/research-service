# HEARTBEAT.md — Proactive Monitoring

## Philosophy
- Heartbeat fires every ~30 min. Keep each check fast (<30s).
- Batch checks across heartbeats — don't do everything every time.
- Only message the user if something needs their attention.
- Keep the main session free — never block on long operations here.

## State tracking
Read `memory/heartbeat-state.json` to know what was last checked.

## Heartbeat Loop (rotate through these)

### 1. Pipeline Health (every heartbeat)
Quick smoke test — check last snapshot timestamp:
```
logs/snapshots/ — most recent file should be <8h old
```
If oldest snapshot >8h and pipeline cron hasn't run recently → message user.

### 2. New Scan Reports (every 2nd heartbeat)
Check `reports/YYYY-MM-DD/` for new reports since last check.
- Track last checked date in heartbeat-state.json
- If new HIGH/CRITICAL findings → notify user briefly
- If new report but only INFO/LOW → log only, no message

### 3. Git Status (every 3rd heartbeat)
`git status --porcelain` in bounty-passive-pipeline.
- Uncommitted changes → check if intentional (WIP) or should commit
- Commit good work with a brief message

### 4. Memory Maintenance (every 7th heartbeat)
Read today's `memory/YYYY-MM-DD.md`, update MEMORY.md with any new learnings.

## Cron Jobs (background, isolated sessions — not in main)
| Job | Schedule | Purpose |
|-----|----------|---------|
| Bounty passive pipeline | Every 6h | Full scan, notifies on changes |
| Discovery run | Daily 08:00 UTC | Find new programs |
| Nuclei template update | Weekly Sun 03:00 | Update nuclei templates |

## DO in main session heartbeat
- Quick file checks (read logs, check timestamps)
- State tracking updates
- Brief Telegram messages

## DON'T in main session heartbeat
- No long exec calls (>30s)
- No rebuilds unless broken
- No subagent spawning (use isolated sessions for background work)

## If something needs attention
Respond with a short, actionable message. Example:
> "Pipeline hasn't run in 12h — last snapshot was from yesterday. Something may be stuck."
