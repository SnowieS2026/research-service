# Bug Bounty Report – Luno Bug Bounty Program

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/luno-og |
| Report Date | 2026-03-20 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 19 new asset(s) added to scope; Allowed techniques updated; 1 asset(s) removed from scope; Program notes/triage status updated |

## Summary

19 new assets added to the scope of Luno Bug Bounty Program on bugcrowd. 1 asset removed from scope. Allowed testing techniques list updated.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_name | Luno Bug Bounty Program | Luno Bug Bounty Program |
| scope_assets | CCData (https://ccdata.io/research/exchange-benchmark-rankings),Bugcrowd Vulnera… | CCData (https://ccdata.io/research/exchange-benchmark-rankings),Bugcrowd Vulnera… |
| exclusions | out of scope | out of scope |
| reward_range | $4500 – $7500 | $4500 – $7500 |
| payout_notes | Safe harbor: Safe harbor | Safe harbor: Safe harbor |
| allowed_techniques | RCE | RCE |
| last_seen_at | Nov 04, 2020 | Nov 04, 2020 |
| source_snapshot_hash | 9963460debea55074b51c91526d95dcd3e4f6e54afb6c9928f5832a0f68ddf3c | 9963460debea55074b51c91526d95dcd3e4f6e54afb6c9928f5832a0f68ddf3c |

## New Scope Assets

- CCData (https://ccdata.io/research/exchange-benchmark-rankings)
- Bugcrowd Vulnerability Rating Taxonomy (https://bugcrowd.com/vulnerability-rating-taxonomy)
- Luno Android Application (https://play.google.com/store/apps/details?hl=en&id=co.bitx.android.wallet)
- Luno iOS Application (https://apps.apple.com/app/bitx-wallet/id927362479)
- https://mobileapi.staging.luno.com/ (https://mobileapi.staging.luno.com/)
- OpenAPI Specification Download (https://www.luno.com/en/developers/api)
- *.staging.luno.com/ (https://staging.luno.com/)
- *staging.luno.com.ng/ (https://staging.luno.com.ng)
- https://api.staging.luno.com/ (https://api.staging.luno.com/)
- https://app.staging.luno.com/ (https://app.staging.luno.com/)
- API Changelog (https://www.luno.com/en/developers/api#tag/Changelog)
- https://staging.luno.com/en/signup (https://staging.luno.com/en/signup)
- here (https://docs.bugcrowd.com/researchers/participating-in-program/your-bugcrowdninja-email-address/)
- Bugcrowd Support Portal (https://bugcrowd-support.freshdesk.com/support/tickets/new)
- data-share.png (https://bugcrowd.com/engagements/luno-og/attachments/74773d85-9471-4707-9707-72f0f2e3d8f8)
- share_account.png (https://bugcrowd.com/engagements/luno-og/attachments/90c62c47-3dc2-41b4-8f50-9b01a42c4bc7)
- https://www.staging.luno.com/wallet/security/send_toggle (https://www.staging.luno.com/wallet/security/send_toggle)
- standard disclosure terms. (https://www.bugcrowd.com/resource/standard-disclosure-terms/)
- Public Disclosure Policy (https://docs.bugcrowd.com/researchers/disclosure/disclosure/#f-coordinated-disclosure)

## Removed Scope Assets

- ~~Luno Bug Bounty Program~~

## Recommendations

**Scope expansion detected** – 19 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: CCData (https://ccdata.io/research/exchange-benchmark-rankings), Bugcrowd Vulnerability Rating Taxonomy (https://bugcrowd.com/vulnerability-rating-taxonomy), Luno Android Application (https://play.google.com/store/apps/details?hl=en&id=co.bitx.android.wallet)

**New allowed techniques** – The program has explicitly listed new acceptable techniques. Incorporate these into your testing workflow.

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Luno Bug Bounty Program",
  "program_url": "https://bugcrowd.com/engagements/luno-og",
  "scope_assets": [
    "CCData (https://ccdata.io/research/exchange-benchmark-rankings)",
    "Bugcrowd Vulnerability Rating Taxonomy (https://bugcrowd.com/vulnerability-rating-taxonomy)",
    "Luno Android Application (https://play.google.com/store/apps/details?hl=en&id=co.bitx.android.wallet)",
    "Luno iOS Application (https://apps.apple.com/app/bitx-wallet/id927362479)",
    "https://mobileapi.staging.luno.com/ (https://mobileapi.staging.luno.com/)",
    "OpenAPI Specification Download (https://www.luno.com/en/developers/api)",
    "*.staging.luno.com/ (https://staging.luno.com/)",
    "*staging.luno.com.ng/ (https://staging.luno.com.ng)",
    "https://api.staging.luno.com/ (https://api.staging.luno.com/)",
    "https://app.staging.luno.com/ (https://app.staging.luno.com/)",
    "API Changelog (https://www.luno.com/en/developers/api#tag/Changelog)",
    "https://staging.luno.com/en/signup (https://staging.luno.com/en/signup)",
    "here (https://docs.bugcrowd.com/researchers/participating-in-program/your-bugcrowdninja-email-address/)",
    "Bugcrowd Support Portal (https://bugcrowd-support.freshdesk.com/support/tickets/new)",
    "data-share.png (https://bugcrowd.com/engagements/luno-og/attachments/74773d85-9471-4707-9707-72f0f2e3d8f8)",
    "share_account.png (https://bugcrowd.com/engagements/luno-og/attachments/90c62c47-3dc2-41b4-8f50-9b01a42c4bc7)",
    "https://www.staging.luno.com/wallet/security/send_toggle (https://www.staging.luno.com/wallet/security/send_toggle)",
    "standard disclosure terms. (https://www.bugcrowd.com/resource/standard-disclosure-terms/)",
    "Public Disclosure Policy (https://docs.bugcrowd.com/researchers/disclosure/disclosure/#f-coordinated-disclosure)"
  ],
  "exclusions": [
    "out of scope"
  ],
  "reward_range": "$4500 – $7500",
  "reward_currency": "USD",
  "payout_notes": "Safe harbor: Safe harbor",
  "allowed_techniques": [
    "RCE"
  ],
  "prohibited_techniques": [],
  "last_seen_at": "Nov 04, 2020",
  "source_snapshot_hash": "9963460debea55074b51c91526d95dcd3e4f6e54afb6c9928f5832a0f68ddf3c",
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
    "newHash": "af1ba049183ad9a89b4c01305a170ce547fa92d3d57372df10ae4b2d66e88cc7",
    "addedFields": [],
    "removedFields": [],
    "changedFields": [
      "program_name",
      "scope_assets",
      "exclusions",
      "reward_range",
      "payout_notes",
      "allowed_techniques",
      "last_seen_at",
      "source_snapshot_hash"
    ]
  }
}
```
