# Bug Bounty Report – Progress Software VDP Hub

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/featured/progress-software-vdphub |
| Report Date | 2026-03-20 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 10 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

10 new assets added to the scope of Progress Software VDP Hub on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| scope_assets | https://www.bugcrowd.com/,https://www.bugcrowd.com/terms-and-conditions/,https:/… | https://www.bugcrowd.com/,https://www.bugcrowd.com/terms-and-conditions/,https:/… |
| last_seen_at | 2026-03-20T22:32:05.568Z | 2026-03-20T22:32:05.568Z |
| source_snapshot_hash | 7b44ca02d8be | 7b44ca02d8be |

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

## Removed Scope Assets

- ~~A central place for exploring Progress Software's assets. We appreciate your work in securing our systems.~~

## Recommendations

**Scope expansion detected** – 10 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://www.bugcrowd.com/, https://www.bugcrowd.com/terms-and-conditions/, https://www.bugcrowd.com/privacy/

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Progress Software VDP Hub",
  "program_url": "https://bugcrowd.com/engagements/featured/progress-software-vdphub",
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
  "last_seen_at": "2026-03-20T22:32:05.568Z",
  "source_snapshot_hash": "7b44ca02d8be",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Progress Software VDP Hub",
    "program_url": "https://bugcrowd.com/engagements/featured/progress-software-vdphub",
    "scope_assets": [
      "A central place for exploring Progress Software's assets. We appreciate your work in securing our systems."
    ],
    "exclusions": [],
    "reward_range": "unknown",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "A central place for exploring Progress Software's assets. We appreciate your work in securing our systems.",
    "source_snapshot_hash": "d5d4efd4d65ae9558879b71aaa7b042e81fb5d419dfb9c8cab352849b8e59df2"
  },
  "diff": {
    "oldHash": "44bc60f5d06b82382530098b6e9c53525c12bad297c9bd8ef8718f347a09c7ba",
    "newHash": "53f82b4ca39f853de88fdac8d67c8aed8acb7ef80ae4c5cfaf2504914bfc002c",
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
