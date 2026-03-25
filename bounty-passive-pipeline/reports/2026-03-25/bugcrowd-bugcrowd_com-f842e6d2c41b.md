# Bug Bounty Report – bugcrowd.com

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/onetrust |
| Report Date | 2026-03-25 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 2 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

2 new assets added to the scope of bugcrowd.com on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_name | bugcrowd.com | bugcrowd.com |
| scope_assets | *.onetrust.com,*.cookiebot.com | *.onetrust.com,*.cookiebot.com |
| last_seen_at | 2026-03-25T01:59:49.985Z | 2026-03-25T01:59:49.985Z |
| source_snapshot_hash | 707a0a2ca070 | 707a0a2ca070 |

## New Scope Assets

- *.onetrust.com
- *.cookiebot.com

## Removed Scope Assets

- ~~https://pentest-app.onetrust.com/~~

## Recommendations

**Scope expansion detected** – 2 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: *.onetrust.com, *.cookiebot.com

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "bugcrowd.com",
  "program_url": "https://bugcrowd.com/engagements/onetrust",
  "scope_assets": [
    "*.onetrust.com",
    "*.cookiebot.com"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-25T01:59:49.985Z",
  "source_snapshot_hash": "707a0a2ca070",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "OneTrust",
    "program_url": "https://bugcrowd.com/engagements/onetrust",
    "scope_assets": [
      "https://pentest-app.onetrust.com/"
    ],
    "exclusions": [],
    "reward_range": "unknown",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "2026-03-23T09:42:38.061Z",
    "source_snapshot_hash": "fff6a378fb11",
    "rewards": []
  },
  "diff": {
    "oldHash": "0198dc6f34324d65015e7bc0d925fa8d75d142a8e2479793e214378e5227530c",
    "newHash": "f842e6d2c41b38e53494b0f3699695257c5930aa2915bb9e8a46aa11564f5c23",
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
