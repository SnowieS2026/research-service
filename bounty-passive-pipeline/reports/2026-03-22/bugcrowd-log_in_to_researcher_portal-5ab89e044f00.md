# Bug Bounty Report – Log in to Researcher portal

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/user/sign_in |
| Report Date | 2026-03-22 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 3 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

3 new assets added to the scope of Log in to Researcher portal on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| scope_assets | https://www.bugcrowd.com/,https://bugcrowd.com/user/sign_up,https://bugcrowd.com… | https://www.bugcrowd.com/,https://bugcrowd.com/user/sign_up,https://bugcrowd.com… |
| exclusions |  |  |
| last_seen_at | 2026-03-22T10:08:21.006Z | 2026-03-22T10:08:21.006Z |
| source_snapshot_hash | ac06fb09fdac | ac06fb09fdac |

## New Scope Assets

- https://www.bugcrowd.com/
- https://bugcrowd.com/user/sign_up
- https://bugcrowd.com/user/password/new

## Removed Scope Assets

- ~~Forgot your password? Reset password~~

## Recommendations

**Scope expansion detected** – 3 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://www.bugcrowd.com/, https://bugcrowd.com/user/sign_up, https://bugcrowd.com/user/password/new

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Log in to Researcher portal",
  "program_url": "https://bugcrowd.com/user/sign_in",
  "scope_assets": [
    "https://www.bugcrowd.com/",
    "https://bugcrowd.com/user/sign_up",
    "https://bugcrowd.com/user/password/new"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-22T10:08:21.006Z",
  "source_snapshot_hash": "ac06fb09fdac",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Log in to Researcher portal",
    "program_url": "https://bugcrowd.com/user/sign_in",
    "scope_assets": [
      "Forgot your password? Reset password"
    ],
    "exclusions": [
      "Looking for the Customer portal? Go to Customer portal"
    ],
    "reward_range": "unknown",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "Looking for the Customer portal? Go to Customer portal",
    "source_snapshot_hash": "8b6d5c6a5c928e37f018d600019098d876d1a0acd914dd2e00b5c2af9fd2ce0b"
  },
  "diff": {
    "oldHash": "11d526110de3e900d51b1aab796293fe202862e79af3e81db4c80f8ddf45e010",
    "newHash": "5ab89e044f004d657477c42a643575f4965d9b587dfeac1e85e1d1c83be01f6f",
    "addedFields": [
      "rewards"
    ],
    "removedFields": [],
    "changedFields": [
      "scope_assets",
      "exclusions",
      "last_seen_at",
      "source_snapshot_hash"
    ]
  }
}
```
