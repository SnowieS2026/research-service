# Promising Bug Bounty Programs - Accessible Attack Surface

**Research Date:** 2026-03-25  
**Goal:** Find programs where automated scanners can actually reach real vulnerabilities (not buried behind heavy WAF/cloud protection)

---

## Top 5 Recommendations

### 1. 🚀 Capital.com — Intigriti
**Platform:** Intigriti | **Handle:** `capitalcom` | **Industry:** Financial Services / Trading Platform  
**Bounty Range:** €50 – €15,000 (RCE max €15K, SQLi €9K, IDOR €4.5K, XSS €100-1K)  
**Avg Payout:** €880 | **Submissions:** 819 (84 accepted)

#### Why It's Promising
- **12 in-scope domains** including `*.backend-capital.com`, `open-api.capital.com`, `*.capital.com`
- Known issues list shows **historical vulnerabilities found**: XSS in widgets, HTML injection, 2FA bypass — proves the program accepts findings
- Self-registration allowed — can create accounts to test authenticated endpoints
- **Key subdomains to probe:**
  - `open-api.capital.com` — public trading API, likely less WAF'd than main site
  - `payment.backend-capital.com` — payment processing, high-value target
  - `*.backend-capital.com` — backend services, historically weaker protection
  - `affiliates.backend-capital.com` — historically in known-issues list (had vulnerabilities)

#### Known Weak Points (from Capital.com scope history):
- HTML injection in POPUPs and emails (known, but still check for new instances)
- XSS in cookies with domain=.capital.com
- XSS in widgets (chained with csrf could be impactful)
- 2FA enablement without email verification (auth bypass vector)
- Historical: UBAS_PASSWORD leaked in JS, YouTube API token exposed

#### Accessible Attack Surface:
- **Self-registration:** Create test accounts freely
- **API:** `open-api.capital.com` — REST API for trading platform, less likely to have anti-bot than the main marketing site
- **Wildcard scope:** `*.capital.com` and `*.backend-capital.com` means many subdomains are fair game
- **Mobile app:** `com.capital.trading` (iOS/Android) in scope — traffic can be intercepted

#### Specific URLs to Probe First:
```
https://open-api.capital.com/
https://affiliates.backend-capital.com/
https://eduapp.backend-capital.com/
https://education.backend-capital.com/
```

#### ⚠️ Cautions:
- Reports "generated solely by automated vulnerability scanners" are rejected — must manually validate findings
- Blind SSRF without business impact excluded
- Subdomain takeover only worth €100 unless chained

---

### 2. 🚀 Cribl VDP — Bugcrowd (Already In Pipeline)
**Platform:** Bugcrowd | **Engagement:** `cribl-vdp-ess` | **Type:** VDP  
**Bounty Range:** VDP (no financial rewards but good for experience)

#### Why It's Promising
- Cribl is a data processing pipeline company — their products handle log/ telemetry data
- **Known scope:** `*.cribl-ess.systems` — internal observability tools
- VDP means lower pressure, can probe freely
- Products often have hidden API endpoints for configuration

#### Attack Surface:
- Cribl Edge, Cribl Stream, Cribl Vision — data processing tools
- Often deployed in enterprise environments, handle sensitive log data
- API endpoints for data ingestion and processing pipelines

#### Specific Targets:
```
https://*.cribl-ess.systems/
```

---

### 3. 🚀 Internet Brands (WebMD, Medscape, etc.) — Bugcrowd
**Platform:** Bugcrowd | **Engagement:** `internetbrands-public`  
**Bounty Range:** Varies | **Attack Surface:** Large health media network

#### Why It's Promising
- **Multiple high-traffic properties in scope:** webmd.com, medscape.com, medged.com, and many niche health sites
- **Multiple API endpoints identified:** `openapi.pulsepoint.com`, `openapitest.pulsepoint.com`, `lifeapi.pulsepoint.com`
- Healthcare/medical sites historically have weaker security than fintech
- Self-registration on several portals

#### Specific Targets:
```
https://openapi.pulsepoint.com/
https://openapitest.pulsepoint.com/  (TEST ENV - often weaker!)
https://lifeapi.pulsepoint.com/
https://profreg.medscape.com/
https://accounts.webmd.com/
https://member.webmd.com/
https://portalv2.lh360.com/
```

#### Known Weak Points:
- Healthcare portals frequently have IDOR in appointment/record access
- Multiple apps in scope = multiple mobile API backends
- PulsePoint exchange platform APIs — ad tech APIs often have injection points

---

### 4. 🚀 Personio — Intigriti
**Platform:** Intigriti | **Handle:** `personio` | **Industry:** HR/People Management SaaS  
**Type:** Full Bug Bounty Program (conf=4, public)

