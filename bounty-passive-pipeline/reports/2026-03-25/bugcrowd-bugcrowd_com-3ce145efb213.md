# Bug Bounty Report – bugcrowd.com

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/webdotcom |
| Report Date | 2026-03-25 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 2 new asset(s) added to scope; 3 asset(s) removed from scope |

## Summary

2 new assets added to the scope of bugcrowd.com on bugcrowd. 3 assets removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_name | bugcrowd.com | bugcrowd.com |
| scope_assets | *.web.com,*.register.com | *.web.com,*.register.com |
| last_seen_at | 2026-03-25T01:57:53.969Z | 2026-03-25T01:57:53.969Z |
| source_snapshot_hash | 2b0e933ef766 | 2b0e933ef766 |

## New Scope Assets

- *.web.com
- *.register.com

## Removed Scope Assets

- ~~https://www.networksolutions.com/~~
- ~~https://www.bluehost.com/~~
- ~~https://www.hostgator.com/~~

## Recommendations

**Scope expansion detected** – 2 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: *.web.com, *.register.com

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "bugcrowd.com",
  "program_url": "https://bugcrowd.com/engagements/webdotcom",
  "scope_assets": [
    "*.web.com",
    "*.register.com"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-25T01:57:53.969Z",
  "source_snapshot_hash": "2b0e933ef766",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Web.com Bug Bounty",
    "program_url": "https://bugcrowd.com/engagements/webdotcom",
    "scope_assets": [
      "https://www.networksolutions.com/",
      "https://www.bluehost.com/",
      "https://www.hostgator.com/"
    ],
    "exclusions": [],
    "reward_range": "unknown",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "2026-03-24T18:06:12.305Z",
    "source_snapshot_hash": "7a3d45620670",
    "rewards": []
  },
  "diff": {
    "oldHash": "0c2f90568715dba4366e29f5a0f242d5477a26ff8e88468fa42cc68cdc029794",
    "newHash": "3ce145efb213587b8536088d1aa608b5db86a2c48d34125039658eb30e31111b",
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
