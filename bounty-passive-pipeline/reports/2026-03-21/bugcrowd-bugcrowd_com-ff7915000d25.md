# Bug Bounty Report – bugcrowd.com

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements |
| Report Date | 2026-03-21 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 2 new asset(s) added to scope |

## Summary

2 new assets added to the scope of bugcrowd.com on bugcrowd.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | bugcrowd.com | bugcrowd.com |
| scope_assets | https://www.bugcrowd.com/,https://docs.bugcrowd.com/researchers/onboarding/welco… | https://www.bugcrowd.com/,https://docs.bugcrowd.com/researchers/onboarding/welco… |
| last_seen_at | 2026-03-21T18:05:44.883Z | 2026-03-21T18:05:44.883Z |
| source_snapshot_hash | 5260cf090d6d | 5260cf090d6d |

## New Scope Assets

- https://www.bugcrowd.com/
- https://docs.bugcrowd.com/researchers/onboarding/welcome

## Recommendations

**Scope expansion detected** – 2 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://www.bugcrowd.com/, https://docs.bugcrowd.com/researchers/onboarding/welcome

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "bugcrowd.com",
  "program_url": "https://bugcrowd.com/engagements",
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
  "last_seen_at": "2026-03-21T18:05:44.883Z",
  "source_snapshot_hash": "5260cf090d6d",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Unknown",
    "program_url": "https://bugcrowd.com/engagements",
    "scope_assets": [],
    "exclusions": [],
    "reward_range": "unknown",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "2026-03-20",
    "source_snapshot_hash": "0b9a10d3d8b248295acfd0724ea8f99984d5a6e54ea644894386c5a85590ebd1"
  },
  "diff": {
    "oldHash": "2e2ca7253aefe1cdd9b24f0eb1237a17c8da75a21652e5756175ffb66530b2d1",
    "newHash": "ff7915000d25ad1ea6c1b9243d39e4b38ec5d04359597b4842605c2619995ea5",
    "addedFields": [
      "rewards"
    ],
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
