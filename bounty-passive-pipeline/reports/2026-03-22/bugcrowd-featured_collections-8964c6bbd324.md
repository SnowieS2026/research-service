# Bug Bounty Report – Featured collections

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/featured |
| Report Date | 2026-03-22 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 2 new asset(s) added to scope |

## Summary

2 new assets added to the scope of Featured collections on bugcrowd.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| scope_assets | https://www.bugcrowd.com/,https://docs.bugcrowd.com/researchers/onboarding/welco… | https://www.bugcrowd.com/,https://docs.bugcrowd.com/researchers/onboarding/welco… |
| last_seen_at | 2026-03-22T10:08:46.802Z | 2026-03-22T10:08:46.802Z |
| source_snapshot_hash | 2514c5af1e4c | 2514c5af1e4c |

## New Scope Assets

- https://www.bugcrowd.com/
- https://docs.bugcrowd.com/researchers/onboarding/welcome

## Recommendations

**Scope expansion detected** – 2 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://www.bugcrowd.com/, https://docs.bugcrowd.com/researchers/onboarding/welcome

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Featured collections",
  "program_url": "https://bugcrowd.com/engagements/featured",
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
  "last_seen_at": "2026-03-22T10:08:46.802Z",
  "source_snapshot_hash": "2514c5af1e4c",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Featured collections",
    "program_url": "https://bugcrowd.com/engagements/featured",
    "scope_assets": [],
    "exclusions": [],
    "reward_range": "unknown",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "2026-03-20",
    "source_snapshot_hash": "f38ff99acb7d9864744476ce9318e7dfdecfaa9114506d07fe9fbd806e03d76f"
  },
  "diff": {
    "oldHash": "077d65b6618984c9592f255c9c56f41382ca1b0265f2ac7eb51006f1bcefca7b",
    "newHash": "8964c6bbd324028d37edf26af650e8e17eee8095673a09df7e23f78ddc0aeb71",
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
