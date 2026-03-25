# Bug Bounty Report – bugcrowd.com

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/snapnames |
| Report Date | 2026-03-25 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 2 new asset(s) added to scope; 2 asset(s) removed from scope |

## Summary

2 new assets added to the scope of bugcrowd.com on bugcrowd. 2 assets removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_name | bugcrowd.com | bugcrowd.com |
| scope_assets | *.snapnames.com,*.namejet.com | *.snapnames.com,*.namejet.com |
| last_seen_at | 2026-03-25T02:00:07.452Z | 2026-03-25T02:00:07.452Z |
| source_snapshot_hash | 438e02977852 | 438e02977852 |

## New Scope Assets

- *.snapnames.com
- *.namejet.com

## Removed Scope Assets

- ~~https://snapnames.com/~~
- ~~https://www.namejet.com/~~

## Recommendations

**Scope expansion detected** – 2 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: *.snapnames.com, *.namejet.com

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "bugcrowd.com",
  "program_url": "https://bugcrowd.com/engagements/snapnames",
  "scope_assets": [
    "*.snapnames.com",
    "*.namejet.com"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-25T02:00:07.452Z",
  "source_snapshot_hash": "438e02977852",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "SnapNames Bug Bounty",
    "program_url": "https://bugcrowd.com/engagements/snapnames",
    "scope_assets": [
      "https://snapnames.com/",
      "https://www.namejet.com/"
    ],
    "exclusions": [],
    "reward_range": "unknown",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "2026-03-21T11:14:13.168Z",
    "source_snapshot_hash": "c9bf711a4bb2",
    "rewards": []
  },
  "diff": {
    "oldHash": "08d17e72a204a376abec85f26a82f723709959e42ad2e140d22c30ed7fee34f2",
    "newHash": "6702cd2c9eda857efb4f970cf689d53c0c50c7998f7b230a52a5b5dcbc486158",
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
