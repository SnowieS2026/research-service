# Bug Bounty Report – City of Vienna Managed Bug Bounty

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/city-of-vienna-mbb-og |
| Report Date | 2026-03-21 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 20 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

20 new assets added to the scope of City of Vienna Managed Bug Bounty on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | City of Vienna Managed Bug Bounty | City of Vienna Managed Bug Bounty |
| scope_assets | https://www.wien.gv.at/,https://*.wien.gv.at/,https://*.magwien.gv.at/,https://w… | https://www.wien.gv.at/,https://*.wien.gv.at/,https://*.magwien.gv.at/,https://w… |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-21T11:14:53.123Z | 2026-03-21T11:14:53.123Z |
| source_snapshot_hash | 78624376494c | 78624376494c |

## New Scope Assets

- https://www.wien.gv.at/
- https://*.wien.gv.at/
- https://*.magwien.gv.at/
- https://www.gesundheitsverbund.at/
- https://*.gesundheitsverbund.at/
- https://*.wienkav.at/
- https://www.akhwien.at/
- https://*.akhwien.at/
- https://stp.wien.gv.at/
- https://wien.at/
- https://*.wien.at/
- https://secumails.gesundheitsverbund.at/
- https://mein.wien.gv.at/
- https://mein.wien.gv.at/broker/api/*
- https://wibi.wien.gv.at/
- https://*.stadtwien.onmicrosoft.com/
- https://schulenwien.onmicrosoft.com/
- https://stadtwien-my.sharepoint.com/
- https://play.google.com/store/apps/developer?id=Stadt+Wien&hl=de_AT
- https://apps.apple.com/at/developer/stadt-wien/id858505368

## Removed Scope Assets

- ~~Please submit your finding to the City of Vienna's Bug Bounty!~~

## Recommendations

**Scope expansion detected** – 20 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://www.wien.gv.at/, https://*.wien.gv.at/, https://*.magwien.gv.at/

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "City of Vienna Managed Bug Bounty",
  "program_url": "https://bugcrowd.com/engagements/city-of-vienna-mbb-og",
  "scope_assets": [
    "https://www.wien.gv.at/",
    "https://*.wien.gv.at/",
    "https://*.magwien.gv.at/",
    "https://www.gesundheitsverbund.at/",
    "https://*.gesundheitsverbund.at/",
    "https://*.wienkav.at/",
    "https://www.akhwien.at/",
    "https://*.akhwien.at/",
    "https://stp.wien.gv.at/",
    "https://wien.at/",
    "https://*.wien.at/",
    "https://secumails.gesundheitsverbund.at/",
    "https://mein.wien.gv.at/",
    "https://mein.wien.gv.at/broker/api/*",
    "https://wibi.wien.gv.at/",
    "https://*.stadtwien.onmicrosoft.com/",
    "https://schulenwien.onmicrosoft.com/",
    "https://stadtwien-my.sharepoint.com/",
    "https://play.google.com/store/apps/developer?id=Stadt+Wien&hl=de_AT",
    "https://apps.apple.com/at/developer/stadt-wien/id858505368"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-21T11:14:53.123Z",
  "source_snapshot_hash": "78624376494c",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Unknown",
    "program_url": "https://bugcrowd.com/engagements/city-of-vienna-mbb-og",
    "scope_assets": [
      "Please submit your finding to the City of Vienna's Bug Bounty!"
    ],
    "exclusions": [
      "No technology is perfect and City of Vienna believes that working with skilled security researchers across the globe is crucial in identifying weaknesses in any technology. We are excited for you to participate as a security researcher to help us identify vulnerabilities in our assets."
    ],
    "reward_range": "Good luck, and happy hunting!",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "Please submit your finding to the City of Vienna's Bug Bounty!",
    "source_snapshot_hash": "30b38f2c7921bd29883671de820d7f34240a4e8c1fa981b7191778f217c6b238"
  },
  "diff": {
    "oldHash": "03c2e9c1b0a33fdc274ae60372c7ea94d29bb0d6d0f8aaf8939fd525a3d75d1b",
    "newHash": "0d999853dff4505eba1b1acb1b2863a2bc88a7bbbdecbcab2d38c3a7b3a9b6d6",
    "addedFields": [
      "rewards"
    ],
    "removedFields": [],
    "changedFields": [
      "program_name",
      "scope_assets",
      "exclusions",
      "reward_range",
      "last_seen_at",
      "source_snapshot_hash"
    ]
  }
}
```
