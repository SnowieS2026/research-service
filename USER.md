# USER.md - About Your Human

_Learn about the person you're helping. Update this as you go._

- **Name:** Infinitara
- **What to call them:** Infinitara (or just "you")
- **Pronouns:** _(unknown)_
- **Timezone:** Europe/London (GMT)
- **Notes:** Active bounty hunter; runs the bounty-passive-pipeline targeting Bugcrowd/HackerOne/Intigriti/Standoff365 programs. Has the terminal stall issue with OpenClaw. Prefers proactive, concise replies. Running an active OSINT + bounty scanning pipeline from a Windows machine. **Bounty hunting is currently PAUSED.** Flipping is ACTIVE (2026-03-27) — using qwen3.5:cloud for valuations. **X/Twitter posting is READY** — needs Access Token + Secret to activate.

## Bounty Pipeline Status

**Pipeline:** `C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline` - full-stack scanner using dalfox, sqlmap, nuclei, Playwright.

**Active sessions (all VALID):**
- **Bugcrowd** - `logs/browser-sessions/bugcrowd-state.json` - user: SnowieS
- **Intigriti** - `logs/browser-sessions/intigriti-state.json` - user: humbles
- **HackerOne** - `logs/browser-sessions/hackerone-state.json` - user: humbles

**Programs with live scope:**
| Program | Platform | Status | Earnings |
|---------|----------|--------|----------|
| Superhuman (formerly Grammarly) | HackerOne | Active | $500+ (Chrome extension) |
| Capital.com | Intigriti | Accepted | EUR1000 (HIGH) |
| Cribl VDP | Bugcrowd | Accepted | - |
| Cisco Meraki | Bugcrowd | Accepted | - |

**Key findings (all clean so far):**
- Superhuman: Open redirect LOW (app.grammarly.com), internal config leak INFO (staging.coda.io)
- Capital.com: api-website.capital.com analytics endpoint (202), no exploitable vulns found
- All Nuclei scans: clean across all accessible targets

**Accessible targets found:**
- app.grammarly.com (no WAF)
- api-website.capital.com (no WAF, JSON API)
- id.superhuman.com, settings.superhuman.com (no WAF)
- coda.io, staging.coda.io, admin.coda.io (no WAF)

**Crons:** All bounty crons DISABLED. Pipeline can be re-enabled on request.

**Model assignments (2026-03-26, updated 2026-03-27):** See `MEMORY.md` - 9 cloud models registered (all `:cloud` suffix, Ollama Connect). minimax-m2.7:cloud is main/default. Coding: `qwen3-coder-next:cloud`, research: `glm-5:cloud`, flipping: `qwen3.5:cloud`, fast: `nemotron-3-nano:cloud`.

## Context

- **Terminal stall issue**: Terminal hangs between messages until they send another message. Root cause: main session blocks on long exec calls; OpenClaw sessions aren't truly concurrent. Fix: keep main session free for replies, use isolated cron sessions for background work.
- **Preferences**: Keep replies short and actionable. Message only when something needs attention.
- **Edit failures**: Never use `~` in file paths - use full absolute paths. The edit tool fails with `File not found` when `~` isn't resolved.
- **Vector store**: Chroma (Docker, port 8000) + Ollama nomic-embed-text. Collections: `pipeline_findings`, `agent_memory`. Scripts: `sync-memory.ts` + `ingest-pipeline.ts`.

---

The more you know, the better you can help. But remember - you're learning about a person, not building a dossier. Respect the difference.
