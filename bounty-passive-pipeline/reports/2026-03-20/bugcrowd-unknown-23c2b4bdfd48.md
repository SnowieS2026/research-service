# Bug Bounty Report – Unknown

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/user/sign_in |
| Report Date | 2026-03-20 |
| Severity | **CRITICAL** |
| CVSS | 10 |
| Reasons | 6 new asset(s) added to scope; 1 asset(s) removed from scope; Program may have been closed or renamed |

## Summary

6 new assets added to the scope of Unknown on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_name | Unknown | Unknown |
| scope_assets | Create an account (https://bugcrowd.com/user/sign_up),Reset password (https://bu… | Create an account (https://bugcrowd.com/user/sign_up),Reset password (https://bu… |
| exclusions |  |  |
| last_seen_at | 2026-03-20 | 2026-03-20 |

## New Scope Assets

- Create an account (https://bugcrowd.com/user/sign_up)
- Reset password (https://bugcrowd.com/user/password/new)
- Terms & Conditions (https://www.bugcrowd.com/terms-and-conditions/)
- Privacy Policy (https://www.bugcrowd.com/privacy/)
- Security (https://www.bugcrowd.com/solutions/security-companies)
- Do Not Sell My Information (https://www.bugcrowd.com/privacy/do-not-sell-my-information/)

## Removed Scope Assets

- ~~Forgot your password? Reset password~~

## Recommendations

**Scope expansion detected** – 6 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: Create an account (https://bugcrowd.com/user/sign_up), Reset password (https://bugcrowd.com/user/password/new), Terms & Conditions (https://www.bugcrowd.com/terms-and-conditions/)

**High-impact change detected** – This change warrants immediate attention. Prioritise this program in your current testing cycle.

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Unknown",
  "program_url": "https://bugcrowd.com/user/sign_in",
  "scope_assets": [
    "Create an account (https://bugcrowd.com/user/sign_up)",
    "Reset password (https://bugcrowd.com/user/password/new)",
    "Terms & Conditions (https://www.bugcrowd.com/terms-and-conditions/)",
    "Privacy Policy (https://www.bugcrowd.com/privacy/)",
    "Security (https://www.bugcrowd.com/solutions/security-companies)",
    "Do Not Sell My Information (https://www.bugcrowd.com/privacy/do-not-sell-my-information/)"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-20",
  "source_snapshot_hash": "8b6d5c6a5c928e37f018d600019098d876d1a0acd914dd2e00b5c2af9fd2ce0b",
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
    "newHash": "23c2b4bdfd482f6578efe63adad366efcba349eccb36f1fa9aba5189398682ff",
    "addedFields": [],
    "removedFields": [],
    "changedFields": [
      "program_name",
      "scope_assets",
      "exclusions",
      "last_seen_at"
    ]
  }
}
```
