# OSINT Report – vehicle: KY05YTJ

**Generated:** 2026-03-19T23:55:23.031Z  
**Duration:** 11s  
**Flags:** (none)  

## Summary

| Collector | Findings | Errors |
| --- | --- | --- |
| VehicleCollector | 14 | 0 |

**Total unique findings:** 14  
**Total errors:** 1  

### Confidence Distribution

| Level | Count |
| --- | --- |
| 🟢 High (≥80) | 11 |
| 🟡 Medium (50-79) | 2 |
| ⚪ Low (<50) | 1 |

## Key Findings

### GovUK-DVLA

- **🟢 [95%]** `make`: VAUXHALL
- **🟢 [95%]** `colour`: BLACK

### car-checking.com

- **🟢 [95%]** `mot_expiry`: 21/04/2026
- **🟢 [95%]** `make`: VAUXHALL
- **🟢 [95%]** `year`: 2005
- **🟢 [90%]** `mot_pass_rate`: 75%
- **🟢 [90%]** `mot_passed`: 18
- **🟢 [90%]** `mot_failed`: 6
- **🟢 [90%]** `model`: CORSA SXI CDTI

### VehicleValuation

- **🟢 [90%]** `advisory_cost_total`: £520-£1345
- **🟢 [80%]** `valuation`: £200-£300 (with advisories)
- **🟡 [75%]** `mot_fail_risk`: low
- **🟡 [70%]** `expected_lifespan`: ~3 months
- **⚪ [0%]** `recommendation`: Avoid — multiple high-severity advisories. Total repair costs could exceed £1,345. Walk away or demand £520+ reduction.

## Vehicle Valuation & Advisory Costs

### Lifespan & Risk Assessment

