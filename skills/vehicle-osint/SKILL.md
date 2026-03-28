# Vehicle OSINT Skill

## Trigger phrases
- "vehicle OSINT", "car OSINT", "DVLA check", "MOT check", "vehicle lookup", "vehicle report"
- Any UK registration plate (e.g. "VK06ZWJ", "GMZ2745") or VIN query
- "run osint on" + plate

## What this skill does
Runs the full vehicle OSINT pipeline: DVLA specs, MOT history, risk analysis, mileage intelligence, valuations, and insurance data across multiple UK data sources.

## Pipeline entry point
```
cd C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline
python vehicle-osint.py [PLATE] [--reg PLATE]
```
Output: `reports/osint/YYYY-MM-DD/vehicle-PLATE-full.md`

## Report format
14-section emoji report (all sections populated when sources cooperate):
1. Vehicle Header Card
2. Vehicle Status
3. MOT History Intelligence (18-entry table)
4. Risk Indicators
5. Mileage Intelligence Analysis
6. Market Intelligence
7. Insurance Risk Indicators
8. Geographic Intelligence
9. Mechanical Intelligence Indicators
10. Ownership Intelligence
11. Risk Flags
12. OSINT Confidence Score
13. Analyst Summary
14. Overall OSINT Risk Rating

## Source stack

### car-checking.com (primary -- FULL specs + MOT history)
- Uses Playwright with system Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`)
- Anti-detection args: `--disable-blink-features=AutomationControlled`, `addInitScript` patching `navigator.webdriver`
- Status: BLOCKED by Cloudflare in headless mode. Works in real browser only.
- Alternative: use OpenClaw browser session to navigate manually.

### gov.uk DVLA vehicle enquiry (colour, tax, VIN, first reg)
- cloudscraper POST first (no Cloudflare on gov.uk)
- Playwright fallback with anti-detection
- Often blocked -- try cloudscraper approach or real browser session

### check-mot-history.co.uk (MOT history timeline)
- cloudscraper GET (no Cloudflare on GET requests for this domain)
- Returns full 18-entry MOT timeline with advisories
- Fallback: data.gov.uk MOT API (free, no auth)

### data.gov.uk MOT API
- Endpoint: `https://data.gov.uk/data/api/pre_release/mot/vehicle?q={PLATE}`
- Free, no authentication
- Returns MOT history as JSON

### Additional sources (in `VehicleCollector.ts`)
- `collectParkers()` -- valuation
- `collectMotorCheck()` -- HPI-style check
- `collectMIB()` -- insurance/bureau
- `collectMotors()` -- market data

## Open issues / Known blockers
- **car-checking.com**: Cloudflare blocks headless Playwright. Workaround: use OpenClaw browser session (real desktop Chrome profile) to manually navigate and extract data.
- **check-mot-history.co.uk**: Returns HTTP 202 (JS challenge in progress) via cloudscraper -- real browser required. Workaround: OpenClaw browser session.
- **DVSA MOT API**: Requires API key not present in config.

## Architecture
- `vehicle-osint.py` -- Python CLI, threading-based multi-source collector
- `src/osint/collectors/VehicleCollector.ts` -- TypeScript collector (all sub-collectors)
- `src/osint/index.ts` -- pipeline index, flattens rawData so sources are top-level keys
- `src/osint/report.ts` -- 14-section emoji report generator
- `src/osint/types.ts` -- shared types (CollectorResult etc.)

## Data storage
- Reports: `bounty-passive-pipeline/reports/osint/YYYY-MM-DD/vehicle-PLATE*.md`
- rawData: `bounty-passive-pipeline/logs/osint/raw-PLATE.json`
- Browser sessions: `bounty-passive-pipeline/logs/browser-sessions/`

## Running without internet dependency (manual fallback)
If all automated sources fail, use OpenClaw browser session:
1. `browser(action="open", url="https://www.check-mot-history.co.uk/vehicle/{PLATE}")`
2. Wait 8s for JS render
3. `browser(action="snapshot")` -- extract vehicle details and MOT history manually
4. Build report manually or feed into `build-vk06-report.py` pattern
