# Bug Bounty Report – bugcrowd.com

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/rapyd |
| Report Date | 2026-03-25 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 2 new asset(s) added to scope; 9 asset(s) removed from scope |

## Summary

2 new assets added to the scope of bugcrowd.com on bugcrowd. 9 assets removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_name | bugcrowd.com | bugcrowd.com |
| scope_assets | *.rapyd.com,*.rapyd.cloud | *.rapyd.com,*.rapyd.cloud |
| last_seen_at | 2026-03-25T01:56:33.587Z | 2026-03-25T01:56:33.587Z |
| source_snapshot_hash | 854e16ed27d7 | 854e16ed27d7 |

## New Scope Assets

- *.rapyd.com
- *.rapyd.cloud

## Removed Scope Assets

- ~~https://docs.rapyd.net/~~
- ~~https://docs.rapyd.net/build-with-rapyd/docs~~
- ~~https://docs.rapyd.net/en/make-your-first-api-call.html~~
- ~~https://dashboard.rapyd.net/~~
- ~~https://docs.rapyd.net/client-portal/docs/client-portal-overview~~
- ~~https://docs.rapyd.net/build-with-rapyd/docs/rapyd-checkout-overview~~
- ~~https://bugcrowd.com/rapyd-og/attachments/627492e1-9f27-482d-8710-174a392f38c5~~
- ~~https://docs.rapyd.net/build-with-rapyd/reference/rapyd-verify-1~~
- ~~https://jointhemoment.net/~~

## Recommendations

**Scope expansion detected** – 2 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: *.rapyd.com, *.rapyd.cloud

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "bugcrowd.com",
  "program_url": "https://bugcrowd.com/engagements/rapyd",
  "scope_assets": [
    "*.rapyd.com",
    "*.rapyd.cloud"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-25T01:56:33.587Z",
  "source_snapshot_hash": "854e16ed27d7",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Rapyd",
    "program_url": "https://bugcrowd.com/engagements/rapyd",
    "scope_assets": [
      "https://docs.rapyd.net/",
      "https://docs.rapyd.net/build-with-rapyd/docs",
      "https://docs.rapyd.net/en/make-your-first-api-call.html",
      "https://dashboard.rapyd.net/",
      "https://docs.rapyd.net/client-portal/docs/client-portal-overview",
      "https://docs.rapyd.net/build-with-rapyd/docs/rapyd-checkout-overview",
      "https://bugcrowd.com/rapyd-og/attachments/627492e1-9f27-482d-8710-174a392f38c5",
      "https://docs.rapyd.net/build-with-rapyd/reference/rapyd-verify-1",
      "https://jointhemoment.net/"
    ],
    "exclusions": [],
    "reward_range": "unknown",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "2026-03-23T12:19:44.480Z",
    "source_snapshot_hash": "e5558af45748",
    "rewards": []
  },
  "diff": {
    "oldHash": "029c8a6d7dee2742280f1762763cf9f91d50df8f7a06c98e16f2b2874abd6472",
    "newHash": "49a72edb340cddf79f6c9a7b913030071555967a9764c23e8626e03f6ba43943",
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
