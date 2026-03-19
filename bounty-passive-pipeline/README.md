# Bounty Passive Pipeline

A read-only, browser-only bug bounty metadata collector.
No API keys. No active testing. No third-party target interaction.
All collection is done via a headless browser fetching official platform pages only.

## Project Structure

```
bounty-passive-pipeline/
├─ src/
│   ├─ allowlist.ts
│   ├─ Logger.ts
│   ├─ BrowserTool.ts
│   ├─ browser/
│   │   ├─ MetadataBrowser.ts
│   │   ├─ core/
│   │   │   └─ TextExtractor.ts
│   │   └─ parsers/
│   │       ├─ BaseParser.ts
│   │       ├─ BugcrowdParser.ts
│   │       └─ index.ts
│   ├─ diff/
│   │   └─ ProgramDiffer.ts
│   └─ storage/
│       └─ SnapshotManager.ts
├─ tests/
│   ├─ browser.test.ts
│   ├─ bugcrowd.parser.test.ts
│   └─ diff.test.ts
├─ fixtures/
│   └─ html/
│       ├─ bugcrowd-v1.html
│       ├─ bugcrowd-v2.html
│       ├─ bugcrowd-js.html
│       └─ malformed.html
├─ package.json
├─ tsconfig.json
└─ README.md
```

## Install

```bash
npm install
npx playwright install
```

## Build

```bash
npm run build
```

## Run Tests

```bash
npm test
```

Tests use only local HTML fixtures. No live network calls are made.

## Architecture

- **MetadataBrowser** – headless Playwright browser with allowlist enforcement and snapshot capture.
- **TextExtractor** – extracts text from the DOM via CSS selectors.
- **BugcrowdParser** – parses Bugcrowd program pages into normalized metadata.
- **SnapshotManager** – stores snapshots with deterministic SHA-256 hashes.
- **ProgramDiffer** – compares two snapshots and returns added/removed fields.
- **BrowserTool** – orchestrates browser → parser → snapshot → diff.

## Safety Constraints

- Read-only only. No form submissions, no active probes.
- Allowlist restricts navigation to: bugcrowd.com, hackerone.com, intigriti.com, standoff365.com.
- No credentials stored anywhere.
- No live site access required for tests.
