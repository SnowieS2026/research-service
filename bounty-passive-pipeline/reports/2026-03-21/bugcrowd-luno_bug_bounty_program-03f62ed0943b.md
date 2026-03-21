# Bug Bounty Report – Luno Bug Bounty Program

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/luno-og |
| Report Date | 2026-03-21 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 8 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

8 new assets added to the scope of Luno Bug Bounty Program on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | Luno Bug Bounty Program | Luno Bug Bounty Program |
| scope_assets | https://play.google.com/store/apps/details?hl=en&id=co.bitx.android.wallet,https… | https://play.google.com/store/apps/details?hl=en&id=co.bitx.android.wallet,https… |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-21T12:13:38.940Z | 2026-03-21T12:13:38.940Z |
| source_snapshot_hash | c4daf2a2a3de | c4daf2a2a3de |

## New Scope Assets

- https://play.google.com/store/apps/details?hl=en&id=co.bitx.android.wallet
- https://apps.apple.com/app/bitx-wallet/id927362479
- https://mobileapi.staging.luno.com/
- https://www.luno.com/en/developers/api
- https://staging.luno.com/
- https://staging.luno.com.ng/
- https://api.staging.luno.com/
- https://app.staging.luno.com/

## Removed Scope Assets

- ~~Luno Bug Bounty Program~~

## Recommendations

**Scope expansion detected** – 8 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://play.google.com/store/apps/details?hl=en&id=co.bitx.android.wallet, https://apps.apple.com/app/bitx-wallet/id927362479, https://mobileapi.staging.luno.com/

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Luno Bug Bounty Program",
  "program_url": "https://bugcrowd.com/engagements/luno-og",
  "scope_assets": [
    "https://play.google.com/store/apps/details?hl=en&id=co.bitx.android.wallet",
    "https://apps.apple.com/app/bitx-wallet/id927362479",
    "https://mobileapi.staging.luno.com/",
    "https://www.luno.com/en/developers/api",
    "https://staging.luno.com/",
    "https://staging.luno.com.ng/",
    "https://api.staging.luno.com/",
    "https://app.staging.luno.com/"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-21T12:13:38.940Z",
  "source_snapshot_hash": "c4daf2a2a3de",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "📌 CARF: Tax Residency Requirement – New ZA Retail Onboarding",
    "program_url": "https://bugcrowd.com/engagements/luno-og",
    "scope_assets": [
      "Luno Bug Bounty Program"
    ],
    "exclusions": [
      "We take security seriously and look forward to collaborating with the crowdsource security community."
    ],
    "reward_range": "For the initial prioritization/rating of findings, this engagement will use the Bugcrowd Vulnerability Rating Taxonomy. However, it is important to note that in some cases a vulnerability priority will be modified due to its likelihood or impact. In any instance where an issue is downgraded, a full, detailed explanation will be provided to the researcher - along with the opportunity to appeal, and make a case for a higher priority.",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "Luno Bug Bounty Program",
    "source_snapshot_hash": "6845808d2d8219d6f137ef4e02eea4d065f66c0ab6d5484522a34e3829e00be8"
  },
  "diff": {
    "oldHash": "0c18d688a07f2a4bcb98a3b7dfb4d111caf81705f3239e9f7d041d11bdf05f27",
    "newHash": "03f62ed0943b1fd63055e72610de2e7d6a470048cdf98e3fdae55eb2e789d51c",
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
