# Bug Bounty Report – bugcrowd.com

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/moovit-mbb-og |
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
| scope_assets | *.moovit.com,*.moovitapp.com | *.moovit.com,*.moovitapp.com |
| last_seen_at | 2026-03-25T01:57:08.715Z | 2026-03-25T01:57:08.715Z |
| source_snapshot_hash | 1ced25bf4322 | 1ced25bf4322 |

## New Scope Assets

- *.moovit.com
- *.moovitapp.com

## Removed Scope Assets

- ~~https://play.google.com/store/apps/details?id=com.tranzmate&hl=en_US~~
- ~~https://apps.apple.com/us/app/moovit-all-transit-options/id498477945~~
- ~~https://support.moovitapp.com/hc/en-us/articles/11389054527122-WayFinder-Augmented-Reality-helper-to-find-your-stop-iPhone-only~~

## Recommendations

**Scope expansion detected** – 2 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: *.moovit.com, *.moovitapp.com

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "bugcrowd.com",
  "program_url": "https://bugcrowd.com/engagements/moovit-mbb-og",
  "scope_assets": [
    "*.moovit.com",
    "*.moovitapp.com"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-25T01:57:08.715Z",
  "source_snapshot_hash": "1ced25bf4322",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Moovit Managed Bug Bounty Program",
    "program_url": "https://bugcrowd.com/engagements/moovit-mbb-og",
    "scope_assets": [
      "https://play.google.com/store/apps/details?id=com.tranzmate&hl=en_US",
      "https://apps.apple.com/us/app/moovit-all-transit-options/id498477945",
      "https://support.moovitapp.com/hc/en-us/articles/11389054527122-WayFinder-Augmented-Reality-helper-to-find-your-stop-iPhone-only"
    ],
    "exclusions": [],
    "reward_range": "unknown",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "2026-03-22T18:40:47.633Z",
    "source_snapshot_hash": "49d621c5df32",
    "rewards": []
  },
  "diff": {
    "oldHash": "04adfac2455082a4f3711758102736fba57ca076b30626aeb384704a5a51a273",
    "newHash": "94643698c1df084a4105068bc705b1a0adc3632074b5774dff2ab96d66e4df69",
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
