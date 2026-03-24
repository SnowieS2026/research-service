# OSINT Report – vehicle: KY05YTJ

**Generated:** 2026-03-24T19:39:00.380Z  
**Duration:** 17s  
**Flags:** (none)  

## Summary

| Collector | Findings | Errors |
| --- | --- | --- |
| VehicleCollector | 8 | 0 |

**Total unique findings:** 8  
**Total errors:** 2  

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


## 🚗 Vehicle OSINT Report

**Target:** KY05YTJ  
**Generated:** 2026-03-24T19:39:00.380Z  
**Flags:** (none)  

### 1. Vehicle Header Card

```
  Registration: KY05YTJ
  Make: VAUXHALL
  Model: 
  Year: 0
  Colour: BLACK
  Body Type: N/A
  Fuel Type: Unknown
  Engine Size: N/A
  Transmission: Unknown
```

### 2. Vehicle Status

```
  ✔ Registered with DVLA (data unavailable)
  ✔ Tax status: data unavailable
  ✔ MOT status: No MOT data
  ✔ Last V5 issued date: not found in record
```

### 3. MOT History Intelligence

**Current MOT Status:** ❓ No MOT data

**Failure Patterns:**  No advisories recorded on last MOT.

### 4. Risk Indicators

**Overall Condition:** 🟢 Well maintained

| Severity | Count |
| --- | --- |
| 🟢 None | 0 |

### 5. Mileage Intelligence Analysis

No mileage history extracted from MOT records.

### 6. Market Intelligence

Market valuation not available.

### 7. Insurance Risk Indicators

**Insurance Group:** N/A
**Risk Rating:** 🟢 Low

### 8. Geographic Intelligence

No geographic data available from MOT records.

### 9. Mechanical Intelligence Indicators

**Model Reliability Rating:** 🟢 Good

### 10. Ownership Intelligence (OSINT derived)

**Estimated Owner Count:** Unable to estimate (no MOT data)
  - Insufficient MOT history to determine ownership patterns

### 11. Risk Flags

  No significant risk flags identified.

### 12. OSINT Confidence Score

| Category | Confidence |
| --- | --- |
| DVLA data | 🔴 0% |
| MOT data | 🔴 0% |
| Market data | 🟡 50% |
| Risk analysis | 🟡 65% |

**Overall OSINT confidence:** 🔴 **29/100**

### 13. Analyst Summary

VAUXHALL  (0) in BLACK has an no mot data MOT with 0 pass(es) and 0 fail(s) on record. No advisories were raised on the most recent MOT, suggesting the vehicle is in reasonable mechanical condition. Overall risk profile is rated **LOW**.

### 14. Overall OSINT Risk Rating

**🟢 LOW**

## Errors

- car-checking.com failed: TimeoutError: page.goto: Timeout 15000ms exceeded.
Call log:
[2m  - navigating to "https://www.car-checking.com/", waiting until "domcontentloaded"[22m

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
    "CarCheck": {},
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
