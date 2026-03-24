# OSINT Report – vehicle: SP56 GTZ

**Generated:** 2026-03-24T22:11:31.090Z  
**Duration:** 23s  
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
| 🟢 High (≥80) | 16 |
| 🟡 Medium (50-79) | 4 |
| ⚪ Low (<50) | 0 |

## Key Findings

### GovUK-DVLA

- **🟢 [95%]** `make`: TOYOTA
- **🟢 [95%]** `colour`: SILVER

### car-checking.com

- **🟢 [95%]** `mot_expiry`: 14/08/2026
- **🟢 [95%]** `make`: TOYOTA
- **🟢 [95%]** `year`: 2006
- **🟢 [90%]** `mot_pass_rate`: 71%
- **🟢 [90%]** `mot_passed`: 17
- **🟢 [90%]** `mot_failed`: 7
- **🟢 [90%]** `model`: Model AVENSIS T3 X D-4D Colour SILVER Year of manufacture

### VehicleValuation

- **🟢 [90%]** `make`: TOYOTA
- **🟢 [90%]** `model`: 
- **🟢 [90%]** `year`: 0
- **🟢 [90%]** `advisory_total_min`: 350
- **🟢 [90%]** `advisory_total_max`: 1750
- **🟢 [85%]** `cost__Brake_disc_worn_/_scored__high__soon`: £100-£250
- **🟢 [85%]** `cost__Sub-frame_/_chassis_corroded__high__when_due`: £200-£1000
- **🟡 [70%]** `mot_fail_risk`: medium
- **🟡 [70%]** `cost__Generalised_corrosion_/_rust__medium__when_due`: £50-£500

### Parkers

- **🟡 [70%]** `engine_size_hint`: 0

### MotorCheck

- **🟡 [70%]** `fuel_hint`: electric


## 🚗 Vehicle OSINT Report

**Target:** SP56 GTZ  
**Generated:** 2026-03-24T22:11:31.090Z  
**Flags:** (none)  

### 1. Vehicle Header Card

```
  Registration: SP56 GTZ
  Make: TOYOTA
  Model: Model AVENSIS T3 X D-4D Colour SILVER Year of manufacture
  Year: 2006
  Colour: SILVER
  Body Type: N/A
  Fuel Type: Unknown
  Engine Size: N/A
  Transmission: Unknown
```

### 2. Vehicle Status

```
  ✔ Registered with DVLA (data unavailable)
  ✔ Tax status: data unavailable
  ✔ MOT status: Valid (expires 14/08/2026)
  ✔ Last V5 issued date: not found in record
```

### 3. MOT History Intelligence

**Current MOT Status:** ✔ Valid
**MOT Expiry Date:** 14/08/2026

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

  ⚠️ Repeated failures: 7 fails on record

### 12. OSINT Confidence Score

| Category | Confidence |
| --- | --- |
| DVLA data | 🔴 0% |
| MOT data | 🟢 100% |
| Market data | 🟡 50% |
| Risk analysis | 🟡 65% |

**Overall OSINT confidence:** 🟡 **54/100**

### 13. Analyst Summary

TOYOTA Model AVENSIS T3 X D-4D Colour SILVER Year of manufacture (2006) in SILVER has an valid MOT expiring 14/08/2026 with 17 pass(es) and 7 fail(s) on record. No advisories were raised on the most recent MOT, suggesting the vehicle is in reasonable mechanical condition. Overall risk profile is rated **LOW**.

### 14. Overall OSINT Risk Rating

**🟢 LOW**

## Errors

- MIB Navigate insurance check: Error: HTTP 403 for https://enquiry.navigate.mib.org.uk/checkyourvehicle

## Raw Data

