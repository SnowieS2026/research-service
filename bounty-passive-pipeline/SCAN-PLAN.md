# Bounty Program Systematic Assessment Plan

**Objective:** Systematically probe 3 Bugcrowd programs for vulnerabilities using passive + active tooling, one program at a time, without freezes or crashes.

**Programs (in scan order):**
1. CFPB VDP — `consumerfinance.gov` (26 domains)
2. City of Vienna — `wien.gv.at` + health sector (20 domains)
3. Under Armour Corporate — `underarmour.com` internal tools (12 domains)

**Tool versions (all using `spawnTool()` from `tool-spawn.ts` — crash-safe):**
- nuclei v3.7.1 → `nuclei -jsonl -o FILE`
- dalfox → `dalfox url URL --format json -o FILE`
- sqlmap → `sqlmap -m URLFILE --batch --level=1 --risk=1`
- httpx → `httpx -l URLFILE -json -o FILE`
- subfinder → direct stdout → file
- gau → direct stdout → file

**Critical constraint:** All tools use `spawn()` with `stdio:['ignore','pipe','pipe']` — NO `execFileP()`. Timeout kills via `taskkill /F /T /PID` on Windows. No tool stdout/stderr captured through Node's stream machinery.

---

## Phase Architecture

Each program runs through **3 sequential passes** in a single `node dist/src/index.js --once --scan --max-targets N` invocation. Tools within each pass run sequentially via `for...await` loop (NOT `Promise.all()`).

### Pass 1 — Passive Recon + HTTP Discovery
```
subfinder (domain enumeration)
  → outputs to dist/tmp/SUBDOMAINS.txt
  → 5min timeout per domain

gau (URL scraping from CRT logs)
  → outputs to dist/tmp/GAU_URLS.txt
  → 3min timeout per domain

httpx (live server + tech detection)
  → reads dist/tmp/GAU_URLS.txt + SUBDOMAINS.txt
  → outputs to dist/tmp/LIVE_URLS.json
  → 5min timeout, rate-limited 20req/s
```

### Pass 2 — Nuclei Vulnerability Scan
```
nuclei (template-based vuln scan)
  → reads dist/tmp/LIVE_URLS.json
  → templates: http/vulnerabilities/ + http/exposed-panels/ + http/misconfiguration/
  → outputs JSON to dist/tmp/NUCLEI.json
  → 10min timeout per domain
  → taskkill on timeout (Windows)
```

### Pass 3 — Targeted Active Testing
```
dalfox (XSS scanning)
  → reads targets from Pass 2 findings (URLs with params)
  → outputs JSON to dist/tmp/DALFOX.json
  → 5min timeout per target
  → taskkill on timeout

sqlmap (SQLi scanning)
  → reads from dist/tmp/GAU_URLS.txt
  → --level=1 --risk=1 (conservative)
  → outputs to dist/tmp/SQLMAP.json
  → 8min timeout per target
  → taskkill on timeout
```

### Report Generation
```
After all passes complete:
  → dist/src/ReportGenerator.ts aggregates findings
  → JSON + Markdown report → reports/PROGRAM_DATE/
  → Diff against previous snapshot
  → Telegram notification if HIGH/CRITICAL
```

---

## Program 1: Consumer Financial Protection Bureau VDP

**In-scope domains (26):**
```
https://www.consumerfinance.gov/
https://es.consumerfinance.gov/
https://api.cfpb.gov/
https://api.consumerfinance.gov/
https://webservices.cfpb.gov/
https://beta.consumerfinance.gov/
https://beta.cfpb.gov/
https://complaint.consumerfinance.gov/
https://extranet.cfpb.gov/
https://exam.consumerfinance.gov/
https://files.consumerfinance.gov/
https://data.consumerfinance.gov/
https://search.consumerfinance.gov/
https://surveys.consumerfinance.gov/
https://story.consumerfinance.gov/
https://inclusivity.consumerfinance.gov/
https://info.consumerfinance.gov/
https://www.consumerfinancialprotectionbureau.gov/
https://www.mimm.gov/
https://ffiec.cfpb.gov/
https://mobile.cfpb.gov/
https://owa.cfpb.gov/
https://remote.cfpb.gov/
https://work.cfpb.gov/
https://autodiscover.cfpb.gov/
```

**Priority targets (high-value attack surface):**
1. `api.cfpb.gov` / `api.consumerfinance.gov` — REST APIs = SQLi, IDOR, auth bypass
2. `complaint.consumerfinance.gov` — user-submitted forms = XSS, injection
3. `files.consumerfinance.gov` — file upload = RCE, stored XSS
4. `extranet.cfpb.gov` — employee portal = auth flaws, session management
5. `webservices.cfpb.gov` — SOAP/XML endpoints = XXE
6. `search.consumerfinance.gov` — search functionality = XSS, injection

**Scan parameters:**
- `--max-targets 10` (focus on highest-value domains)
- `--timeout-per-target 120` (generous for nuclei)
- Nuclei templates: `http/vulnerabilities/` + `http/exposed-panels/`
- Callback URL: `http://callback.placeholder.local` (for blind XSS — needs ngrok/ collaborator)

**Expected duration:** 45–90 min
**Key risks:** CFPB = government = sensitive. Keep scan conservative (level 1 nuclei, no aggressive SQLi). Stay on-scope only.

---

## Program 2: City of Vienna Managed Bug Bounty

**In-scope domains:**
```
https://www.wien.gv.at/              (main city portal, wildcard *.wien.gv.at)
https://*.wien.gv.at/                (ALL city subdomains)
https://*.magwien.gv.at/             (Vienna magazine/marketing)
https://www.gesundheitsverbund.at/   (Vienna health system)
https://*.gesundheitsverbund.at/     (health sector subdomains)
https://*.wienkav.at/                (city pharmacy/health logistics)
```

