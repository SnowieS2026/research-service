# Bug Bounty Report – Progress Software - Chef

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/chef-vdp |
| Report Date | 2026-03-24 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 1 new asset(s) added to scope; 4 asset(s) removed from scope |

## Summary

1 new asset added to the scope of Progress Software - Chef on bugcrowd. 4 assets removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | Progress Software - Chef | Progress Software - Chef |
| scope_assets | https://www.chef.io/ | https://www.chef.io/ |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-24T06:07:54.885Z | 2026-03-24T06:07:54.885Z |
| source_snapshot_hash | eb34c472e9db | eb34c472e9db |

## New Scope Assets

- https://www.chef.io/

## Removed Scope Assets

- ~~Progress offers software that assists organizations in creating and deploying mission-critical applications~~
- ~~managing data platforms~~
- ~~cloud~~
- ~~and IT infrastructure effectively. Please submit your findings to this Vulnerability Disclosure Program.~~

## Recommendations

**Scope expansion detected** – 1 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://www.chef.io/

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Progress Software - Chef",
  "program_url": "https://bugcrowd.com/engagements/chef-vdp",
  "scope_assets": [
    "https://www.chef.io/"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-24T06:07:54.885Z",
  "source_snapshot_hash": "eb34c472e9db",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Unknown",
    "program_url": "https://bugcrowd.com/engagements/chef-vdp",
    "scope_assets": [
      "Progress offers software that assists organizations in creating and deploying mission-critical applications",
      "managing data platforms",
      "cloud",
      "and IT infrastructure effectively. Please submit your findings to this Vulnerability Disclosure Program."
    ],
    "exclusions": [
      "For the initial prioritization/rating of findings",
      "this program will use the Bugcrowd Vulnerability Rating Taxonomy. However",
      "it is important to note that in some cases a vulnerability priority will be modified due to its likelihood or impact. In any instance where an issue is downgraded",
      "a full",
      "detailed explanation will be provided to the researcher - along with the opportunity to appeal",
      "and make a case for a higher priority."
    ],
    "reward_range": "Please do not discuss any vulnerabilities (even resolved ones) outside of the program without express consent from the organization.",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "Progress offers software that assists organizations in creating and deploying mission-critical applications, managing data platforms, cloud, and IT infrastructure effectively. Please submit your findings to this Vulnerability Disclosure Program.",
    "source_snapshot_hash": "c4da76d94cef0aa82e8563be572f33d45d0f1c64e36f4aa9f9b62af8d673b0cf"
  },
  "diff": {
    "oldHash": "20b9912ccf31b7d4f5477e86d8cd70face89cc3ca6883eed865c2de287bbe88c",
    "newHash": "2e93dc2841362231818a090c6f69683abf7c4e31d9c55aa42ea961b7ac167028",
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
