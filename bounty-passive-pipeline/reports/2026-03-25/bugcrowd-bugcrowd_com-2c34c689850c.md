# Bug Bounty Report – bugcrowd.com

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/octopus-deploy |
| Report Date | 2026-03-25 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 2 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

2 new assets added to the scope of bugcrowd.com on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_name | bugcrowd.com | bugcrowd.com |
| scope_assets | *.octopus.com,*.octopusdeploy.com | *.octopus.com,*.octopusdeploy.com |
| last_seen_at | 2026-03-25T02:02:48.374Z | 2026-03-25T02:02:48.374Z |
| source_snapshot_hash | df1b74560a42 | df1b74560a42 |

## New Scope Assets

- *.octopus.com
- *.octopusdeploy.com

## Removed Scope Assets

- ~~https://octopus.com/downloads~~

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
  "last_seen_at": "2026-03-25T02:02:48.374Z",
  "source_snapshot_hash": "df1b74560a42",
  "rewards": [],
  "prevProgram": {
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
    "last_seen_at": "2026-03-22T00:30:52.249Z",
    "source_snapshot_hash": "2cb36a410fac",
    "rewards": []
  },
  "diff": {
    "oldHash": "0a48fb58e3ef43464cd2a994603217f2ede8a24310d4753daffbf0490ab1a505",
    "newHash": "2c34c689850c03deb2230f07ba776bc88ff3452390f06f198eff235a6c774422",
    "addedFields": [],
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
