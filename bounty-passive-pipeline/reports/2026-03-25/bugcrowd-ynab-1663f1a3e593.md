# Bug Bounty Report – YNAB

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/ynab |
| Report Date | 2026-03-25 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 5 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

5 new assets added to the scope of YNAB on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_name | YNAB | YNAB |
| scope_assets | https://staging-api.bany.dev/v1,https://api.ynab.com/,https://support.ynab.com/e… | https://staging-api.bany.dev/v1,https://api.ynab.com/,https://support.ynab.com/e… |
| last_seen_at | 2026-03-25T18:06:52.241Z | 2026-03-25T18:06:52.241Z |
| source_snapshot_hash | 23ad4bd74837 | 23ad4bd74837 |

## New Scope Assets

- https://staging-api.bany.dev/v1
- https://api.ynab.com/
- https://support.ynab.com/en_us/how-to-protect-your-account-with-two-step-verification-rkKHuLlRc#troubleshoot
- https://staging-api.bany.dev/
- https://www.ynab.com/

## Removed Scope Assets

- ~~*.ynab.com~~

## Recommendations

**Scope expansion detected** – 5 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://staging-api.bany.dev/v1, https://api.ynab.com/, https://support.ynab.com/en_us/how-to-protect-your-account-with-two-step-verification-rkKHuLlRc#troubleshoot

## Raw Diff

```json
{
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
  "last_seen_at": "2026-03-25T18:06:52.241Z",
  "source_snapshot_hash": "23ad4bd74837",
  "rewards": [],
  "prevProgram": {
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
    "rewards": []
  },
  "diff": {
    "oldHash": "03d8617492f712a724c29ac3bd31bc9d8bda9c7dd249a3843ddb6730bf8a3a8f",
    "newHash": "1663f1a3e593d7a908eb0ba266c945fa607defd72440fd8ebab8661251ef5be6",
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
