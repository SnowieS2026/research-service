# Bug Bounty Report – Octopus Deploy

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/octopus-deploy |
| Report Date | 2026-03-21 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 1 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

1 new asset added to the scope of Octopus Deploy on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | Octopus Deploy | Octopus Deploy |
| scope_assets | https://octopus.com/downloads | https://octopus.com/downloads |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-21T18:10:11.977Z | 2026-03-21T18:10:11.977Z |
| source_snapshot_hash | c8192ea35e92 | c8192ea35e92 |

## New Scope Assets

- https://octopus.com/downloads

## Removed Scope Assets

- ~~Submit your finding to the program!~~

## Recommendations

**Scope expansion detected** – 1 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://octopus.com/downloads

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Octopus Deploy",
  "program_url": "https://bugcrowd.com/engagements/octopus-deploy",
  "scope_assets": [
    "https://octopus.com/downloads"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-21T18:10:11.977Z",
  "source_snapshot_hash": "c8192ea35e92",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Unknown",
    "program_url": "https://bugcrowd.com/engagements/octopus-deploy",
    "scope_assets": [
      "Submit your finding to the program!"
    ],
    "exclusions": [
      "We appreciate your efforts and hard work in making Octopus Deploy a more secure product",
      "and look forward to working with the researcher community to create a meaningful and successful bug bounty program."
    ],
    "reward_range": "Good luck and happy hunting!",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "Submit your finding to the program!",
    "source_snapshot_hash": "3b7a9453f067498141b603d29bf2146e6b19c891f8c24a494ef184b772648941"
  },
  "diff": {
    "oldHash": "150a7b12ec50e067aece6b81f1bec1df53160c1761fb89a4af80aede6be2bfbe",
    "newHash": "1126efe13c71b5667abd77dd313020c7f2f3ff2421892286f68447d41a5062f7",
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
