# OSINT Report – vehicle: KY05YTJ

**Generated:** 2026-03-20T04:07:07.348Z  
**Duration:** 11s  
**Flags:** (none)  

## Summary

| Collector | Findings | Errors |
| --- | --- | --- |
| VehicleCollector | 20 | 0 |

**Total unique findings:** 20  
**Total errors:** 1  

### Confidence Distribution

| Level | Count |
| --- | --- |
| 🟢 High (≥80) | 13 |
| 🟡 Medium (50-79) | 7 |
| ⚪ Low (<50) | 0 |

## Key Findings

### GovUK-DVLA

- **🟢 [95%]** `make`: VAUXHALL
- **🟢 [95%]** `colour`: BLACK

### car-checking.com

- **🟢 [95%]** `mot_expiry`: 21/04/2026
- **🟢 [90%]** `mot_pass_rate`: 75%
- **🟢 [90%]** `mot_passed`: 18
- **🟢 [90%]** `mot_failed`: 6

### VehicleValuation

- **🟢 [90%]** `make`: VAUXHALL
- **🟢 [90%]** `model`: CORSA SXI CDTI Colour BLACK Year of manufacture 2005 Top speed mph 0 to 60 MPH 13.5seconds Gearbox MANUAL 5 GEARS Engine & fuel consumption Power 70 BHP Torque 1750 rpm Engine capacity 1248 cc Cylind
- **🟢 [90%]** `year`: 2005
- **🟢 [90%]** `advisory_total_min`: 600
- **🟢 [90%]** `advisory_total_max`: 2325
- **🟢 [85%]** `cost__Brake_pipe_corroded__high__soon`: £100-£250
- **🟢 [85%]** `cost__Sub-frame_/_chassis_corroded__high__when_due`: £200-£1000
- **🟡 [70%]** `mot_fail_risk`: medium
- **🟡 [70%]** `cost__Tyre(s)_worn_close_to_legal_limit__medium__soon`: £90-£155
- **🟡 [70%]** `cost__Tyre(s)_slightly_damaged_/_perishing__low__soon`: £40-£80
- **🟡 [70%]** `cost__Brake_hose_corroded_/_perished__medium__when_due`: £60-£140
- **🟡 [70%]** `cost__Brake_cable_damaged__medium__when_due`: £60-£140
- **🟡 [70%]** `cost__Generalised_corrosion_/_rust__medium__when_due`: £50-£500
- **🟡 [70%]** `cost__Headlamp_lens_defective__low__advisory`: £0-£60


## 🚗 Vehicle Report

```
  ────────────────────────────────────────────────
  VAUXHALL CORSA SXI CDTI Colour BLACK Year of manufacture 2005 Top speed mph 0 to 60 MPH 13.5seconds Gearbox MANUAL 5 GEARS Engine & fuel consumption Power 70 BHP Torque 1750 rpm Engine capacity 1248 cc Cylind
  ────────────────────────────────────────────────
  📅 Year:    2005
  🎨 Colour:  BLACK
  ✅ MOT:     18 passed / 6 failed
  ────────────────────────────────────────────────
```

### 📋 MOT History

| Result | Count |
| --- | --- |
| ✅ Passed | 18 |
| ❌ Failed | 6 |
| 📊 Pass rate | 🟡 75% |

### 🔍 Most Recent MOT Advisories & Costs

| # | Issue | Severity | Urgency | Est. Cost |
| --- | --- | --- | --- | --- |
| 1 | Tyre(s) worn close to legal limit | 🟡 MEDIUM | soon | ££90-£155 |
| 2 | Tyre(s) slightly damaged / perishing | 🟢 LOW | soon | ££40-£80 |
| 3 | Brake pipe corroded | 🟠 HIGH | soon | ££100-£250 |
| 4 | Brake hose corroded / perished | 🟡 MEDIUM | when_due | ££60-£140 |
| 5 | Brake cable damaged | 🟡 MEDIUM | when_due | ££60-£140 |
| 6 | Sub-frame / chassis corroded | 🟠 HIGH | when_due | ££200-£1000 |
| 7 | Generalised corrosion / rust | 🟡 MEDIUM | when_due | ££50-£500 |
| 8 | Headlamp lens defective | 🟢 LOW | advisory | ££0-£60 |

