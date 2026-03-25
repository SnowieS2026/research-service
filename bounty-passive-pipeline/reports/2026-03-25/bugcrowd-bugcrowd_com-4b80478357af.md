# Bug Bounty Report – bugcrowd.com

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/verisign |
| Report Date | 2026-03-25 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 2 new asset(s) added to scope; 5 asset(s) removed from scope |

## Summary

2 new assets added to the scope of bugcrowd.com on bugcrowd. 5 assets removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_name | bugcrowd.com | bugcrowd.com |
| scope_assets | *.verisign.com,*.vrtz.com | *.verisign.com,*.vrtz.com |
| last_seen_at | 2026-03-25T02:01:37.905Z | 2026-03-25T02:01:37.905Z |
| source_snapshot_hash | b3df2158e794 | b3df2158e794 |

## New Scope Assets

- *.verisign.com
- *.vrtz.com

## Removed Scope Assets

- ~~https://www.verisign.com/~~
- ~~https://youcouldbe.com/~~
- ~~https://blog.verisign.com/~~
- ~~https://namestudioforsocial.com/~~
- ~~https://namestudio.com/~~

## Recommendations

**Scope expansion detected** – 2 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: *.verisign.com, *.vrtz.com

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "bugcrowd.com",
  "program_url": "https://bugcrowd.com/engagements/verisign",
  "scope_assets": [
    "*.verisign.com",
    "*.vrtz.com"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-25T02:01:37.905Z",
  "source_snapshot_hash": "b3df2158e794",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Verisign Bug Bounty",
    "program_url": "https://bugcrowd.com/engagements/verisign",
    "scope_assets": [
      "https://www.verisign.com/",
      "https://youcouldbe.com/",
      "https://blog.verisign.com/",
      "https://namestudioforsocial.com/",
      "https://namestudio.com/"
    ],
    "exclusions": [],
    "reward_range": "unknown",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "2026-03-23T12:07:23.682Z",
    "source_snapshot_hash": "0c6a6c8a18f8",
    "rewards": []
  },
  "diff": {
    "oldHash": "08ec9b0a0cb14ca7089143a52f0e573373a539ec4f1ca6cab9b0a105809256b6",
    "newHash": "4b80478357afefd066d1c4ec3f9a48009276a8c71796b5edb752c8d3dad97d6c",
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