#### Why It's Promising
- HR software = **sensitive employee data** (PII, salaries, performance reviews)
- Large SaaS platform with web app + likely API
- B2B SaaS often has less WAF protection than consumer-facing sites
- **Scope likely includes:** `*.personio.com` and/or `personio.com` — web app, mobile API

#### Attack Surface:
- Employee onboarding flows (file uploads, document handling)
- Payroll data access (IDOR potential)
- SSO/OAuth integrations with client companies
- Calendar/scheduling endpoints

#### Action:
- Check current scope on Intigriti (we don't have scope details in the scrape yet)
- Target: `*.personio.com` subdomain enumeration first
- Look for developer/personio.com sites or staging environments

---

### 5. 🚀 Ciso Meraki — Bugcrowd (Already In Pipeline)
**Platform:** Bugcrowd | **Engagement:** `ciscomeraki` | **Type:** VDP  
**Scope:** Meraki cloud networking products (Cisco)

#### Why It's Promising
- Enterprise networking gear — **historically poor security** on management interfaces
- Large attack surface: meraki dashboards, VPN endpoints, SSIDs, AP management
- Often has **API-only management plane** that's less protected than web UI
- **Known scope:** `*.meraki.com` — includes all Meraki cloud services

#### Specific Targets:
```
https://api.meraki.com/  (Meraki Dashboard API - key target)
https://n147.meraki.com/  (specific dashboard node)
https://account.meraki.com/
```

#### Attack Vectors:
- Meraki Dashboard API authentication bypass
- SSID parameter injection (XSS in captive portals)
- SNMP community string exposure
- VLAN misconfiguration via API
- Guest onboarding flows

---

## Programs to Monitor (Not Top 5 But Worth Watching)

### Intigriti — TrueLayer (`truelayer`)
- Open banking API provider — financial data aggregation
- High-value target: banking integration APIs
- fintech = serious about security BUT also actively defended

### Intigriti — Monzo (`monzopublicbugbountyprogram`)
- Digital bank — well-known for security but public program
- Mobile app API in scope
- Good for learning, high competition

### Intigriti — Uphold (`upholdcom`)
- Cryptocurrency/fintech platform
- Payment processing scope likely
- Crypto platforms often have softer internal tools

### Intigriti — Probiller (`probiller-bbp`)
- Payment billing platform
- Billing systems historically have IDOR (access other users' invoices)
- B2B payment processor = multiple company data in scope

### Bugcrowd — Fireblocks
- Crypto/fintech platform
- Developer APIs: `sandbox-api.fireblocks.io`, `sb-console-api.fireblocks.io`
- Staging/sandbox environments often less protected

### Bugcrowd — YNAB (You Need A Budget)
- Personal finance SaaS
- API: `api.ynab.com` — public API documentation available
- Staging API: `staging-api.bany.dev`
- Good for IDOR on budget/transaction data

---

## Key Findings

1. **Capital.com is the #1 target** — wide scope, self-registration, known vulnerabilities, €15K max bounty, and the `open-api.capital.com` is exactly the kind of API endpoint scanners love.

2. **API-only/staging endpoints are gold** — `openapitest.pulsepoint.com`, `staging-api.bany.dev`, `sandbox-api.fireblocks.io` — test environments are almost always softer than production.

3. **HR/Health data programs** (Personio, WebMD/Medscape) handle PII and often have weaker security than financial services.

4. **Ciso Meraki** — enterprise networking gear management plane is a historically rich target for SSRF, IDOR, and authentication bypass.

5. **Bugcrowd invites program** — The `invites` engagement on Bugcrowd is a private program. Worth checking what's actually in it.

---

## Recommended Scan Priority

1. **Capital.com** — dalfox on `open-api.capital.com` + nuclei on all `*.backend-capital.com`
2. **Internet Brands/PulsePoint** — nuclei on `openapitest.pulsepoint.com` first (test env), then production APIs
3. **Ciso Meraki** — nuclei on `api.meraki.com` + dalfox on dashboard login portals
4. **Fireblocks** — nuclei on `sandbox-api.fireblocks.io` (staging = softer target)
5. **YNAB** — IDOR testing on `api.ynab.com` for budget/transaction access

---

## Sources
- Intigriti program list: `logs/intigriti-programs.json` (196 programs)
- Bugcrowd direct targets: `logs/direct-scan-targets.json`
- Capital.com scope history: `logs/capital-scope.json`
- Bugcrowd engagements: `cribl-vdp-ess`, `ciscomeraki`, `invites`
- Bbscope.com for Capital.com domain list
