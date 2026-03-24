# OSINT Report – vehicle: SE07 JAU

**Generated:** 2026-03-24T22:16:10.761Z  
**Duration:** 13s  
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
| 🟢 High (≥80) | 14 |
| 🟡 Medium (50-79) | 6 |
| ⚪ Low (<50) | 0 |

## Key Findings

### GovUK-DVLA

- **🟢 [95%]** `make`: VOLKSWAGEN
- **🟢 [95%]** `colour`: YELLOW

### car-checking.com

- **🟢 [95%]** `mot_expiry`: 16/06/2026
- **🟢 [95%]** `make`: VOLKSWAGEN
- **🟢 [95%]** `year`: 2007
- **🟢 [90%]** `mot_pass_rate`: 67%
- **🟢 [90%]** `mot_passed`: 16
- **🟢 [90%]** `mot_failed`: 8
- **🟢 [90%]** `model`: Model URBAN FOX 55 Colour YELLOW Year of manufacture

### VehicleValuation

- **🟢 [90%]** `make`: VOLKSWAGEN
- **🟢 [90%]** `model`: 
- **🟢 [90%]** `year`: 0
- **🟢 [90%]** `advisory_total_min`: 190
- **🟢 [90%]** `advisory_total_max`: 375
- **🟡 [70%]** `mot_fail_risk`: low
- **🟡 [70%]** `cost__Tyre(s)_worn_close_to_legal_limit__medium__soon`: £90-£155
- **🟡 [70%]** `cost__Tyre(s)_slightly_damaged_/_perishing__low__soon`: £40-£80
- **🟡 [70%]** `cost__Brake_hose_corroded_/_perished__medium__when_due`: £60-£140

### Parkers

- **🟡 [70%]** `engine_size_hint`: 0

### MotorCheck

- **🟡 [70%]** `fuel_hint`: electric


## 🚗 Vehicle OSINT Report

**Target:** SE07 JAU  
**Generated:** 2026-03-24T22:16:10.761Z  
**Flags:** (none)  

### 1. Vehicle Header Card

```
  Registration: SE07 JAU
  Make: VOLKSWAGEN
  Model: Model URBAN FOX 55 Colour YELLOW Year of manufacture
  Year: 2007
  Colour: YELLOW
  Body Type: N/A
  Fuel Type: Unknown
  Engine Size: N/A
  Transmission: Unknown
```

### 2. Vehicle Status

```
  ✔ Registered with DVLA (data unavailable)
  ✔ Tax status: data unavailable
  ✔ MOT status: Valid (expires 16/06/2026)
  ✔ Last V5 issued date: not found in record
```

### 3. MOT History Intelligence

**Current MOT Status:** ✔ Valid
**MOT Expiry Date:** 16/06/2026

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

  ⚠️ Repeated failures: 8 fails on record

### 12. OSINT Confidence Score

| Category | Confidence |
| --- | --- |
| DVLA data | 🔴 0% |
| MOT data | 🟢 100% |
| Market data | 🟡 50% |
| Risk analysis | 🟡 65% |

**Overall OSINT confidence:** 🟡 **54/100**

### 13. Analyst Summary

VOLKSWAGEN Model URBAN FOX 55 Colour YELLOW Year of manufacture (2007) in YELLOW has an valid MOT expiring 16/06/2026 with 16 pass(es) and 8 fail(s) on record. No advisories were raised on the most recent MOT, suggesting the vehicle is in reasonable mechanical condition. Overall risk profile is rated **LOW**.

### 14. Overall OSINT Risk Rating

**🟢 LOW**

## Errors

- MIB Navigate insurance check: Error: HTTP 403 for https://enquiry.navigate.mib.org.uk/checkyourvehicle

## Raw Data