**Total estimated advisory cost: £600 – £2325**

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
      "raw_text": "\n\n<iframe src=\"\"https://www.googletagmanager.com/ns.html?id=GTM-MCR9JCH\"\"\n    height=\"\"0\"\" width=\"\"0\"\" style=\"\"display:none;visibility:hidden\"\"></iframe>\n\n          HOME  VERIFY YOUR VEHICLE  CONTACT US Login  Your Report is Ready Now! Click on the button below to Download it!  Download  Report date: 20-03-2026 VAUXHALL  CORSA SXI CDTI  YOUR CAR REPORT IS READY!  Download Your Report  Download  Damage Check  Mileage History  Car Features  Finance Check  Stolen Check  Owners History General Information  Make VAUXHALL Model CORSA SXI CDTI Colour BLACK Year of manufacture 2005 Top speed mph 0 to 60 MPH 13.5seconds Gearbox MANUAL 5 GEARS Engine & fuel consumption Power 70 BHP Torque 1750 rpm Engine capacity 1248 cc Cylinders 4 Fuel type DIESEL Consumption city 49.6 mpg Consumption extra urban 74.3 mpg Consumption combined 62.8 mpg CO2 emission  g/km CO2 label D   MOT history MOT expiry date 21/04/2026 MOT pass rate \n                                                                                            75 %\n                                                                                     MOT passed 18 Failed MOT tests 6 Total advice items 57 Total items failed 10 \n                                            MOT #1\n                                         MOT test number:  Result: \n                                                                                                        Pass\n                                                 \n                                            MOT #2\n                                         MOT test number:  Result: \n                                                                                                        Fail\n                                                 Failure Anti-roll bar linkage ball joint excessively worn  both front (5.3.4 (a) (i)) Failure Nearside Front Coil spring fractured or broken (5.3.1 (b) (i)) \n                                            MOT #3\n                                         MOT test number:  Result: \n                                                                                                        Pass\n                                                 Advice Nearside Rear Tyre slightly damaged/cracking or perishing  185/55-15 (5.2.3 (d) (ii)) Advice Offside Rear Tyre worn close to legal limit/worn on edge  2.7mm scrubbing inner edge (5.2.3 (e)) \n                                            MOT #4\n                                         MOT test number:  Result: \n                                                                                                        Pass\n                                                 \n                                            MOT #5\n                                         MOT test number:  Result: \n                                                                                                        Pass\n                                                 Advice Nearside Rear Tyre slightly damaged/cracking or perishing (5.2.3 (d) (ii)) Advice Offside Rear Tyre slightly damaged/cracking or perishing (5.2.3 (d) (ii)) Advice Brake pipe corroded, covered in grease or other material  Both front to rear (1.1.11 (c)) Advice Nearside Rear Brake hose has slight corrosion to ferrule (1.1.12 (f) (i)) Advice Offside Rear Brake hose has slight corrosion to ferrule (1.1.12 (f) (i)) Advice Nearside Brake cable damaged but not to excess (1.1.15 (a)) Advice Offside Brake cable damaged but not to excess (1.1.15 (a)) Advice Front Sub-frame corroded but not seriously weakened (5.3.3 (b) (i)) Advice Rear Sub-frame corroded but not seriously weakened (5.3.3 (b) (i)) Advice Nearside Headlamp lens slightly defective (4.1.1 (b) (i)) Advice Offside Headlamp lens slightly defective (4.1.1 (b) (i)) Advice Various areas of corrosion to underside of vehicle and suspension components \n                                            MOT #6\n                                         MOT test number:  Result: \n                                                                                                        Pass\n                                                 Advice Nearside Front Tyre worn close to legal limit/worn on edge  185/55-15 (5.2.3 (e)) Advice Nearside Rear Tyre slightly damaged/cracking or perishing (5.2.3 (d) (ii)) Advice Offside Rear Tyre slightly damaged/cracking or perishing (5.2.3 (d) (ii)) Advice Nearside Brake cable damaged but not to excess (1.1.15 (a)) Advice Offside Brake cable damaged but not to excess (1.1.15 (a)) Advice Brake pipe corroded, covered in grease or other material  Both front to rear (1.1.11 (c)) Advice Nearside Rear Brake hose has slight corrosion to ferrule (1.1.12 (f) (i)) Advice Offside Rear Brake hose has slight corrosion to ferrule (1.1.12 (f) (i)) Advice Front Headlamp lens slightly defective  Both (4.1.1 (b) (i)) Advice Various areas of surface corrosion to underside of vehicle and suspension components \n                                            MOT #7\n                      ",
      "make": "VAUXHALL Model CORSA SXI CDTI Colour BLACK Year of manufacture 2005 Top speed mph 0 to 60 MPH 13.5seconds Gearbox MANUAL 5 GEARS Engine & fuel consumption Power 70 BHP Torque 1750 rpm Engine capacity",
      "model": "CORSA SXI CDTI Colour BLACK Year of manufacture 2005 Top speed mph 0 to 60 MPH 13.5seconds Gearbox MANUAL 5 GEARS Engine & fuel consumption Power 70 BHP Torque 1750 rpm Engine capacity 1248 cc Cylind",
      "colour": "BLACK Year of manufacture 2005 Top speed mph 0 to 60 MPH 13.5seconds Gearbox MANUAL 5 GEARS Engine & fuel consumption Power 70 BHP Torque 1750 rpm Engine capacity 1248 cc Cylinders 4 Fuel type DIESEL",
      "year": "2005 Top speed mph 0 to 60 MPH 13.5seconds Gearbox MANUAL 5 GEARS Engine & fuel consumption Power 70 BHP Torque 1750 rpm Engine capacity 1248 cc Cylinders 4 Fuel type DIESEL Consumption city 49.6 mpg",
      "top_speed": "mph 0 to 60 MPH 13.5seconds Gearbox MANUAL 5 GEARS Engine & fuel consumption Power 70 BHP Torque 1750 rpm Engine capacity 1248 cc Cylinders 4 Fuel type DIESEL Consumption city 49.6 mpg Consumption ex",
      "zero_to_60": "13.5seconds Gearbox MANUAL 5 GEARS Engine & fuel consumption Power 70 BHP Torque 1750 rpm Engine capacity 1248 cc Cylinders 4 Fuel type DIESEL Consumption city 49.6 mpg Consumption extra urban 74.3 m",
      "gearbox": "MANUAL 5 GEARS Engine & fuel consumption Power 70 BHP Torque 1750 rpm Engine capacity 1248 cc Cylinders 4 Fuel type DIESEL Consumption city 49.6 mpg Consumption extra urban 74.3 mpg Consumption combi",
      "engine": "Power 70 BHP Torque 1750 rpm Engine capacity 1248 cc Cylinders 4 Fuel type DIESEL Consumption city 49.6 mpg Consumption extra urban 74.3 mpg Consumption combined 62.8 mpg CO2 emission  g/km CO2 label",
      "power": "70 BHP Torque 1750 rpm Engine capacity 1248 cc Cylinders 4 Fuel type DIESEL Consumption city 49.6 mpg Consumption extra urban 74.3 mpg Consumption combined 62.8 mpg CO2 emission  g/km CO2 label D   M",
      "torque": "1750 rpm Engine capacity 1248 cc Cylinders 4 Fuel type DIESEL Consumption city 49.6 mpg Consumption extra urban 74.3 mpg Consumption combined 62.8 mpg CO2 emission  g/km CO2 label D   MOT history MOT",
      "engine_capacity": "1248 cc Cylinders 4 Fuel type DIESEL Consumption city 49.6 mpg Consumption extra urban 74.3 mpg Consumption combined 62.8 mpg CO2 emission  g/km CO2 label D   MOT history MOT expiry date 21/04/2026 M",
      "cylinders": "4 Fuel type DIESEL Consumption city 49.6 mpg Consumption extra urban 74.3 mpg Consumption combined 62.8 mpg CO2 emission  g/km CO2 label D   MOT history MOT expiry date 21/04/2026 MOT pass rate",
      "fuel_type": "DIESEL Consumption city 49.6 mpg Consumption extra urban 74.3 mpg Consumption combined 62.8 mpg CO2 emission  g/km CO2 label D   MOT history MOT expiry date 21/04/2026 MOT pass rate",
      "consumption_city": "49.6 mpg Consumption extra urban 74.3 mpg Consumption combined 62.8 mpg CO2 emission  g/km CO2 label D   MOT history MOT expiry date 21/04/2026 MOT pass rate",
      "consumption_extra_urban": "74.3 mpg Consumption combined 62.8 mpg CO2 emission  g/km CO2 label D   MOT history MOT expiry date 21/04/2026 MOT pass rate",
      "consumption_combined": "62.8 mpg CO2 emission  g/km CO2 label D   MOT history MOT expiry date 21/04/2026 MOT pass rate",
      "co2_emission": "g/km CO2 label D   MOT history MOT expiry date 21/04/2026 MOT pass rate",
      "co2_label": "D   MOT history MOT expiry date 21/04/2026 MOT pass rate",
      "mot_expiry": "21/04/2026"
    },
    "MIB": {},
    "valuation": {
      "make": "VAUXHALL",
      "model": "CORSA SXI CDTI Colour BLACK Year of manufacture 2005 Top speed mph 0 to 60 MPH 13.5seconds Gearbox MANUAL 5 GEARS Engine & fuel consumption Power 70 BHP Torque 1750 rpm Engine capacity 1248 cc Cylind",
      "year": 2005,
      "currentValueMin": 700,
      "currentValueMax": 840,
      "valueWithAdvisoriesMin": 300,
      "valueWithAdvisoriesMax": 420,
      "expectedMonthsRemaining": 3,
      "motFailRisk": "medium",
      "totalAdvisoryCostMin": 600,
      "totalAdvisoryCostMax": 2325,
      "recommendation": "Repair costs (up to £2,325) exceed half the car's value. Negotiate hard or avoid."
    },
    "advisory_costs": [
      {
        "item": "Tyre(s) worn close to legal limit",
        "severity": "medium",
        "urgency": "soon",
        "estimatedCostMin": 90,
        "estimatedCostMax": 155,
        "labourHours": 0.5,
        "notes": "£80-140 per tyre + £10-15 fitting. MOT pass but retest due soon. Replace proactively.",
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
        "item": "Brake pipe corroded",
        "severity": "high",
        "urgency": "soon",
        "estimatedCostMin": 100,
        "estimatedCostMax": 250,
        "labourHours": 1.5,
        "notes": "£60-150 for pipe + £80-120 labour. Can spread fast. Replace before MOT retest.",
        "partsIncluded": false
      },
      {
        "item": "Brake hose corroded / perished",
        "severity": "medium",
        "urgency": "when_due",
        "estimatedCostMin": 60,
        "estimatedCostMax": 140,
        "labourHours": 1,
        "notes": "£30-60 per hose + £50-80 labour. Replace in pairs.",
        "partsIncluded": false
      },
      {
        "item": "Brake cable damaged",
        "severity": "medium",
        "urgency": "when_due",
        "estimatedCostMin": 60,
        "estimatedCostMax": 140,
        "labourHours": 1,
        "notes": "£30-60 per cable + £50-80 labour. Affects handbrake operation.",
        "partsIncluded": false
      },
      {
        "item": "Sub-frame / chassis corroded",
        "severity": "high",
        "urgency": "when_due",
        "estimatedCostMin": 200,
        "estimatedCostMax": 1000,
        "labourHours": 4,
        "notes": "£150-600 for welding + £100-400 labour. Structural — MOT fail if serious.",
        "partsIncluded": false
      },
      {
        "item": "Generalised corrosion / rust",
        "severity": "medium",
        "urgency": "when_due",
        "estimatedCostMin": 50,
        "estimatedCostMax": 500,
        "labourHours": 2,
        "notes": "£50-300 for treatment + £50-200 for underseal. Monitor for spread.",
        "partsIncluded": true
      },
      {
        "item": "Headlamp lens defective",
        "severity": "low",
        "urgency": "advisory",
        "estimatedCostMin": 0,
        "estimatedCostMax": 60,
        "labourHours": 0.25,
        "notes": "£0-30 for bulb/connector. £30-60 for lens unit. MOT fail if affecting light output.",
        "partsIncluded": false
      }
    ]
  }
}
```

## Recommendations

High-confidence findings to investigate further:
- make → VAUXHALL (GovUK-DVLA)
- colour → BLACK (GovUK-DVLA)
- mot_expiry → 21/04/2026 (car-checking.com)
- mot_pass_rate → 75% (car-checking.com)
- mot_passed → 18 (car-checking.com)
- mot_failed → 6 (car-checking.com)
- make → VAUXHALL (VehicleValuation)
- model → CORSA SXI CDTI Colour BLACK Year of manufacture 2005 Top speed mph 0 to 60 MPH 13.5seconds Gearbox MANUAL 5 GEARS Engine & fuel consumption Power 70 BHP Torque 1750 rpm Engine capacity 1248 cc Cylind (VehicleValuation)
- year → 2005 (VehicleValuation)
- advisory_total_min → 600 (VehicleValuation)
