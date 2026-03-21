# Bug Bounty Report – Featured collections

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/featured |
| Report Date | 2026-03-20 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 10 new asset(s) added to scope |

## Summary

10 new assets added to the scope of Featured collections on bugcrowd.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| scope_assets | https://www.bugcrowd.com/,https://www.bugcrowd.com/terms-and-conditions/,https:/… | https://www.bugcrowd.com/,https://www.bugcrowd.com/terms-and-conditions/,https:/… |
| last_seen_at | 2026-03-20T22:27:37.475Z | 2026-03-20T22:27:37.475Z |
| source_snapshot_hash | 43941b207777 | 43941b207777 |

## New Scope Assets

- https://www.bugcrowd.com/
- https://www.bugcrowd.com/terms-and-conditions/
- https://www.bugcrowd.com/privacy/
- https://www.bugcrowd.com/solutions/security-companies
- https://www.bugcrowd.com/privacy/do-not-sell-my-information/
- https://docs.bugcrowd.com/researchers/onboarding/welcome
- https://www.bugcrowd.com/hackers/faqs/
- https://www.bugcrowd.com/resources
- https://www.bugcrowd.com/blog
- https://www.bugcrowd.com/about/contact

## Recommendations

**Scope expansion detected** – 10 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://www.bugcrowd.com/, https://www.bugcrowd.com/terms-and-conditions/, https://www.bugcrowd.com/privacy/

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Featured collections",
  "program_url": "https://bugcrowd.com/engagements/featured",
  "scope_assets": [
    "https://www.bugcrowd.com/",
    "https://www.bugcrowd.com/terms-and-conditions/",
    "https://www.bugcrowd.com/privacy/",
    "https://www.bugcrowd.com/solutions/security-companies",
    "https://www.bugcrowd.com/privacy/do-not-sell-my-information/",
    "https://docs.bugcrowd.com/researchers/onboarding/welcome",
    "https://www.bugcrowd.com/hackers/faqs/",
    "https://www.bugcrowd.com/resources",
    "https://www.bugcrowd.com/blog",
    "https://www.bugcrowd.com/about/contact"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-20T22:27:37.475Z",
  "source_snapshot_hash": "43941b207777",
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
    "newHash": "c87561183d6f781d60b1f88f8cc3be6c6db9e5036bd4faa35134480ba1dfba94",
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
