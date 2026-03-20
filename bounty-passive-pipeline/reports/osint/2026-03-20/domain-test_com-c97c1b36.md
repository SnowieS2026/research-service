# OSINT Report – domain: test.com

**Generated:** 2026-03-20T01:44:37.891Z  
**Duration:** 22s  
**Flags:** (none)  

## Summary

| Collector | Findings | Errors |
| --- | --- | --- |
| DomainCollector | 5 | 0 |

**Total unique findings:** 5  
**Total errors:** 2  

### Confidence Distribution

| Level | Count |
| --- | --- |
| 🟢 High (≥80) | 2 |
| 🟡 Medium (50-79) | 3 |
| ⚪ Low (<50) | 0 |

## Key Findings

### CloudflareDoH

- **🟢 [90%]** `dns_TXT`: "55d34914-636b-4a56-b349-fdb9f2c1eaca", "9dad2f5b-fa2d-4141-8ee6-d26ec6994d18", "google-site-verification=kW9t2V_S7WjOX57zq0tP8Ae_WJhRwUcZoqpdEkvuXJk"
- **🟢 [90%]** `dns_NS`: ns3.safesecureweb.com., ns1.safesecureweb.com., ns2.safesecureweb.com.

### TyposquattingCheck

- **🟡 [50%]** `similar_domain:test.net`: test.net is registered (active)
- **🟡 [50%]** `similar_domain:test.io`: test.io is registered (active)
- **🟡 [50%]** `similar_domain:test.info`: test.info is registered (active)

## Errors

- CRTSH lookup failed: Error: Timeout after 15000ms for https://crt.sh/?q=test.com&output=json
- WHOIS lookup failed: Error: HTTP 401 for https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=free&domainName=test.com&outputFormat=json

## Raw Data

```json
{
  "DomainCollector": {
    "dns_TXT": [
      "\"55d34914-636b-4a56-b349-fdb9f2c1eaca\"",
      "\"9dad2f5b-fa2d-4141-8ee6-d26ec6994d18\"",
      "\"google-site-verification=kW9t2V_S7WjOX57zq0tP8Ae_WJhRwUcZoqpdEkvuXJk\""
    ],
    "dns_NS": [
      "ns3.safesecureweb.com.",
      "ns1.safesecureweb.com.",
      "ns2.safesecureweb.com."
    ]
  }
}
```

## Recommendations

High-confidence findings to investigate further:
- dns_TXT → "55d34914-636b-4a56-b349-fdb9f2c1eaca", "9dad2f5b-fa2d-4141-8ee6-d26ec6994d18", "google-site-verification=kW9t2V_S7WjOX57zq0tP8Ae_WJhRwUcZoqpdEkvuXJk" (CloudflareDoH)
- dns_NS → ns3.safesecureweb.com., ns1.safesecureweb.com., ns2.safesecureweb.com. (CloudflareDoH)
