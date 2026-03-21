# Bug Bounty Report – bugcrowd.com

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements |
| Report Date | 2026-03-20 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 10 new asset(s) added to scope |

## Summary

10 new assets added to the scope of bugcrowd.com on bugcrowd.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | bugcrowd.com | bugcrowd.com |
| scope_assets | https://www.bugcrowd.com/,https://www.bugcrowd.com/terms-and-conditions/,https:/… | https://www.bugcrowd.com/,https://www.bugcrowd.com/terms-and-conditions/,https:/… |
| last_seen_at | 2026-03-20T22:27:26.226Z | 2026-03-20T22:27:26.226Z |
| source_snapshot_hash | 0c5b6f3b8694 | 0c5b6f3b8694 |

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
  "program_name": "bugcrowd.com",
  "program_url": "https://bugcrowd.com/engagements",
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
  "last_seen_at": "2026-03-20T22:27:26.226Z",
  "source_snapshot_hash": "0c5b6f3b8694",
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
    "newHash": "bc116ea035bc903eb6ed16b693a3f02b36b9150ee3dcd6b87f3af5c2cd85071e",
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
