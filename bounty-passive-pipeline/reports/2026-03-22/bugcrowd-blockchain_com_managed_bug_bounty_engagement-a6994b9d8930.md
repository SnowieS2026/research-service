# Bug Bounty Report – Blockchain.com Managed Bug Bounty Engagement

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/blockchain-dot-com |
| Report Date | 2026-03-22 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 3 new asset(s) added to scope; 3 asset(s) removed from scope |

## Summary

3 new assets added to the scope of Blockchain.com Managed Bug Bounty Engagement on bugcrowd. 3 assets removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | Blockchain.com Managed Bug Bounty Engagement | Blockchain.com Managed Bug Bounty Engagement |
| scope_assets | https://www.blockchain.com/,https://apps.apple.com/us/app/blockchain-com-buy-btc… | https://www.blockchain.com/,https://apps.apple.com/us/app/blockchain-com-buy-btc… |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-22T10:09:25.580Z | 2026-03-22T10:09:25.580Z |
| source_snapshot_hash | bc0a9862040a | bc0a9862040a |

## New Scope Assets

- https://www.blockchain.com/
- https://apps.apple.com/us/app/blockchain-com-buy-btc-sol/id493253309
- https://play.google.com/store/apps/details?id=piuk.blockchain.android

## Removed Scope Assets

- ~~The world’s leading crypto finance house serving people~~
- ~~projects~~
- ~~protocols and institutions since 2011.~~

## Recommendations

**Scope expansion detected** – 3 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://www.blockchain.com/, https://apps.apple.com/us/app/blockchain-com-buy-btc-sol/id493253309, https://play.google.com/store/apps/details?id=piuk.blockchain.android

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Blockchain.com Managed Bug Bounty Engagement",
  "program_url": "https://bugcrowd.com/engagements/blockchain-dot-com",
  "scope_assets": [
    "https://www.blockchain.com/",
    "https://apps.apple.com/us/app/blockchain-com-buy-btc-sol/id493253309",
    "https://play.google.com/store/apps/details?id=piuk.blockchain.android"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-22T10:09:25.580Z",
  "source_snapshot_hash": "bc0a9862040a",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Unknown",
    "program_url": "https://bugcrowd.com/engagements/blockchain-dot-com",
    "scope_assets": [
      "The world’s leading crypto finance house serving people",
      "projects",
      "protocols and institutions since 2011."
    ],
    "exclusions": [
      "As a pioneer in the cryptocurrency space",
      "Blockchain.com has been at the forefront of developing crucial infrastructure for the Bitcoin community. We started with the Blockchain Explorer",
      "empowering users to examine transactions and understand the blockchain",
      "and an API that enabled businesses to build on Bitcoin.  Furthermore",
      "we provide a widely popular and user-friendly crypto wallet",
      "allowing individuals globally to securely manage their own digital assets."
    ],
    "reward_range": "Thank you for your interest in helping us enhance the security of our platform! Your contributions are highly valued.",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "The world’s leading crypto finance house serving people, projects, protocols and institutions since 2011.",
    "source_snapshot_hash": "e6cddff6a782a49a0a17209dfde03f0956fadb2437f22b04ba2f6e823c7f01f3"
  },
  "diff": {
    "oldHash": "09b87488c0f5cac217cea8afad4edcc96046721e1a28319f4e3297fd35d271e2",
    "newHash": "a6994b9d8930342e3cfcaeb9986ba63001425fd2a20644f2106b61ec8e461154",
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