```json
{
  "VehicleCollector": {
    "DVLA": {
      "Registration number": "SE07 JAU",
      "Make": "VOLKSWAGEN",
      "Colour": "YELLOW"
    },
    "CarCheck": {
      "raw_text": "\n\n<iframe src=\"\"https://www.googletagmanager.com/ns.html?id=GTM-MCR9JCH\"\"\n    height=\"\"0\"\" width=\"\"0\"\" style=\"\"display:none;visibility:hidden\"\"></iframe>\n\n          HOME  VERIFY YOUR VEHICLE  CONTACT US Login  Your Report is Ready Now! Click on the button below to Download it!  Download  Report date: 24-03-2026 VOLKSWAGEN  URBAN FOX 55  YOUR CAR REPORT IS READY!  Download Your Report  Download  Damage Check  Mileage History  Car Features  Finance Check  Stolen Check  Owners History General Information  Make VOLKSWAGEN Model URBAN FOX 55 Colour YELLOW Year of manufacture 2007 Top speed 92mph 0 to 60 MPH 17.5seconds Gearbox MANUAL 5 GEARS Engine & fuel consumption Power 55 BHP Torque 3000 rpm Engine capacity 1198 cc Cylinders 3 Fuel type PETROL Consumption city 36.2 mpg Consumption extra urban 55.4 mpg Consumption combined 46.3 mpg CO2 emission 139 g/km CO2 label F   MOT history MOT expiry date 16/06/2026 MOT pass rate \n                                                                                            67 %\n                                                                                     MOT passed 16 Failed MOT tests 8 Total advice items 66 Total items failed 30 \n                                            MOT #1\n                                         MOT test number:  Result: \n                                                                                                        Pass\n                                                 Advice Front Tyre slightly damaged/cracking or perishing  Both (5.2.3 (d) (ii)) Advice Nearside Rear Tyre slightly damaged/cracking or perishing (5.2.3 (d) (ii)) Advice Nearside Rear Axle swivel pins and bushes swivel pin and/or bush slightly worn (5.1.2 (b) (i)) Advice Offside Rear Axle swivel pins and bushes swivel pin and/or bush slightly worn (5.1.2 (b) (i)) Advice Nearside Rear Service brake binding but not excessively (1.2.1 (f)) Advice Exhaust has a minor leak of exhaust gases (6.1.2 (a)) Advice Vehicle structure is corroded but structural rigidity is not significantly reduced (6.1.1 (c) (i)) Advice Parking brake efficiency only just met. It would appear that the braking system requires adjustment or repair. (1.4.2 (a) (i)) Advice All suspension & component's are corroded but not seriously weakened \n                                            MOT #2\n                                         MOT test number:  Result: \n                                                                                                        Fail\n                                                 Advice Front Tyre slightly damaged/cracking or perishing  Both (5.2.3 (d) (ii)) Advice Nearside Rear Tyre slightly damaged/cracking or perishing (5.2.3 (d) (ii)) Advice Nearside Rear Axle swivel pins and bushes swivel pin and/or bush slightly worn (5.1.2 (b) (i)) Advice Offside Rear Axle swivel pins and bushes swivel pin and/or bush slightly worn (5.1.2 (b) (i)) Advice Nearside Rear Service brake binding but not excessively (1.2.1 (f)) Advice Exhaust has a minor leak of exhaust gases (6.1.2 (a)) Advice Vehicle structure is corroded but structural rigidity is not significantly reduced (6.1.1 (c) (i)) Advice Parking brake efficiency only just met. It would appear that the braking system requires adjustment or repair. (1.4.2 (a) (i)) Advice All suspension & component's are corroded but not seriously weakened Failure Nearside Front Position lamp not working (4.2.1 (a) (ii)) Failure Nearside Front Headlamp not working on main beam (4.1.1 (a) (ii)) Failure Offside Rear Shock absorbers has a serious fluid leak (5.3.2 (b)) Failure Nearside Front Outer Drive shaft joint constant velocity boot split or insecure, no longer prevents the ingress of dirt (6.1.7 (g) (ii)) Failure Nearside Rear Coil spring fractured or broken (5.3.1 (b) (i)) Failure Offside Rear Coil spring fractured or broken (5.3.1 (b) (i)) \n                                            MOT #3\n                                         MOT test number:  Result: \n                                                                                                        Pass\n                                                 Advice Nearside Front Tyre worn close to legal limit/worn on edge (5.2.3 (e)) Advice Offside Front Tyre worn close to legal limit/worn on edge (5.2.3 (e)) Advice Nearside Front Tyre slightly damaged/cracking or perishing (5.2.3 (d) (ii)) Advice Offside Front Tyre slightly damaged/cracking or perishing (5.2.3 (d) (ii)) Advice Offside Front Lower Suspension arm pin or bush worn but not resulting in excessive movement  Rear bush (5.3.4 (a) (i)) Advice Nearside Rear Axle swivel pins and bushes swivel pin and/or bush slightly worn (5.1.2 (b) (i)) Advice Offside Rear Axle swivel pins and bushes swivel pin and/or bush slightly worn (5.1.2 (b) (i)) Advice Nearside Front Brake hose has slight corrosion to ferrule (1.1.12 (f) (i)) Advice Offside Front Brake hose has slight corrosion to ferrule (1.1.12 (f) (i)) Advice Nearside Rear Brake hose",
      "mot_expiry": "16/06/2026"
    },
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
      "make": "VOLKSWAGEN",
      "model": "",
      "year": 0,
      "currentValueMin": 700,
      "currentValueMax": 840,
      "valueWithAdvisoriesMin": 437,
      "valueWithAdvisoriesMax": 707,
      "expectedMonthsRemaining": 18,
      "motFailRisk": "low",
      "totalAdvisoryCostMin": 190,
      "totalAdvisoryCostMax": 375,
      "recommendation": "Advisories are manageable wear items. Price accordingly — aim to save at least the advisory cost in negotiation. Car is worth £700-£840 as-is."
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
        "item": "Brake hose corroded / perished",
        "severity": "medium",
        "urgency": "when_due",
        "estimatedCostMin": 60,
        "estimatedCostMax": 140,
        "labourHours": 1,
        "notes": "£30-60 per hose + £50-80 labour. Replace in pairs.",
        "partsIncluded": false
      }
    ]
  }
}
```

## Recommendations

High-confidence findings to investigate further:
- make → VOLKSWAGEN (GovUK-DVLA)
- colour → YELLOW (GovUK-DVLA)
- mot_expiry → 16/06/2026 (car-checking.com)
- make → VOLKSWAGEN (car-checking.com)
- year → 2007 (car-checking.com)
- mot_pass_rate → 67% (car-checking.com)
- mot_passed → 16 (car-checking.com)
- mot_failed → 8 (car-checking.com)
- model → Model URBAN FOX 55 Colour YELLOW Year of manufacture (car-checking.com)
- make → VOLKSWAGEN (VehicleValuation)
