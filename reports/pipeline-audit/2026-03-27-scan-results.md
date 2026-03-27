# Vulnerability Scan Results — 2026-03-27

**Scanner:** Automated scan agent  
**Runtime:** 7m13s  
**Models:** minimax-m2.7:cloud

---

## Capital.com (Intigriti — Intigriti, €15K max)

### Nuclei — open-api.capital.com
- Templates executed: 9904
- WAF: **Cloudflare detected** (may limit accuracy)
- **Findings: 5 info/low**
  1. `deprecated-tls` — TLS 1.1 in use
  2. `tls-version` — TLS 1.1 enabled
  3. `weak-cipher-suites` — Weak cipher suite (low)
  4. `tls-version` — TLS 1.2/1.3 also supported
  5. `missing-sri` — Subresource Integrity not implemented
  6. `email-extractor` — support@capital.com
- **No high/critical vulnerabilities**

### Dalfox XSS — open-api.capital.com
- Scan time: 4.7s
- **0 XSS vulnerabilities found**

### httpx Probes — *.backend-capital.com
| Subdomain | Status | Notes |
|-----------|--------|-------|
| open-api.capital.com | ✅ 200 | Cloudflare WAF |
| affiliates.backend-capital.com | ❌ 404 | Not found |
| eduapp.backend-capital.com | ❌ DNS | Unresolvable |
| education.backend-capital.com | ❌ 404 | Not found |
| payment.backend-capital.com | ❌ 403 | Forbidden |

**Conclusion:** Capital.com's API is behind Cloudflare — automated XSS/SQLi scans blocked. Manual testing of auth flows recommended.

---

## Cribl VDP (ending 2026-03-30) — URGENT

**Target unreachable:** `stream.cribl-ess.systems` — DNS lookup failure
- Nuclei: confirmed target does not resolve
- Dalfox: confirmed same
- **VDP may have expired or domain changed**

---

## Files Saved
- `bounty-passive-pipeline/scan-results/capital-nuclei.json`
- `bounty-passive-pipeline/scan-results/capital-dalfox.json`
- `bounty-passive-pipeline/scan-results/backend-capital-httpx.json`
- `bounty-passive-pipeline/scan-results/backend-capital-targets.txt`
- `bounty-passive-pipeline/scan-results/cribl-nuclei.json`
- `bounty-passive-pipeline/scan-results/cribl-dalfox.json`

---

## Next Steps
1. Capital.com: Manual auth flow testing required (WAF blocks automated XSS/SQLi)
2. Cribl VDP: Check Bugcrowd for correct target domain
3. Try other accessible targets: Fireblocks sandbox, YNAB staging API
