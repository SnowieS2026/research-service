# OSINT Report – vehicle: KY05YTJ

**Generated:** 2026-03-24T20:04:40.643Z  
**Duration:** 10s  
**Flags:** (none)  

## Summary

| Collector | Findings | Errors |
| --- | --- | --- |
| VehicleCollector | 22 | 0 |

**Total unique findings:** 22  
**Total errors:** 2  

### Confidence Distribution

| Level | Count |
| --- | --- |
| 🟢 High (≥80) | 13 |
| 🟡 Medium (50-79) | 9 |
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

### Parkers

- **🟡 [70%]** `engine_size_hint`: 0

### MotorCheck

- **🟡 [70%]** `fuel_hint`: electric


## 🚗 Vehicle OSINT Report

**Target:** KY05YTJ  
**Generated:** 2026-03-24T20:04:40.643Z  
**Flags:** (none)  

### 1. Vehicle Header Card

```
  Registration: KY05YTJ
  Make: VAUXHALL
  Model: CORSA SXI CDTI Colour BLACK Year of manufacture 2005 Top speed mph 0 to 60 MPH 13.5seconds Gearbox MANUAL 5 GEARS Engine & fuel consumption Power 70 BHP Torque 1750 rpm Engine capacity 1248 cc Cylind
  Year: 2005
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
  ✔ MOT status: Valid (expires 21/04/2026)
  ✔ Last V5 issued date: not found in record
```

### 3. MOT History Intelligence

**Current MOT Status:** ✔ Valid
**MOT Expiry Date:** 21/04/2026

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
**Risk Rating:** 🟡 Moderate

### 8. Geographic Intelligence

No geographic data available from MOT records.

### 9. Mechanical Intelligence Indicators

**Model Reliability Rating:** 🟢 Good

### 10. Ownership Intelligence (OSINT derived)

**Estimated Owner Count:** Unable to estimate (no MOT data)
  - Insufficient MOT history to determine ownership patterns

### 11. Risk Flags

  ⚠️ Repeated failures: 6 fails on record

### 12. OSINT Confidence Score

| Category | Confidence |
| --- | --- |
| DVLA data | 🔴 0% |
| MOT data | 🟢 100% |
| Market data | 🟡 50% |
| Risk analysis | 🟡 65% |

**Overall OSINT confidence:** 🟡 **54/100**

### 13. Analyst Summary

VAUXHALL CORSA SXI CDTI Colour BLACK Year of manufacture 2005 Top speed mph 0 to 60 MPH 13.5seconds Gearbox MANUAL 5 GEARS Engine & fuel consumption Power 70 BHP Torque 1750 rpm Engine capacity 1248 cc Cylind (2005) in BLACK has an valid MOT expiring 21/04/2026 with 18 pass(es) and 6 fail(s) on record. No advisories were raised on the most recent MOT, suggesting the vehicle is in reasonable mechanical condition. Overall risk profile is rated **LOW**.

### 14. Overall OSINT Risk Rating

**🟢 LOW**

## Errors

