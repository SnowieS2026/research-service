# HEARTBEAT.md — Proactive Monitoring

## Philosophy
**No proactive monitoring.** Infinitara reset directive 2026-03-26: no cron jobs, no automated scanning, no proactive alerts. Tools and pipelines run **only on explicit request**.

## ⚠️ EXCEPTION: Morning Intelligence Report
**Daily Geopolitics Report is ACTIVE** — configured at Infinitara's explicit request (2026-03-27):
- Cron: `0 6 * * *` (6:00 AM GMT, daily)
- Delivers to: Telegram chat 851533398
- Model: `glm-5:cloud` (deep research)
- Content: 35-country morning intelligence report with suppressed/obfuscated stories

## What This Means
- No other periodic health checks
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
- `geo-daily-report` — 6 AM GMT daily (isolated agent, glm-5:cloud) — ACTIVE
