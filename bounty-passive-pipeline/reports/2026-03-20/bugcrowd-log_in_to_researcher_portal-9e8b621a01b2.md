# Bug Bounty Report – Log in to Researcher portal

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/user/sign_in |
| Report Date | 2026-03-20 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 7 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

7 new assets added to the scope of Log in to Researcher portal on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| scope_assets | https://www.bugcrowd.com/,https://bugcrowd.com/user/sign_up,https://bugcrowd.com… | https://www.bugcrowd.com/,https://bugcrowd.com/user/sign_up,https://bugcrowd.com… |
| exclusions |  |  |
| last_seen_at | 2026-03-20T22:27:03.992Z | 2026-03-20T22:27:03.992Z |
| source_snapshot_hash | 955ab9953a7c | 955ab9953a7c |

## New Scope Assets

- https://www.bugcrowd.com/
- https://bugcrowd.com/user/sign_up
- https://bugcrowd.com/user/password/new
- https://www.bugcrowd.com/terms-and-conditions/
- https://www.bugcrowd.com/privacy/
- https://www.bugcrowd.com/solutions/security-companies
- https://www.bugcrowd.com/privacy/do-not-sell-my-information/

## Removed Scope Assets

- ~~Forgot your password? Reset password~~

## Recommendations

**Scope expansion detected** – 7 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://www.bugcrowd.com/, https://bugcrowd.com/user/sign_up, https://bugcrowd.com/user/password/new

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Log in to Researcher portal",
  "program_url": "https://bugcrowd.com/user/sign_in",
  "scope_assets": [
    "https://www.bugcrowd.com/",
    "https://bugcrowd.com/user/sign_up",
    "https://bugcrowd.com/user/password/new",
    "https://www.bugcrowd.com/terms-and-conditions/",
    "https://www.bugcrowd.com/privacy/",
    "https://www.bugcrowd.com/solutions/security-companies",
    "https://www.bugcrowd.com/privacy/do-not-sell-my-information/"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-20T22:27:03.992Z",
  "source_snapshot_hash": "955ab9953a7c",
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
    "newHash": "9e8b621a01b288da7b92f2e65cc3eb777fb9d18b680dfe5542088b30b1f81218",
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
