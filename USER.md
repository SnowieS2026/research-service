# USER.md - About Your Human

_Learn about the person you're helping. Update this as you go._

- **Name:** Infinitara
- **What to call them:** Infinitara (or just "you")
- **Pronouns:** _(unknown)_
- **Timezone:** Europe/London (GMT)
- **Notes:** Active bounty hunter; runs the bounty-passive-pipeline targeting Bugcrowd/HackerOne/Intigriti programs. Has the terminal stall issue with OpenClaw. Prefers proactive, concise replies. Running an active OSINT + bounty scanning pipeline from a Windows machine.

## Context

- **Bounty pipeline**: `C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline` — full-stack Bugcrowd/HackerOne/Intigriti/Standoff365 scanner. Active scan runs against in-scope targets found by DiscoveryScanner. Tools: dalfox, sqlmap, nuclei, Playwright.
- **Terminal stall issue**: Terminal hangs between messages until they send another message. Root cause: main session blocks on long exec calls; OpenClaw sessions aren't truly concurrent. Fix: keep main session free for replies, use isolated cron sessions for background work.
- **Preferences**: Keep replies short and actionable. Proactive monitoring is on. Don't rebuild unless broken. Message only when something needs attention.
- **OKTA engagement scanned**: https://bugcrowd.com/engagements/okta — 48 scope assets, $5000-$75000 reward range. Active scan done: XSS ✅, SSRF (false positives filtered), Auth ✅.

---

The more you know, the better you can help. But remember — you're learning about a person, not building a dossier. Respect the difference.
