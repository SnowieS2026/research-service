# Bug Bounty Report – bugcrowd.com

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/blockchain-dot-com |
| Report Date | 2026-03-25 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 2 new asset(s) added to scope; 3 asset(s) removed from scope |

## Summary

2 new assets added to the scope of bugcrowd.com on bugcrowd. 3 assets removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | bugcrowd.com | bugcrowd.com |
| scope_assets | *.blockchain.com,*.blockchain.info | *.blockchain.com,*.blockchain.info |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-25T01:58:25.671Z | 2026-03-25T01:58:25.671Z |
| source_snapshot_hash | c81ed05fe669 | c81ed05fe669 |

## New Scope Assets

- *.blockchain.com
- *.blockchain.info

## Removed Scope Assets

- ~~The world’s leading crypto finance house serving people~~
- ~~projects~~
- ~~protocols and institutions since 2011.~~

## Recommendations

**Scope expansion detected** – 2 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: *.blockchain.com, *.blockchain.info

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "bugcrowd.com",
  "program_url": "https://bugcrowd.com/engagements/blockchain-dot-com",
  "scope_assets": [
    "*.blockchain.com",
    "*.blockchain.info"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-25T01:58:25.671Z",
  "source_snapshot_hash": "c81ed05fe669",
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
    "newHash": "ab07fc9bef9f24a309d956e42cf1d5de6e0776f8dce7a8620cad34446da436ed",
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