**Priority targets:**
1. Wildcard `*.wien.gv.at` — enumerate subdomains, find internal tools, dev/staging environments
2. `gesundheitsverbund.at` — healthcare = high value, HIPAA-equivalent EU regulations
3. `wienkav.at` — pharmaceutical supply chain
4. Login portals, citizen authentication, form submissions on any discovered subdomain

**Scan parameters:**
- `--max-targets 15`
- `--timeout-per-target 120`
- Nuclei templates: full `http/vulnerabilities/` + `http/misconfiguration/` + `http/exposed-panels/`
- Step 1 (subfinder): enumerate `wien.gv.at`, `magwien.gv.at`, `gesundheitsverbund.at`, `wienkav.at`
- Step 2 (gau): scrape URLs from enumerated subdomains
- Step 3 (httpx): identify live servers with tech fingerprints
- Step 4 (nuclei): scan all live endpoints
- Step 5 (dalfox/sqlmap): targeted testing on interesting params

**Expected duration:** 60–120 min (wildcard enumeration takes time)

---

## Program 3: Under Armour Corporate

**In-scope domains (12):**
```
https://apphouse.underarmour.com/     (app developer portal?)
https://ourhouse.underarmour.com/    (employee/internal portal)
https://transfer.underarmour.com/     (file transfer service)
https://vpe-us.underarmour.com/      (VPN/remote access?)
https://snc.underarmour.com/         (supply chain / logistics)
https://snctest-s.underarmour.com/  (staging environment)
```

**Priority targets:**
1. `transfer.underarmour.com` — file transfer portal = file upload vulns, SSRF, path traversal
2. `snc.underarmour.com` / `snctest-s.underarmour.com` — staging = exposed admin panels, debug endpoints, API keys
3. `ourhouse.underarmour.com` — employee portal = auth flaws, XSS, SSO/SAML misconfigs
4. `vpe-us.underarmour.com` — VPN portal = VPN vulns, credential stuffing
5. Any subdomain not immediately accessible — fuzzing recommended

**Scan parameters:**
- `--max-targets 6` (small scope — each target gets more time)
- `--timeout-per-target 180` (more aggressive time for small scope)
- Nuclei templates: `http/vulnerabilities/` + `http/exposed-panels/` + `http/misconfiguration/` + `http/technologies/`
- Focus on: exposed panels on staging, auth bypass on transfer portals, XSS on employee portals
- dalfox with param enumeration on all discovered endpoints with query strings

**Expected duration:** 30–60 min

---

## Finding Severity Classification

| Severity | Criteria |
|----------|----------|
| **CRITICAL** | RCE, SQLi with data exfiltration, auth bypass to admin, pre-auth remote vulns |
| **HIGH** | XSS with session hijacking, SSRF to internal metadata, IDOR with horizontal privilege escalation, XXE |
| **MEDIUM** | Reflected XSS, open redirect, misconfigured CORS, XXS in non-critical endpoints |
| **LOW** | Informational findings, expired certs, trace/debug headers, favicon leaks |
| **INFO** | Technology fingerprinting only, no exploitable finding |

---

## Anti-Crash Checklist (must verify before each run)

- [ ] Build clean: `npm run build` — no TypeScript errors
- [ ] All scanner source files import `spawnTool` from `tool-spawn.ts`
- [ ] No `execFile` or `execFileP` calls remaining in scanner files
- [ ] `tool-spawn.ts` has `taskkill /F /T /PID` timeout handler
- [ ] Pipeline cron is **DISABLED** before starting
- [ ] No stale scanner processes from previous runs
- [ ] Temp output directories exist and are writable
- [ ] Nuclei templates are present at `C:\Users\bryan\.nuclei-templates\http\`

---

## Execution Order

```
┌─────────────────────────────────────────────────────────┐
│  PROGRAM 1: CFPB VDP                                    │
│  npm run build && node dist/src/index.js --once          │
│  --scan --max-targets 10 --platform bugcrowd             │
│  → manual: openclaw cron run 67d75617... (disabled)     │
│  → wait for completion + report                          │
└─────────────────────────────────────────────────────────┘
              ↓ (if no crash, proceed)
┌─────────────────────────────────────────────────────────┐
│  PROGRAM 2: City of Vienna                               │
│  (configure target list: wien.gv.at + health domains)   │
│  → wait for completion + report                          │
└─────────────────────────────────────────────────────────┘
              ↓ (if no crash, proceed)
┌─────────────────────────────────────────────────────────┐
│  PROGRAM 3: Under Armour Corporate                      │
│  (configure target list: underarmour.com internal tools) │
│  → wait for completion + report                         │
└─────────────────────────────────────────────────────────┘
```

---

## Post-Program Checklist

After each program:
- [ ] Verify report generated in `reports/YYYY-MM-DD/`
- [ ] Check for HIGH/CRITICAL findings → report to Telegram
- [ ] No frozen processes: `tasklist | findstr dalfox nuclei sqlmap`
- [ ] Commit scan results + any pipeline fixes
- [ ] Proceed to next program only after clean shutdown confirmed

---

## Scope Notes

- **CFPB** — US government VDP. No aggressive SQLi or RCE attempts. Nuclei + dalfox are safe. Report all findings; government takes VDPs seriously.
- **City of Vienna** — Austrian government + healthcare. Do NOT probe `*.gv.at` aggressively beyond what's listed. Wildcard = large attack surface but stay within scope boundaries.
- **Under Armour** — All targets appear to be internal/corporate tools. `snctest-s.underarmour.com` is explicitly staging — likely less security. Good hunting ground.