- gov.uk MOT: reg input not found
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
      "raw_text": "\n\n<iframe src=\"\"https://www.googletagmanager.com/ns.html?id=GTM-MCR9JCH\"\"\n    height=\"\"0\"\" width=\"\"0\"\" style=\"\"display:none;visibility:hidden\"\"></iframe>\n\n          HOME  VERIFY YOUR VEHICLE  CONTACT US Login  Your Report is Ready Now! Click on the button below to Download it!  Download  Report date: 24-03-2026 VAUXHALL  CORSA SXI CDTI  YOUR CAR REPORT IS READY!  Download Your Report  Download  Damage Check  Mileage History  Car Features  Finance Check  Stolen Check  Owners History General Information  Make VAUXHALL Model CORSA SXI CDTI Colour BLACK Year of manufacture 2005 Top speed mph 0 to 60 MPH 13.5seconds Gearbox MANUAL 5 GEARS Engine & fuel consumption Power 70 BHP Torque 1750 rpm Engine capacity 1248 cc Cylinders 4 Fuel type DIESEL Consumption city 49.6 mpg Consumption extra urban 74.3 mpg Consumption combined 62.8 mpg CO2 emission  g/km CO2 label D   MOT history MOT expiry date 21/04/2026 MOT pass rate \n                                                                                            75 %\n                                                                                     MOT passed 18 Failed MOT tests 6 Total advice items 57 Total items failed 10 \n                                            MOT #1\n                                         MOT test number:  Result: \n                                                                                                        Pass\n                                                 \n                                            MOT #2\n                                         MOT test number:  Result: \n                                                                                                        Fail\n                                                 Failure Anti-roll bar linkage ball joint excessively worn  both front (5.3.4 (a) (i)) Failure Nearside Front Coil spring fractured or broken (5.3.1 (b) (i)) \n                                            MOT #3\n                                         MOT test number:  Result: \n                                                                                                        Pass\n                                                 Advice Nearside Rear Tyre slightly damaged/cracking or perishing  185/55-15 (5.2.3 (d) (ii)) Advice Offside Rear Tyre worn close to legal limit/worn on edge  2.7mm scrubbing inner edge (5.2.3 (e)) \n                                            MOT #4\n                                         MOT test number:  Result: \n                                                                                                        Pass\n                                                 \n                                            MOT #5\n                                         MOT test number:  Result: \n                                                                                                        Pass\n                                                 Advice Nearside Rear Tyre slightly damaged/cracking or perishing (5.2.3 (d) (ii)) Advice Offside Rear Tyre slightly damaged/cracking or perishing (5.2.3 (d) (ii)) Advice Brake pipe corroded, covered in grease or other material  Both front to rear (1.1.11 (c)) Advice Nearside Rear Brake hose has slight corrosion to ferrule (1.1.12 (f) (i)) Advice Offside Rear Brake hose has slight corrosion to ferrule (1.1.12 (f) (i)) Advice Nearside Brake cable damaged but not to excess (1.1.15 (a)) Advice Offside Brake cable damaged but not to excess (1.1.15 (a)) Advice Front Sub-frame corroded but not seriously weakened (5.3.3 (b) (i)) Advice Rear Sub-frame corroded but not seriously weakened (5.3.3 (b) (i)) Advice Nearside Headlamp lens slightly defective (4.1.1 (b) (i)) Advice Offside Headlamp lens slightly defective (4.1.1 (b) (i)) Advice Various areas of corrosion to underside of vehicle and suspension components \n                                            MOT #6\n                                         MOT test number:  Result: \n                                                                                                        Pass\n                                                 Advice Nearside Front Tyre worn close to legal limit/worn on edge  185/55-15 (5.2.3 (e)) Advice Nearside Rear Tyre slightly damaged/cracking or perishing (5.2.3 (d) (ii)) Advice Offside Rear Tyre slightly damaged/cracking or perishing (5.2.3 (d) (ii)) Advice Nearside Brake cable damaged but not to excess (1.1.15 (a)) Advice Offside Brake cable damaged but not to excess (1.1.15 (a)) Advice Brake pipe corroded, covered in grease or other material  Both front to rear (1.1.11 (c)) Advice Nearside Rear Brake hose has slight corrosion to ferrule (1.1.12 (f) (i)) Advice Offside Rear Brake hose has slight corrosion to ferrule (1.1.12 (f) (i)) Advice Front Headlamp lens slightly defective  Both (4.1.1 (b) (i)) Advice Various areas of surface corrosion to underside of vehicle and suspension components \n                                            MOT #7\n                      ",
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
    "GovUkMot": {},
    "Motors": {
      "raw_text": "\n  \n\n\n  \n    \n      \n        \n      \n    \n\n    Sorry, page not found\n\n    But don't let that stop you from finding your next vehicle. Start fresh here...\n\n    \n      \n        Homepage\n      \n      \n        Used cars\n      \n      \n        Used vans\n      \n    \n\n    Or discover vehicles in a whole new way\n\n    Get the new Cazoo app - Powered by MOTORSDownload appScan QR codeto download\n\n    Error type: 404\n\n  \n\n\n\n\n\n  \n    \n  <iframe src=\"https://ss.motors.co.uk/ns.html?id=GTM-T98L657B\" height=\"0\" width=\"0\" style=\"display:none;visibility:hidden\"></iframe>\n  \n\n\n  \n  \n\n  \n\n  \n  \n  \n\n  !!m && (function () {\n    if (m && m.CazooAppCard) {\n      m.renderComponent(m.CazooAppCard, {\n        qrCodeSrc: '/motors-cdn/ux/images/cazoo/cazoo-card-404-qr-code.png',\n        linkSection: 'cazoo 404',\n        utmCampaign: '404_page',\n        url: 'https://cazoo.onelink.me/5HE8/1ffi8bc7'\n      }, 'cazoo-app-card');\n    }\n  })();\n\n  \n\n\n\n\nwindow.addEventListener(\"beforeunload\",function(){window.dataLayer.push({event:\"beforeunload\"})});"
    },
    "Parkers": {
      "raw_text": "\n\n(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl+ '&gtm_auth=aid-I-0lB9YbgOCpsoLHPg&gtm_preview=env-3&gtm_cookies_win=x';f.parentNode.insertBefore(j,f);})(window, document,'script','bauerDataLayer','GTM-WM34QH');\n\n\t\n\t\t\n\t\t\t\n\t\t\t\t\t\n\t\t\t\t\t\t\n\t\t\t\t\t\n\t\t\t\t\t\n\t\t\t\t\t\t\n\t\t\t\t\t\tGo\n\t\t\t\t\t\n\t\t\t\n\t\t\t\n\t\t\t\t\n\t\t\t\t\t\t\n\t\t\t\t\t\t\t404 Error\n\t\t\t\t\t\t\n\t\t\t\t\t\tPage not found\n\t\t\t\t\n\t\t\t\t\n\n\n\tSorry, the page or file you are looking for could not be found.\n\tIt may have been moved, deleted or old.\n\tVisit the homepage or use the search box above to continue.\n\n\t\t\t\n\t\t\t\n\t\t\t\t\n\t\t\t\t\t\n\t\t\t\t\n\n\t\t\t\t\n\t\t\t\t\t© 1972-2026  Bauer Consumer Media Ltd\n\t\t\t\t\n\t\t\t\t\n\t\t\t\t\tRegistered in England & Wales (company no. 01176085) at Media House, Peterborough Business Park, Peterborough, PE2 6EA\n\t\t\t\t\n\t\t\t\n\t\t\n\t\n\n\t\n\t\tif (bauerDataLayer) {\n\t\t\tbauerDataLayer.push({\n\t\t\t\tevent: 'GA_VirtualPageview',\n\t\t\t\tgaVirtualPageUrl: '/error/404' + window.location.pathname\n\t\t\t});\n\t\t}\n\t\n\n\n\n!function(b){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var a=window.pintrk;a.queue=[];a.version=\"3.0\";a=document.createElement(\"script\");a.async=!0;a.src=b;b=document.getElementsByTagName(\"script\")[0];b.parentNode.insertBefore(a,b)}}(\"https://s.pinimg.com/ct/core.js\");pintrk(\"load\",\"2612441428804\",{em:\"\\x3cuser_email_address\\x3e\"});pintrk(\"page\");\n\n<img height=\"1\" width=\"1\" style=\"display:none;\" alt=\"\" src=\"https://ct.pinterest.com/v3/?event=init&amp;tid=2612441428804&amp;pd[em]=&lt;hashed_email_address&gt;&amp;noscript=1\">\n\n\nwindow._tfa=window._tfa||[];window._tfa.push({notify:\"event\",name:\"page_view\",id:1677582});!function(a,b,d,c){document.getElementById(c)||(a.async=1,a.src=d,a.id=c,b.parentNode.insertBefore(a,b))}(document.createElement(\"script\"),document.getElementsByTagName(\"script\")[0],\"//cdn.taboola.com/libtrc/unip/1677582/tfa.js\",\"tb_tfa_script\");\n",
      "engine_size_hint": "0"
    },
    "MotorCheck": {
      "raw_text": "\n\n                \n    <iframe\n        src=\"https://www.googletagmanager.com/ns.html?id=GTM-5FG532Q\"\n        height=\"0\"\n        width=\"0\"\n        class=\"d-none\"\n    ></iframe>\n\n    \n    \n        \n            \n        \n            \n                \n                MotorCheck\n            \n\n            \n                \n                    \n                        \n    \n\n        \n            \n                GB\n                \n                    \n                \n\n                \n                    \n                        Start Check\n                    \n                \n            \n        \n    \n\n    \n    \n    \n\n\n\n\n\n\n                    \n                \n\n                \n                    \n                        \n    \n\n        \n            \n                GB\n                \n                    \n                \n\n                \n                    \n                        Start Check\n                    \n                \n            \n        \n    \n\n    \n    \n    \n    \n        \n            \n                \n                    \n                \n                \n                    Please wait while we search our databases\n                \n                \n                    PLEASE WAIT FOR YOUR REPORT TO APPEAR ON SCREEN\n                \n                \n                \n                    \n                        \n                            \n\n                            \n                        \n                    \n                \n            \n        \n    \n\n\n\n    \n        \n            \n                \n                ×\n                \n            \n            \n                VRM Not Found\n                Please check and try again.\n            \n        \n    \n\n\n\n    \n        \n            \n\n            \n            \n                \n                    \n                \n                \n                    \n                        View Old Report\n                    \n                    \n                        Create New Report\n                    \n                \n            \n        \n    \n\n\n\n                    \n                \n\n                \n                    \n                        \n  \n\n                    \n                \n\n                \n            \n    \n        Login\n    \n\n     \n\n                Trade Site\n\n                \n                    \n                        \n                    \n                \n            \n        \n    \n            \n    \n    \n    \n    \n    \n    \n                        \n            \n            \n                    \n    \n        \n            \n                \n                    \n                        Home\n                    \n                    \n                \n                \n                    Error!\n                    \n                \n            \n        \n    \n\n\n    \n    \n        \n            \n                404\n            \n            \n                Sorry, the page you were looking for was not found!\n                Go to home\n            \n            \n    Sitema",
      "fuel_hint": "electric"
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
