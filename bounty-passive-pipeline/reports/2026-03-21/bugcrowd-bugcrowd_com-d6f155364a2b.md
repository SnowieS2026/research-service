# Bug Bounty Report – bugcrowd.com

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/octopus-deploy |
| Report Date | 2026-03-21 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 2 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

2 new assets added to the scope of bugcrowd.com on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | bugcrowd.com | bugcrowd.com |
| scope_assets | *.octopus.com,*.octopusdeploy.com | *.octopus.com,*.octopusdeploy.com |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-21T12:19:45.260Z | 2026-03-21T12:19:45.260Z |
| source_snapshot_hash | 6b1001a139ab | 6b1001a139ab |

## New Scope Assets

- *.octopus.com
- *.octopusdeploy.com

## Removed Scope Assets

- ~~Submit your finding to the program!~~

## Recommendations

**Scope expansion detected** – 2 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: *.octopus.com, *.octopusdeploy.com

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "bugcrowd.com",
  "program_url": "https://bugcrowd.com/engagements/octopus-deploy",
  "scope_assets": [
    "*.octopus.com",
    "*.octopusdeploy.com"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-21T12:19:45.260Z",
  "source_snapshot_hash": "6b1001a139ab",
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
    "newHash": "d6f155364a2b08d647fc15a8ea2e3baa8c6858de46efb79915ef62d8db725b59",
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
