# Research Service Skill

_Research-as-a-service delivery skill for Bryan Research._

## Overview

When Bryan receives a research enquiry, I own the full pipeline from brief → research → structured report.

**Prerequisites before first use:**
- SearxNG running at `http://localhost:8080` (or config env updated)
- Python 3.11+ with `requests`, `beautifulsoup4`, `playwright` installed
- Chroma + Ollama for vector memory (optional, for context)

---

## Research Brief Format

Every enquiry gets converted to this structure before research starts:

```
Topic:        [what to research]
Goal:         [why they need it — product launch, competitor analysis, market sizing, etc.]
Tier:         [Kickstart | Standard | Deep Dive]
Budget:       £[amount]
Deadline:     [when they need it]
Sources:      [any specific sources or platforms they mentioned]
Geography:    [UK / US / Global / specific]
Scope notes:  [anything they ruled out or confirmed already]
```

If any field is missing from the form submission, ask Bryan to fill the gap before starting.

---

## Tier Selection Guide

| Tier | Price | Depth | Sources | Turnaround |
|------|-------|-------|---------|-----------|
| Kickstart | £35 | Single question, 500-word synthesis | 3–5 | 24h |
| Standard | £95 | Full brief, structured report | 5–10 | 24–48h |
| Deep Dive | £195 | Industry vertical, recommendations | 15+ | up to 1 week |

Use the form submission budget field to select the tier. If the scope is ambiguous, default to Standard and flag to Bryan if Deep Dive feels more appropriate.

---

## Running Research

### Step 1 — Validate the brief
Check the brief against what's actually researchable:
- ✅ Public web data, forums, reviews, news, public reports, social media sentiment
- ❌ Private databases, individual contact details, legal/classified info, predictive claims without sourcing

If the request is unclear or ambiguous: use Template 2 (Scope Check) to get clarification before starting.

### Step 2 — Run the research tool

```bash
python C:\Users\bryan\.openclaw\workspace\tools\research-tool\research.py --topic "[topic]" --goal "[goal]" --tier "[tier]" --output "C:\Users\bryan\.openclaw\workspace\research-service\reports\[slug].md"
```

Arguments:
- `--topic` **(required)** — the research subject
- `--goal` **(optional)** — the end goal or question being answered
- `--tier` **(required)** — `kickstart`, `standard`, or `deep`
- `--max-results` — max search results per query (default: tier-dependent: kickstart=10, standard=20, deep=40)
- `--output` **(required)** — full path to output .md file

The tool:
1. Generates search queries from topic + goal
2. Executes searches via SearxNG (with public fallback instances)
3. Deduplicates and filters results
4. Scrapes top results for content
5. Synthesises findings into structured markdown

### Step 3 — Review output
- Check the report for accuracy and gaps
- Add Bryan-specific context or framing if needed
- Verify the tier matches what was promised

### Step 4 — Deliver
- Confirm with Bryan that the report is ready
- Use Template 4 (Proposal) if scope confirmation still needed before delivery
- Send the .md file to the client via email or LinkedIn DM

---

## Output Format

All reports follow this structure:

```markdown
# [Topic] — Research Report

**Tier:** [Kickstart | Standard | Deep Dive]
**Date:** YYYY-MM-DD
**Goal:** [original goal]

---

## Executive Summary
[2-3 sentence answer to the core question]

## Key Findings
[numbered findings, most important first]

## Detail
[structured breakdown by theme or source]

## Sources
[numbered list of all sources cited, with URLs]

## Limitations
[what wasn't covered, why, and what would improve it]
```

---

## Tools & Config

**Research tool path:** `C:\Users\bryan\.openclaw\workspace\tools\research-tool\research.py`

**SearxNG:**
- Primary: `http://localhost:8080`
- Fallbacks: `http://searx.party`, `http://searx.mw.io`, `http://searx.work`, `http://searxng.site`
- Tool auto-rotates fallbacks on connection failure

**Python deps:** `requests`, `beautifulsoup4`, `lxml`
- Install: `pip install requests beautifulsoup4 lxml`
- Playwright (optional, for JS-rendered pages): `pip install playwright && playwright install chromium`

**Reports output dir:** `C:\Users\bryan\.openclaw\workspace\research-service\reports\`

---

## Google Form

**Intake form:** [BRYAN_TO_INSERT_GOOGLE_FORM_LINK]

Share this link in all template responses where [GOOGLE_FORM_LINK] appears.

---

## Response Templates

All templates live in `C:\Users\bryan\.openclaw\workspace\research-service\response-templates.md`.

Key placeholders to replace before sending:
- `[NAME]` — client's first name
- `[GOOGLE_FORM_LINK]` — intake form URL
- `[TOPIC]` / `[GOAL]` / `[TIER]` / `[AMOUNT]` / `[TIMEFRAME]` — from the brief
- `[DELIVERABLES]` — specific outputs for this engagement

---

## Example Workflow

1. Client submits form: "UK EV charging market — who are the main competitors?"
2. Bryan forwards brief to me via Telegram
3. I run: `python tools/research-tool/research.py --topic "UK EV charging market competitors" --goal "Evaluate market landscape before product launch" --tier standard --output "reports/ev-charging-competitors-2026-03-27.md"`
4. I review, minor edits
5. Bryan sends to client

---

_Last updated: 2026-03-26_