- **MOT fail risk before next test:** LOW
- **Assessment:** Avoid — multiple high-severity advisories. Total repair costs could exceed £1,345. Walk away or demand £520+ reduction.

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
      "raw_text": "\n\n<iframe src=\"\"https://www.googletagmanager.com/ns.html?id=GTM-MCR9JCH\"\"\n    height=\"\"0\"\" width=\"\"0\"\" style=\"\"display:none;visibility:hidden\"\"></iframe>\n\n          HOME  VERIFY YOUR VEHICLE  CONTACT US Login  Your Report is Ready Now! Click on the button below to Download it!  Download  Report date: 19-03-2026 VAUXHALL  CORSA SXI CDTI  YOUR CAR REPORT IS READY!  Download Your Report  Download  Damage Check  Mileage History  Car Features  Finance Check  Stolen Check  Owners History General Information  Make VAUXHALL Model CORSA SXI CDTI Colour BLACK Year of manufacture 2005 Top speed mph 0 to 60 MPH 13.5seconds Gearbox MANUAL 5 GEARS Engine & fuel consumption Power 70 BHP Torque 1750 rpm Engine capacity 1248 cc Cylinders 4 Fuel type DIESEL Consumption city 49.6 mpg Consumption extra urban 74.3 mpg Consumption combined 62.8 mpg CO2 emission  g/km CO2 label D   MOT history MOT expiry date 21/04/2026 MOT pass rate \n                                                                                            75 %\n                                                                                     MOT passed 18 Failed MOT tests 6 Total advice items 57 Total items failed 10 \n                                            MOT #1\n                                         MOT test number:  Result: \n                                                                                                        Pass\n                                                 \n                                            MOT #2\n                                         MOT test number:  Result: \n                                                                                                        Fail\n                                                 Failure Anti-roll bar linkage ball joint excessively worn  both front (5.3.4 (a) (i)) Failure Nearside Front Coil spring fractured or broken (5.3.1 (b) (i)) \n                                            MOT #3\n                                         MOT test number:  Result: \n                                                                                                        Pass\n                                                 Advice Nearside Rear Tyre slightly damaged/cracking or perishing  185/55-15 (5.2.3 (d) (ii)) Advice Offside Rear Tyre worn close to legal limit/worn on edge  2.7mm scrubbing inner edge (5.2.3 (e)) \n                                            MOT #4\n                                         MOT test number:  Result: \n                                                                                                        Pass\n                                                 \n                                            MOT #5\n                                         MOT test number:  Result: \n                                                                                                        Pass\n                                                 Advice Nearside Rear Tyre slightly damaged/cracking or perishing (5.2.3 (d) (ii)) Advice Offside Rear Tyre slightly damaged/cracking or perishing (5.2.3 (d) (ii)) Advice Brake pipe corroded, covered in grease or other material  Both front to rear (1.1.11 (c)) Advice Nearside Rear Brake hose has slight corrosion to ferrule (1.1.12 (f) (i)) Advice Offside Rear Brake hose has slight corrosion to ferrule (1.1.12 (f) (i)) Advice Nearside Brake cable damaged but not to excess (1.1.15 (a)) Advice Offside Brake cable damaged but not to excess (1.1.15 (a)) Advice Front Sub-frame corroded but not seriously weakened (5.3.3 (b) (i)) Advice Rear Sub-frame corroded but not seriously weakened (5.3.3 (b) (i)) Advice Nearside Headlamp lens slightly defective (4.1.1 (b) (i)) Advice Offside Headlamp lens slightly defective (4.1.1 (b) (i)) Advice Various areas of corrosion to underside of vehicle and suspension components \n                                            MOT #6\n                                         MOT test number:  Result: \n                                                                                                        Pass\n                                                 Advice Nearside Front Tyre worn close to legal limit/worn on edge  185/55-15 (5.2.3 (e)) Advice Nearside Rear Tyre slightly damaged/cracking or perishing (5.2.3 (d) (ii)) Advice Offside Rear Tyre slightly damaged/cracking or perishing (5.2.3 (d) (ii)) Advice Nearside Brake cable damaged but not to excess (1.1.15 (a)) Advice Offside Brake cable damaged but not to excess (1.1.15 (a)) Advice Brake pipe corroded, covered in grease or other material  Both front to rear (1.1.11 (c)) Advice Nearside Rear Brake hose has slight corrosion to ferrule (1.1.12 (f) (i)) Advice Offside Rear Brake hose has slight corrosion to ferrule (1.1.12 (f) (i)) Advice Front Headlamp lens slightly defective  Both (4.1.1 (b) (i)) Advice Various areas of surface corrosion to underside of vehicle and suspension components \n                                            MOT #7\n                      ",
      "mot_expiry": "21/04/2026",
      "vehicle_valuation": {
        "make": "Unknown",
        "model": "Unknown",
        "year": 2005,
        "currentValueMin": 200,
        "currentValueMax": 300,
        "valueWithAdvisoriesMin": 200,
        "valueWithAdvisoriesMax": 300,
        "expectedMonthsRemaining": 3,
        "motFailRisk": "low",
        "totalAdvisoryCostMin": 520,
        "totalAdvisoryCostMax": 1345,
        "recommendation": "Avoid — multiple high-severity advisories. Total repair costs could exceed £1,345. Walk away or demand £520+ reduction."
      },
      "advisory_costs": [
        {
          "item": "Tyre(s) worn close to legal limit",
          "severity": "high",
          "urgency": "immediate",
          "estimatedCostMin": 90,
          "estimatedCostMax": 155,
          "labourHours": 0.5,
          "notes": "£80-140 per tyre + £10-15 fitting. Replace before MOT retest.",
          "partsIncluded": true
        },
        {
          "item": "Tyre(s) slightly damaged / perishing",
          "severity": "low",
          "urgency": "soon",
          "estimatedCostMin": 40,
          "estimatedCostMax": 80,
          "labourHours": 0.25,
          "notes": "£40-80 per tyre. Monitor — may not need immediate replacement.",
          "partsIncluded": true
        },
        {
          "item": "Brake disc(s) worn",
          "severity": "medium",
          "urgency": "when_due",
          "estimatedCostMin": 130,
          "estimatedCostMax": 300,
          "labourHours": 1.5,
          "notes": "£80-200 per disc + £50-100 labour. Often done with pads.",
          "partsIncluded": false
        },
        {
          "item": "Headlamp lens defective",
          "severity": "low",
          "urgency": "when_due",
          "estimatedCostMin": 80,
          "estimatedCostMax": 210,
          "labourHours": 0.75,
          "notes": "£50-150 per lens + £30-60 labour. UV degradation — common on older cars.",
          "partsIncluded": false
        },
        {
          "item": "Surface corrosion to underside",
          "severity": "medium",
          "urgency": "when_due",
          "estimatedCostMin": 180,
          "estimatedCostMax": 600,
          "labourHours": 2.5,
          "notes": "£100-400 treatment + £80-200 labour. Worth treating before it spreads.",
          "partsIncluded": false
        }
      ]
    },
    "MIB": {}
  }
}
```

## Recommendations

High-confidence findings to investigate further:
- make → VAUXHALL (GovUK-DVLA)
- colour → BLACK (GovUK-DVLA)
- mot_expiry → 21/04/2026 (car-checking.com)
- make → VAUXHALL (car-checking.com)
- year → 2005 (car-checking.com)
- mot_pass_rate → 75% (car-checking.com)
- mot_passed → 18 (car-checking.com)
- mot_failed → 6 (car-checking.com)
- model → CORSA SXI CDTI (car-checking.com)
- advisory_cost_total → £520-£1345 (VehicleValuation)
