# OSINT Report – vehicle: SP07 EPX

**Generated:** 2026-03-24T23:33:22.575Z  
**Duration:** 15s  
**Flags:** (none)  

## Summary

| Collector | Findings | Errors |
| --- | --- | --- |
| VehicleCollector | 15 | 0 |

**Total unique findings:** 15  
**Total errors:** 1  

### Confidence Distribution

| Level | Count |
| --- | --- |
| 🟢 High (≥80) | 11 |
| 🟡 Medium (50-79) | 4 |
| ⚪ Low (<50) | 0 |

## Key Findings

### GovUK-DVLA

- **🟢 [95%]** `make`: IVECO
- **🟢 [95%]** `colour`: BLUE

### car-checking.com

- **🟢 [95%]** `mot_expiry`: 26/03/2010
- **🟢 [90%]** `mot_pass_rate`: 100%
- **🟢 [90%]** `mot_passed`: 1
- **🟢 [90%]** `mot_failed`: 0

### VehicleValuation

- **🟢 [90%]** `make`: IVECO
- **🟢 [90%]** `model`: 
- **🟢 [90%]** `year`: 0
- **🟢 [90%]** `advisory_total_min`: 50
- **🟢 [90%]** `advisory_total_max`: 500
- **🟡 [70%]** `mot_fail_risk`: low
- **🟡 [70%]** `cost__Miscellaneous_advisory_(see_notes)__medium__when_due`: £50-£500

### Parkers

- **🟡 [70%]** `engine_size_hint`: 0

### MotorCheck

- **🟡 [70%]** `fuel_hint`: electric


## 🚗 Vehicle OSINT Report

**Target:** SP07 EPX  
**Generated:** 2026-03-24T23:33:22.575Z  
**Flags:** (none)  

### 1. Vehicle Header Card

```
  Registration: SP07 EPX
  Make: IVECO
  Model: 
  Year: 0
  Colour: BLUE
  Body Type: N/A
  Fuel Type: Unknown
  Engine Size: N/A
  Transmission: Unknown
```

### 2. Vehicle Status

```
  ✔ Registered with DVLA (data unavailable)
  ✔ Tax status: data unavailable
  ✔ MOT status: Expired (expires 26/03/2010)
  ✔ Last V5 issued date: not found in record
```

### 3. MOT History Intelligence

**Current MOT Status:** 🔴 Expired
**MOT Expiry Date:** 26/03/2010

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
| MOT data | 🟢 100% |
| Market data | 🟡 50% |
| Risk analysis | 🟡 65% |

**Overall OSINT confidence:** 🟡 **54/100**

### 13. Analyst Summary

IVECO  (0) in BLUE has an expired MOT expiring 26/03/2010 with 1 pass(es) and 0 fail(s) on record. No advisories were raised on the most recent MOT, suggesting the vehicle is in reasonable mechanical condition. Overall risk profile is rated **LOW**.

### 14. Overall OSINT Risk Rating

**🟢 LOW**

## Errors

- MIB Navigate insurance check: Error: HTTP 403 for https://enquiry.navigate.mib.org.uk/checkyourvehicle

## Raw Data

