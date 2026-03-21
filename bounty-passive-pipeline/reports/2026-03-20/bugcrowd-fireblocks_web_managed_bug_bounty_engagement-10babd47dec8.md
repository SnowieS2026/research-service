# Bug Bounty Report – Fireblocks Web Managed Bug Bounty Engagement

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/fireblocks-mbb-og |
| Report Date | 2026-03-20 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 7 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

7 new assets added to the scope of Fireblocks Web Managed Bug Bounty Engagement on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | Fireblocks Web Managed Bug Bounty Engagement | Fireblocks Web Managed Bug Bounty Engagement |
| scope_assets | https://docs.bugcrowd.com/researchers/participating-in-program/your-bugcrowdninj… | https://docs.bugcrowd.com/researchers/participating-in-program/your-bugcrowdninj… |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-20T22:25:33.099Z | 2026-03-20T22:25:33.099Z |
| source_snapshot_hash | 866fcab783fd | 866fcab783fd |

## New Scope Assets

- https://docs.bugcrowd.com/researchers/participating-in-program/your-bugcrowdninja-email-address/
- https://info.fireblocks.com/fireblocks-developer-account
- https://developers.fireblocks.com/docs/sandbox-quickstart
- https://developers.fireblocks.com/docs/postman-guide
- https://sb-console-api.fireblocks.io/
- https://sb-mobile-api.fireblocks.io/
- https://sandbox-api.fireblocks.io/

## Removed Scope Assets

- ~~Fireblocks is a user-friendly platform that enables the creation of blockchain-based products and manages daily digital asset operations.~~

## Recommendations

**Scope expansion detected** – 7 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://docs.bugcrowd.com/researchers/participating-in-program/your-bugcrowdninja-email-address/, https://info.fireblocks.com/fireblocks-developer-account, https://developers.fireblocks.com/docs/sandbox-quickstart

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Fireblocks Web Managed Bug Bounty Engagement",
  "program_url": "https://bugcrowd.com/engagements/fireblocks-mbb-og",
  "scope_assets": [
    "https://docs.bugcrowd.com/researchers/participating-in-program/your-bugcrowdninja-email-address/",
    "https://info.fireblocks.com/fireblocks-developer-account",
    "https://developers.fireblocks.com/docs/sandbox-quickstart",
    "https://developers.fireblocks.com/docs/postman-guide",
    "https://sb-console-api.fireblocks.io/",
    "https://sb-mobile-api.fireblocks.io/",
    "https://sandbox-api.fireblocks.io/"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-20T22:25:33.099Z",
  "source_snapshot_hash": "866fcab783fd",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Get Started",
    "program_url": "https://bugcrowd.com/engagements/fireblocks-mbb-og",
    "scope_assets": [
      "Fireblocks is a user-friendly platform that enables the creation of blockchain-based products and manages daily digital asset operations."
    ],
    "exclusions": [
      "Thank you for helping keep Fireblocks and our users safe!"
    ],
    "reward_range": "For the initial prioritization/rating of findings, this engagement will use the Bugcrowd Vulnerability Rating Taxonomy. However, it is important to note that in some cases a vulnerability priority will be modified due to its likelihood or impact. In any instance where an issue is downgraded, a full, detailed explanation will be provided to the researcher - along with the opportunity to appeal, and make a case for a higher priority.",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "Fireblocks is a user-friendly platform that enables the creation of blockchain-based products and manages daily digital asset operations.",
    "source_snapshot_hash": "c2488a4b9e24dfa40ec91ac57f63b0fcf56374dc9ca7ff5b0101aa58011262e2"
  },
  "diff": {
    "oldHash": "307b639f71a4feae889b5a3a66eddb80f7f6df23da1ea7d747809af75b9ef92f",
    "newHash": "10babd47dec8caa9b8018fd0da934926b6f2900f87221332b48dc5d81a317653",
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
