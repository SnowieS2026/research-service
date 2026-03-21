# Bug Bounty Report – Progress Software VDP Hub

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/featured/progress-software-vdphub |
| Report Date | 2026-03-21 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 2 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

2 new assets added to the scope of Progress Software VDP Hub on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_name | Progress Software VDP Hub | Progress Software VDP Hub |
| program_url | https://bugcrowd.com/engagements/featured/progress-software-vdphub | https://bugcrowd.com/engagements/featured/progress-software-vdphub |
| scope_assets | https://www.bugcrowd.com/,https://docs.bugcrowd.com/researchers/onboarding/welco… | https://www.bugcrowd.com/,https://docs.bugcrowd.com/researchers/onboarding/welco… |
| last_seen_at | 2026-03-21T18:08:37.165Z | 2026-03-21T18:08:37.165Z |
| source_snapshot_hash | a3e3fa45e348 | a3e3fa45e348 |

## New Scope Assets

- https://www.bugcrowd.com/
- https://docs.bugcrowd.com/researchers/onboarding/welcome

## Removed Scope Assets

- ~~https://bugcrowd-support.freshdesk.com/support/tickets/new~~

## Recommendations

**Scope expansion detected** – 2 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://www.bugcrowd.com/, https://docs.bugcrowd.com/researchers/onboarding/welcome

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Progress Software VDP Hub",
  "program_url": "https://bugcrowd.com/engagements/featured/progress-software-vdphub",
  "scope_assets": [
    "https://www.bugcrowd.com/",
    "https://docs.bugcrowd.com/researchers/onboarding/welcome"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-21T18:08:37.165Z",
  "source_snapshot_hash": "a3e3fa45e348",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "The requested page was not found",
    "program_url": "https://bugcrowd.com/engagements/progress-software-vdphub",
    "scope_assets": [
      "https://bugcrowd-support.freshdesk.com/support/tickets/new"
    ],
    "exclusions": [],
    "reward_range": "unknown",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "2026-03-20T22:34:44.364Z",
    "source_snapshot_hash": "db875d01d909",
    "rewards": []
  },
  "diff": {
    "oldHash": "29e0558d896d0a1161a2419f55bf59085a7254e406544ac7c66d08ff75e825c4",
    "newHash": "25a4e972acf8406d35aecc4b1dd10bf825d5cc3168045ff5fb2feefbf50a50e0",
    "addedFields": [],
    "removedFields": [],
    "changedFields": [
      "program_name",
      "program_url",
      "scope_assets",
      "last_seen_at",
      "source_snapshot_hash"
    ]
  }
}
```