```json
{
  "VehicleCollector": {
    "DVLA": {
      "Registration number": "SP07 EPX",
      "Make": "IVECO",
      "Colour": "BLUE"
    },
    "CarCheck": {
      "raw_text": "\n\n<iframe src=\"\"https://www.googletagmanager.com/ns.html?id=GTM-MCR9JCH\"\"\n    height=\"\"0\"\" width=\"\"0\"\" style=\"\"display:none;visibility:hidden\"\"></iframe>\n\n          HOME  VERIFY YOUR VEHICLE  CONTACT US Login  Your Report is Ready Now! Click on the button below to Download it!  Download  Report date: 24-03-2026 IVECO    YOUR CAR REPORT IS READY!  Download Your Report  Download  Damage Check  Mileage History  Car Features  Finance Check  Stolen Check  Owners History General Information  Make IVECO Model  Colour  Year of manufacture 2007 Top speed mph 0 to 60 MPH seconds Gearbox  Engine & fuel consumption Power 248.1 BHP Torque 2100 rpm Engine capacity 5880 cc Cylinders 6 Fuel type Diesel Consumption city  mpg Consumption extra urban  mpg Consumption combined  mpg CO2 emission  g/km  MOT history MOT expiry date 26/03/2010 MOT pass rate \n                                                                                            100 %\n                                                                                     MOT passed 1 Failed MOT tests 0 Total advice items 0 Total items failed 0  Tax & MOT Check  Taxed Tax due: 09 May 2017  MOT Expires: 26/03/2010 Tax status  Valid until 09 May 2017 Days left 0 MOT expiry date 26/03/2010 Full MOT history See MOT history Damage history Check the damage history for this IVECO. See if, where and when this IVECO had damage and the car repair costs. We also check if this IVECO was scrapped.Download the premium report here for the results. Damage 1 Date ??/??/???? Category ????????? ??? Type ????????? ???  Damage 2 Date ??/??/???? Category ????????? ??? Type ????????? ???   Your complete report ready to download It is very important to check the vehicle you wish to purchase for damage.  Download Owner history For how long did the current and previous owner(s) have this IVECO? How many owners did this IVECO have? Check it in the premium report and see all owner registrations. Date of transaction ??????????? Number of previous keepers ??????????? Date of last keeper change ???????????  Download Mileage check Odometer In miles Mileage registrations 0 First registration 26-03-2007 Last registration Not specified Complete history See info Registration #6 ??/??/???? ??????????? ??? Registration #7 ??/??/???? ??????????? ??? Registration #8 ??/??/???? ??????????? ??? Registration #9 ??/??/???? ??????????? ???  Download Tax calculation Vehicle class HCV Band Not specified Single payment (12 months) ??? ?????? Single six month payment ??? ?????? Total payable by 12 monthly instalments ??? ??????  Finance check Check if this IVECO is financed, has an outstanding loan or finance agreement. If you are purchasing a vehicle it is smart to ensure that any finance that may have been taken out on this IVECO has been settled. If not, and you buy this IVECO then you could lose the money and the car you paid for. Download the premium report here and check if this IVECO is financed. Finance company ????????? ??? Date of agreement ??/??/???? Agreement type ????????? ??? Agreement term ????????? ??? Agreement number ????????? ??? Contact info ????????? ???  Download Plate changes  See in this check if this IVECO had different number plates. Current VRM SP07EPX Transfer type ??? ????? Date of receipt ??? ????? Previous VRM ??? ????? Date of transaction ??? ?????  Download Vehicle valuation What is this car worth? See the vehicle value of this IVECO in the premium report. We check: purchase value, age, mileage, MOT history, damages and online sale prices. Trade retail value ??/??/???? Auction value ????????? ??? Average private trade value ????????? ???  Download Safety ratings See in this check if this IVECO had different number plates. NCAP rating \n                                                                                    No data found\n                                                                             Car features The factory car options list is only available in the premium report. Colour  ?????? ??? ????????? ??? ?????? ??? ????????? ??? ?????? ??? ????????? ???  Download Dimensions & weight Width 0 mm Height 0 mm Length 0 mm Wheel base 0 mm Kerb weight 0 kg Unladen weight 0 kg  Download Additional information Fuel tank capacity Not specified l Fuel delivery  Number of doors Not specified Number of seats 3 Number of axles 2 Engine code Not specified  Download Premium Report Check everything!   Download   Download 5 reports per month  Get a quote for your vehicle  After 48H £39.90/month  Access our used car sales guide  Professional customer service\n    \n    \n        \n            \n\n                \n                    Navigation\n                    \n                        \n                            Home\n                            About Us\n                            Verify\n                            FAQ\n                            Claim\n                            Contact us\n                            Personal Space\n                            Pricing Plans\n           ",
      "mot_expiry": "26/03/2010"
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
      "make": "IVECO",
      "model": "",
      "year": 0,
      "currentValueMin": 700,
      "currentValueMax": 1200,
      "valueWithAdvisoriesMin": 350,
      "valueWithAdvisoriesMax": 1165,
      "expectedMonthsRemaining": 18,
      "motFailRisk": "low",
      "totalAdvisoryCostMin": 50,
      "totalAdvisoryCostMax": 500,
      "recommendation": "Advisories are manageable wear items. Price accordingly — aim to save at least the advisory cost in negotiation. Car is worth £700-£1,200 as-is."
    },
    "advisory_costs": [
      {
        "item": "Miscellaneous advisory (see notes)",
        "severity": "medium",
        "urgency": "when_due",
        "estimatedCostMin": 50,
        "estimatedCostMax": 500,
        "labourHours": 1,
        "notes": "Could not classify: \"items 0 Total items failed 0  Tax & MOT Check  Taxed Tax due: 09 May 2017  MOT Expires: 26/03/2010 Tax status  Valid until 09 May 2017 Days left 0 MOT expiry date 26/03/2010 Full MOT history See MOT h\". Assessment recommended.",
        "partsIncluded": false
      }
    ]
  }
}
```

## Recommendations

High-confidence findings to investigate further:
- make → IVECO (GovUK-DVLA)
- colour → BLUE (GovUK-DVLA)
- mot_expiry → 26/03/2010 (car-checking.com)
- mot_pass_rate → 100% (car-checking.com)
- mot_passed → 1 (car-checking.com)
- mot_failed → 0 (car-checking.com)
- make → IVECO (VehicleValuation)
- model →  (VehicleValuation)
- year → 0 (VehicleValuation)
- advisory_total_min → 50 (VehicleValuation)
