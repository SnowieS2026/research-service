# OSINT Report – email: donald@trump.com

**Generated:** 2026-03-20T13:57:51.330Z  
**Duration:** 2s  
**Flags:** (none)  

## Summary

| Collector | Findings | Errors |
| --- | --- | --- |
| EmailCollector | 3 | 0 |

**Total unique findings:** 3  
**Total errors:** 0  

### Confidence Distribution

| Level | Count |
| --- | --- |
| 🟢 High (≥80) | 1 |
| 🟡 Medium (50-79) | 0 |
| ⚪ Low (<50) | 2 |

## Key Findings

### FormatCheck

- **🟢 [90%]** `valid_format`: Yes – "donald@trump.com" appears valid

### HaveIBeenPwned

- **⚪ [0%]** `note`: No HIBP API key configured – breach check skipped. Add OSINT_HIBP_API_KEY to config.

### HunterIO

- **⚪ [0%]** `note`: No Hunter.io API key configured – domain email lookup skipped. Add OSINT_HUNTER_API_KEY.

## Raw Data

```json
{
  "EmailCollector": {
    "webResults": []
  }
}
```

## Recommendations

High-confidence findings to investigate further:
- valid_format → Yes – "donald@trump.com" appears valid (FormatCheck)
