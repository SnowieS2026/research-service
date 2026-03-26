# HEARTBEAT.md — Proactive Monitoring

## Philosophy
**No proactive monitoring.** Infinitara reset directive 2026-03-26: no cron jobs, no automated scanning, no proactive alerts. Tools and pipelines run **only on explicit request**.

## What This Means
- No periodic health checks
- No bounty pipeline crons
- No auto-ingest on heartbeat
- No session startup queries (unless manually triggered)
- Respond only when Infinitara explicitly asks for something

## Tools Available On Request
- `mexc_prices.py` — MEXC crypto prices
- `vehicle-osint.js` — UK vehicle OSINT
- `bounty-passive-pipeline` — bug bounty scanning (not currently running)
- Vector memory search — semantic search across all historical context

## Cron Jobs
**None.** All crons were removed on 2026-03-26 01:03 UTC.
