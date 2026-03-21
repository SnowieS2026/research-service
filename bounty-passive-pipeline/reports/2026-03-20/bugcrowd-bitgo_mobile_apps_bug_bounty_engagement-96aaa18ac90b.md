# Bug Bounty Report – BitGo Mobile Apps Bug Bounty Engagement

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/bitgo-mobileapps-mbb-og |
| Report Date | 2026-03-20 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 4 new asset(s) added to scope; 6 asset(s) removed from scope |

## Summary

4 new assets added to the scope of BitGo Mobile Apps Bug Bounty Engagement on bugcrowd. 6 assets removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | BitGo Mobile Apps Bug Bounty Engagement | BitGo Mobile Apps Bug Bounty Engagement |
| scope_assets | https://play.google.com/store/apps/details?id=com.bitgo.verify&hl=en_US,https://… | https://play.google.com/store/apps/details?id=com.bitgo.verify&hl=en_US,https://… |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-20T22:29:51.857Z | 2026-03-20T22:29:51.857Z |
| source_snapshot_hash | 8a8a5b6727c6 | 8a8a5b6727c6 |

## New Scope Assets

- https://play.google.com/store/apps/details?id=com.bitgo.verify&hl=en_US
- https://apps.apple.com/us/app/bitgo-verify/id1608937235
- https://play.google.com/store/apps/details?id=com.bitgo.mobileapp
- https://apps.apple.com/us/app/bitgo/id6739010408

## Removed Scope Assets

- ~~BitGo offers secure~~
- ~~scalable solutions for the digital asset economy~~
- ~~including regulated custody~~
- ~~borrowing~~
- ~~lending~~
- ~~and core infrastructure for investors and builders.~~

## Recommendations

**Scope expansion detected** – 4 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://play.google.com/store/apps/details?id=com.bitgo.verify&hl=en_US, https://apps.apple.com/us/app/bitgo-verify/id1608937235, https://play.google.com/store/apps/details?id=com.bitgo.mobileapp

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "BitGo Mobile Apps Bug Bounty Engagement",
  "program_url": "https://bugcrowd.com/engagements/bitgo-mobileapps-mbb-og",
  "scope_assets": [
    "https://play.google.com/store/apps/details?id=com.bitgo.verify&hl=en_US",
    "https://apps.apple.com/us/app/bitgo-verify/id1608937235",
    "https://play.google.com/store/apps/details?id=com.bitgo.mobileapp",
    "https://apps.apple.com/us/app/bitgo/id6739010408"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-20T22:29:51.857Z",
  "source_snapshot_hash": "8a8a5b6727c6",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Unknown",
    "program_url": "https://bugcrowd.com/engagements/bitgo-mobileapps-mbb-og",
    "scope_assets": [
      "BitGo offers secure",
      "scalable solutions for the digital asset economy",
      "including regulated custody",
      "borrowing",
      "lending",
      "and core infrastructure for investors and builders."
    ],
    "exclusions": [
      "Today",
      "BitGo is the leader in digital asset security",
      "custody",
      "and liquidity",
      "providing the operational backbone for more than 700 institutional clients in over 50 countries — a list that includes many regulated entities and the world’s top cryptocurrency exchanges and platforms. BitGo also processes approximately 20% of all global Bitcoin transactions by value."
    ],
    "reward_range": "This bug bounty program targets the pending approval workflow in BitGo’s mobile application. In organizational crypto operations, sensitive actions require review and approval by multiple parties before execution in production. These include Transactions, User management, Policy updates. The mobile app enables approvers to review and take action on these pending approvals directly from their devices.",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "BitGo offers secure, scalable solutions for the digital asset economy, including regulated custody, borrowing, lending, and core infrastructure for investors and builders.",
    "source_snapshot_hash": "3de140eab9bf3f4ec88bc45e497e7fc7e17b71f25ba022c3fc71daab828e03f9"
  },
  "diff": {
    "oldHash": "01c1933c17054a7fcbef12c14d8e2a0e0c35d0a765efbf27992a5eec444c1219",
    "newHash": "96aaa18ac90bd1e0a98df85ae737fd93b78a41350ce8c98f42d003b645b96f37",
    "addedFields": [
      "rewards"
    ],
    "removedFields": [],
    "changedFields": [
      "program_name",
      "scope_assets",
      "exclusions",
      "reward_range",
      "last_seen_at",
      "source_snapshot_hash"
    ]
  }
}
```
