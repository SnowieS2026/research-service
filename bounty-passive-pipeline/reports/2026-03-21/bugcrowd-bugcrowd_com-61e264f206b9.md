# Bug Bounty Report – bugcrowd.com

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/bitso-mbb-og |
| Report Date | 2026-03-21 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 2 new asset(s) added to scope; 7 asset(s) removed from scope |

## Summary

2 new assets added to the scope of bugcrowd.com on bugcrowd. 7 assets removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_name | bugcrowd.com | bugcrowd.com |
| scope_assets | https://www.bugcrowd.com/,https://docs.bugcrowd.com/researchers/onboarding/welco… | https://www.bugcrowd.com/,https://docs.bugcrowd.com/researchers/onboarding/welco… |
| last_seen_at | 2026-03-21T12:18:06.227Z | 2026-03-21T12:18:06.227Z |
| source_snapshot_hash | 974ba9d818a9 | 974ba9d818a9 |

## New Scope Assets

- https://www.bugcrowd.com/
- https://docs.bugcrowd.com/researchers/onboarding/welcome

## Removed Scope Assets

- ~~https://bitso.com/~~
- ~~https://nvio.mx/~~
- ~~https://nvio.ar/~~
- ~~https://apps.apple.com/us/app/bitso-buy-bitcoin-easily/id1292836438~~
- ~~https://apps.apple.com/us/app/bitso-alpha-crypto-trade-pro/id1539469172~~
- ~~https://play.google.com/store/apps/details?id=com.bitso.wallet&pcampaignid=web_share~~
- ~~https://play.google.com/store/apps/details?id=com.bitso.alpha~~

## Recommendations

**Scope expansion detected** – 2 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://www.bugcrowd.com/, https://docs.bugcrowd.com/researchers/onboarding/welcome

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "bugcrowd.com",
  "program_url": "https://bugcrowd.com/engagements/bitso-mbb-og",
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
  "last_seen_at": "2026-03-21T12:18:06.227Z",
  "source_snapshot_hash": "974ba9d818a9",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Bitso Managed Bug Bounty Engagement",
    "program_url": "https://bugcrowd.com/engagements/bitso-mbb-og",
    "scope_assets": [
      "https://bitso.com/",
      "https://nvio.mx/",
      "https://nvio.ar/",
      "https://apps.apple.com/us/app/bitso-buy-bitcoin-easily/id1292836438",
      "https://apps.apple.com/us/app/bitso-alpha-crypto-trade-pro/id1539469172",
      "https://play.google.com/store/apps/details?id=com.bitso.wallet&pcampaignid=web_share",
      "https://play.google.com/store/apps/details?id=com.bitso.alpha"
    ],
    "exclusions": [],
    "reward_range": "unknown",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "2026-03-20T22:30:19.844Z",
    "source_snapshot_hash": "e8e7b222f3d6",
    "rewards": []
  },
  "diff": {
    "oldHash": "0fb29a38d729da6a70db04c981255755df0cc6ecd2d2db1bc444c990dbc82112",
    "newHash": "61e264f206b94dd6b5f0c9fd399ebbb1a838e335d6e62e55c53aaef1ac9076c8",
    "addedFields": [],
    "removedFields": [],
    "changedFields": [
      "program_name",
      "scope_assets",
      "last_seen_at",
      "source_snapshot_hash"
    ]
  }
}
```