```json
{
  "VehicleCollector": {
    "DVLA": {
      "Registration number": "SP56 GTZ",
      "Make": "TOYOTA",
      "Colour": "SILVER"
    },
    "CarCheck": {
      "raw_text": "\n\n<iframe src=\"\"https://www.googletagmanager.com/ns.html?id=GTM-MCR9JCH\"\"\n    height=\"\"0\"\" width=\"\"0\"\" style=\"\"display:none;visibility:hidden\"\"></iframe>\n\n          HOME  VERIFY YOUR VEHICLE  CONTACT US Login  Your Report is Ready Now! Click on the button below to Download it!  Download  Report date: 24-03-2026 TOYOTA  AVENSIS T3 X D-4D  YOUR CAR REPORT IS READY!  Download Your Report  Download  Damage Check  Mileage History  Car Features  Finance Check  Stolen Check  Owners History General Information  Make TOYOTA Model AVENSIS T3 X D-4D Colour SILVER Year of manufacture 2006 Top speed 130mph 0 to 60 MPH 9.3seconds Gearbox MANUAL 6 GEARS Engine & fuel consumption Power 147.5 BHP Torque 3000 rpm Engine capacity 2231 cc Cylinders 4 Fuel type DIESEL Consumption city 37.2 mpg Consumption extra urban 57.7 mpg Consumption combined 47.9 mpg CO2 emission  g/km CO2 label G   MOT history MOT expiry date 14/08/2026 MOT pass rate \n                                                                                            71 %\n                                                                                     MOT passed 17 Failed MOT tests 7 Total advice items 83 Total items failed 39 \n                                            MOT #1\n                                         MOT test number:  Result: \n                                                                                                        Pass\n                                                 Advice Nearside Front Brake disc worn, but not excessively (1.1.14 (a) (i)) Advice Offside Front Brake disc worn, pitted or scored, but not seriously weakened (1.1.14 (a) (ii)) Advice Central Front Subframe mounting prescribed area is corroded but not considered excessive (5.3.6 (a) (i)) \n                                            MOT #2\n                                         MOT test number:  Result: \n                                                                                                        Pass\n                                                 Advice Nearside Front Brake disc worn, pitted or scored, but not seriously weakened  inner surface (1.1.14 (a) (ii)) Advice General corrosion to sub-frames and suspension components Advice Offside Front Brake disc worn, pitted or scored, but not seriously weakened  inner surface (1.1.14 (a) (ii)) \n                                            MOT #3\n                                         MOT test number:  Result: \n                                                                                                        Pass\n                                                 Advice General corrosion to underside subframes and suspension components \n                                            MOT #4\n                                         MOT test number:  Result: \n                                                                                                        Fail\n                                                 Advice General corrosion to underside subframes and suspension components Advice Offside  parking brake low effort Failure Electronic stability control warning lamp indicates a fault (7.12 (e)) Failure Anti-lock braking system warning lamp indicates an ABS fault (1.6 (b)) Failure Parking brake efficiency below requirements (1.4.2 (a) (i)) \n                                            MOT #5\n                                         MOT test number:  Result: \n                                                                                                        Pass\n                                                 Advice Front Sub-frame corroded but not seriously weakened (5.3.3 (b) (i)) Advice Offside Windscreen damaged but not adversely affecting driver's view  wiper score across swept area (3.2 (a) (i)) Advice Nearside Brake pipe inadequately clipped or supported  front to rear at rear (1.1.11 (d) (i)) Advice Rear Sub-frame corroded but not seriously weakened (5.3.3 (b) (i)) \n                                            MOT #6\n                                         MOT test number:  Result: \n                                                                                                        Fail\n                                                 Advice Front Sub-frame corroded but not seriously weakened (5.3.3 (b) (i)) Advice Nearside Brake pipe inadequately clipped or supported  front to rear at rear (1.1.11 (d) (i)) Advice Offside Tyre obviously under inflated  front and rear (5.2.3 (l)) Advice Nearside Rear Service brake fluctuating, but not excessively (1.2.1 (e)) Advice Rear Brake disc worn, pitted or scored, but not seriously weakened  badly pitted (1.1.14 (a) (ii)) Advice Rear Sub-frame corroded but not seriously weakened (5.3.3 (b) (i)) Advice Offside Windscreen damaged but not adversely affecting driver's view  wiper score across swept area (3.2 (a) (i)) Failure Offside Rear Direction indicator incorrect colour (4.4.3 (a)) Failure Offside Front Service brake excessively binding (1.2.1 (f)",
      "mot_expiry": "14/08/2026"
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
      "make": "TOYOTA",
      "model": "",
      "year": 0,
      "currentValueMin": 700,
      "currentValueMax": 840,
      "valueWithAdvisoriesMin": 300,
      "valueWithAdvisoriesMax": 595,
      "expectedMonthsRemaining": 3,
      "motFailRisk": "medium",
      "totalAdvisoryCostMin": 350,
      "totalAdvisoryCostMax": 1750,
      "recommendation": "Repair costs (up to £1,750) exceed half the car's value. Negotiate hard or avoid."
    },
    "advisory_costs": [
      {
        "item": "Brake disc worn / scored",
        "severity": "high",
        "urgency": "soon",
        "estimatedCostMin": 100,
        "estimatedCostMax": 250,
        "labourHours": 1.5,
        "notes": "£60-120 per disc + £40-60 labour. Replace with pads.",
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
      }
    ]
  }
}
```

## Recommendations

High-confidence findings to investigate further:
- make → TOYOTA (GovUK-DVLA)
- colour → SILVER (GovUK-DVLA)
- mot_expiry → 14/08/2026 (car-checking.com)
- make → TOYOTA (car-checking.com)
- year → 2006 (car-checking.com)
- mot_pass_rate → 71% (car-checking.com)
- mot_passed → 17 (car-checking.com)
- mot_failed → 7 (car-checking.com)
- model → Model AVENSIS T3 X D-4D Colour SILVER Year of manufacture (car-checking.com)
- make → TOYOTA (VehicleValuation)
