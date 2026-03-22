# Bug Bounty Report – Staff Picks

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/featured/staff-picks |
| Report Date | 2026-03-22 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 2 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

2 new assets added to the scope of Staff Picks on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| scope_assets | https://www.bugcrowd.com/,https://docs.bugcrowd.com/researchers/onboarding/welco… | https://www.bugcrowd.com/,https://docs.bugcrowd.com/researchers/onboarding/welco… |
| last_seen_at | 2026-03-22T00:31:27.519Z | 2026-03-22T00:31:27.519Z |
| source_snapshot_hash | c21dee891ede | c21dee891ede |

## New Scope Assets

- https://www.bugcrowd.com/
- https://docs.bugcrowd.com/researchers/onboarding/welcome

## Removed Scope Assets

- ~~A collection of our favorite engagements for hackers.~~

## Recommendations

**Scope expansion detected** – 2 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://www.bugcrowd.com/, https://docs.bugcrowd.com/researchers/onboarding/welcome

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Staff Picks",
  "program_url": "https://bugcrowd.com/engagements/featured/staff-picks",
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
  "last_seen_at": "2026-03-22T00:31:27.519Z",
  "source_snapshot_hash": "c21dee891ede",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Staff Picks",
    "program_url": "https://bugcrowd.com/engagements/featured/staff-picks",
    "scope_assets": [
      "A collection of our favorite engagements for hackers."
    ],
    "exclusions": [],
    "reward_range": "unknown",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "A collection of our favorite engagements for hackers.",
    "source_snapshot_hash": "ef6ae3ec860270269b00264002d2e8859c7fa859d3cc2d9ac4c1ac0c888a0a65"
  },
  "diff": {
    "oldHash": "2514663f991ca10fe6248317f58ec9732ff94830e8602c0748b2188eee1fecd9",
    "newHash": "61ee2d56126df3e3ad9c6f9233bfe4211fd4fc90e1a9be759bfb3d2082af31fd",
    "addedFields": [
      "rewards"
    ],
    "removedFields": [],
    "changedFields": [
      "scope_assets",
      "last_seen_at",
      "source_snapshot_hash"
    ]
  }
}
```
