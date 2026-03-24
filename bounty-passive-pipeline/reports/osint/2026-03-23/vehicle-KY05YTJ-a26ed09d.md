# OSINT Report – vehicle: KY05YTJ

**Generated:** 2026-03-23T10:47:49.568Z  
**Duration:** 12s  
**Flags:** (none)  

## Summary

| Collector | Findings | Errors |
| --- | --- | --- |
| VehicleCollector | 8 | 0 |

**Total unique findings:** 8  
**Total errors:** 1  

### Confidence Distribution

| Level | Count |
| --- | --- |
| 🟢 High (≥80) | 7 |
| 🟡 Medium (50-79) | 1 |
| ⚪ Low (<50) | 0 |

## Key Findings

### GovUK-DVLA

- **🟢 [95%]** `make`: VAUXHALL
- **🟢 [95%]** `colour`: BLACK

### VehicleValuation

- **🟢 [90%]** `make`: VAUXHALL
- **🟢 [90%]** `model`: 
- **🟢 [90%]** `year`: 0
- **🟢 [90%]** `advisory_total_min`: 0
- **🟢 [90%]** `advisory_total_max`: 0
- **🟡 [70%]** `mot_fail_risk`: low


## 🚗 Vehicle Report

```
  ────────────────────────────────────────────────
  VAUXHALL 
  ────────────────────────────────────────────────
  📅 Year:    0
  🎨 Colour:  BLACK
  ────────────────────────────────────────────────
```

## Errors

- MIB Navigate insurance check: Error: HTTP 403 for https://enquiry.navigate.mib.org.uk/checkyourvehicle

## Raw Data

```json
{
  "VehicleCollector": {
    "DVLA": {
      "Registration number": "KY05 YTJ",
      "Make": "VAUXHALL",
      "Colour": "BLACK"
    },
    "CarCheck": {
      "raw_text": "\n        \n            \n                \n                    \n                        500                    \n\n                    \n                        Server Error                    \n                \n            \n        \n    \n\n"
    },
    "MIB": {},
    "valuation": {
      "make": "VAUXHALL",
      "model": "",
      "year": 0,
      "currentValueMin": 700,
      "currentValueMax": 1200,
      "valueWithAdvisoriesMin": 700,
      "valueWithAdvisoriesMax": 1200,
      "expectedMonthsRemaining": 18,
      "motFailRisk": "low",
      "totalAdvisoryCostMin": 0,
      "totalAdvisoryCostMax": 0,
      "recommendation": "Advisories are manageable wear items. Price accordingly — aim to save at least the advisory cost in negotiation. Car is worth £700-£1,200 as-is."
    },
    "advisory_costs": []
  }
}
```

## Recommendations

High-confidence findings to investigate further:
- make → VAUXHALL (GovUK-DVLA)
- colour → BLACK (GovUK-DVLA)
- make → VAUXHALL (VehicleValuation)
- model →  (VehicleValuation)
- year → 0 (VehicleValuation)
- advisory_total_min → 0 (VehicleValuation)
- advisory_total_max → 0 (VehicleValuation)
