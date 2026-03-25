# Bug Bounty Report – bugcrowd.com

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/ynab |
| Report Date | 2026-03-25 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 1 new asset(s) added to scope; 5 asset(s) removed from scope |

## Summary

1 new asset added to the scope of bugcrowd.com on bugcrowd. 5 assets removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_name | bugcrowd.com | bugcrowd.com |
| scope_assets | *.ynab.com | *.ynab.com |
| last_seen_at | 2026-03-25T02:00:52.785Z | 2026-03-25T02:00:52.785Z |
| source_snapshot_hash | 09f86bae2f1a | 09f86bae2f1a |

## New Scope Assets

- *.ynab.com

## Removed Scope Assets

- ~~https://staging-api.bany.dev/v1~~
- ~~https://api.ynab.com/~~
- ~~https://support.ynab.com/en_us/how-to-protect-your-account-with-two-step-verification-rkKHuLlRc#troubleshoot~~
- ~~https://staging-api.bany.dev/~~
- ~~https://www.ynab.com/~~

## Recommendations

**Scope expansion detected** – 1 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: *.ynab.com

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "bugcrowd.com",
  "program_url": "https://bugcrowd.com/engagements/ynab",
  "scope_assets": [
    "*.ynab.com"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-25T02:00:52.785Z",
  "source_snapshot_hash": "09f86bae2f1a",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "YNAB",
    "program_url": "https://bugcrowd.com/engagements/ynab",
    "scope_assets": [
      "https://staging-api.bany.dev/v1",
      "https://api.ynab.com/",
      "https://support.ynab.com/en_us/how-to-protect-your-account-with-two-step-verification-rkKHuLlRc#troubleshoot",
      "https://staging-api.bany.dev/",
      "https://www.ynab.com/"
    ],
    "exclusions": [],
    "reward_range": "unknown",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "2026-03-21T18:07:29.771Z",
    "source_snapshot_hash": "88f803c85026",
    "rewards": []
  },
  "diff": {
    "oldHash": "096d89324add1c9f2a60adaa9cf447731a6f5f05b2156abeee6796b47c4a1a11",
    "newHash": "03d8617492f712a724c29ac3bd31bc9d8bda9c7dd249a3843ddb6730bf8a3a8f",
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
