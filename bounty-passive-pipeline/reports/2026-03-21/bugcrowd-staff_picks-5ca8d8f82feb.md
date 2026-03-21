# Bug Bounty Report – Staff Picks

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/featured/staff-picks |
| Report Date | 2026-03-21 |
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
| last_seen_at | 2026-03-21T12:10:00.952Z | 2026-03-21T12:10:00.952Z |
| source_snapshot_hash | 45a41d6265c6 | 45a41d6265c6 |

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
  "last_seen_at": "2026-03-21T12:10:00.952Z",
  "source_snapshot_hash": "45a41d6265c6",
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
    "newHash": "5ca8d8f82feb4b16031a0147da1d8dd91e9ac15acba1261f6d7e1f035124d5f3",
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
