# Bug Bounty Report – The requested page was not found

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/progress-software-vdphub |
| Report Date | 2026-03-20 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 1 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

1 new asset added to the scope of The requested page was not found on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | The requested page was not found | The requested page was not found |
| program_url | https://bugcrowd.com/engagements/progress-software-vdphub | https://bugcrowd.com/engagements/progress-software-vdphub |
| scope_assets | https://bugcrowd-support.freshdesk.com/support/tickets/new | https://bugcrowd-support.freshdesk.com/support/tickets/new |
| last_seen_at | 2026-03-20T22:34:44.364Z | 2026-03-20T22:34:44.364Z |
| source_snapshot_hash | db875d01d909 | db875d01d909 |

## New Scope Assets

- https://bugcrowd-support.freshdesk.com/support/tickets/new

## Removed Scope Assets

- ~~A central place for exploring Progress Software's assets. We appreciate your work in securing our systems.~~

## Recommendations

**Scope expansion detected** – 1 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://bugcrowd-support.freshdesk.com/support/tickets/new

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "The requested page was not found",
  "program_url": "https://bugcrowd.com/engagements/progress-software-vdphub",
  "scope_assets": [
    "https://bugcrowd-support.freshdesk.com/support/tickets/new"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-20T22:34:44.364Z",
  "source_snapshot_hash": "db875d01d909",
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
    "newHash": "29e0558d896d0a1161a2419f55bf59085a7254e406544ac7c66d08ff75e825c4",
    "addedFields": [
      "rewards"
    ],
    "removedFields": [],
    "changedFields": [
      "program_name",
      "program_url",
      "scope_assets",
      "last_seen_at",
      "source_snapshot_hash"
    ]
  }
}
```
