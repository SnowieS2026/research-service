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

---

Add whatever helps you do your job. This is your cheat sheet.
