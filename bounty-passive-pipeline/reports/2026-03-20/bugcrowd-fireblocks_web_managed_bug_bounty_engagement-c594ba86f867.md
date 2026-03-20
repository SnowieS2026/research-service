# Bug Bounty Report – Fireblocks Web Managed Bug Bounty Engagement

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/fireblocks-mbb-og |
| Report Date | 2026-03-20 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 13 new asset(s) added to scope; Allowed techniques updated; 1 asset(s) removed from scope; Program notes/triage status updated |

## Summary

13 new assets added to the scope of Fireblocks Web Managed Bug Bounty Engagement on bugcrowd. 1 asset removed from scope. Allowed testing techniques list updated.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_name | Fireblocks Web Managed Bug Bounty Engagement | Fireblocks Web Managed Bug Bounty Engagement |
| scope_assets | Bugcrowd Vulnerability Rating Taxonomy (https://bugcrowd.com/vulnerability-ratin… | Bugcrowd Vulnerability Rating Taxonomy (https://bugcrowd.com/vulnerability-ratin… |
| exclusions | Testing is only authorized on the targets listed as in scope. Any domain/propert… | Testing is only authorized on the targets listed as in scope. Any domain/propert… |
| reward_range | $7000 – $12000 | $7000 – $12000 |
| payout_notes | Safe harbor: Safe harbor | Safe harbor: Safe harbor |
| allowed_techniques | XSS,CSRF,RCE | XSS,CSRF,RCE |
| last_seen_at | Sep 09, 2025 | Sep 09, 2025 |
| source_snapshot_hash | 3745173b33fca30d5f4986c6f6d6487d681ebe919b2e3b756b9b0ed48f0ae3a3 | 3745173b33fca30d5f4986c6f6d6487d681ebe919b2e3b756b9b0ed48f0ae3a3 |

## New Scope Assets

- Bugcrowd Vulnerability Rating Taxonomy (https://bugcrowd.com/vulnerability-rating-taxonomy)
- here (https://docs.bugcrowd.com/researchers/participating-in-program/your-bugcrowdninja-email-address/)
- here (https://info.fireblocks.com/fireblocks-developer-account)
- https://developers.fireblocks.com/docs/sandbox-quickstart (https://developers.fireblocks.com/docs/sandbox-quickstart)
- https://developers.fireblocks.com/docs/postman-guide (https://developers.fireblocks.com/docs/postman-guide)
- sb-console-api.fireblocks.io (https://sb-console-api.fireblocks.io)
- sb-mobile-api.fireblocks.io (https://sb-mobile-api.fireblocks.io)
- sandbox-api.fireblocks.io (https://sandbox-api.fireblocks.io)
- Bugcrowd Support Portal (https://bugcrowd-support.freshdesk.com/support/tickets/new)
- sam_exploit (https://bugcrowd.com/h/sam_exploit)
- LTiDi (https://bugcrowd.com/h/LTiDi)
- standard disclosure terms. (https://www.bugcrowd.com/resource/standard-disclosure-terms/)
- Public Disclosure Policy (https://docs.bugcrowd.com/researchers/disclosure/disclosure/#f-coordinated-disclosure)

## Removed Scope Assets

- ~~Fireblocks is a user-friendly platform that enables the creation of blockchain-based products and manages daily digital asset operations.~~

## Recommendations

**Scope expansion detected** – 13 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: Bugcrowd Vulnerability Rating Taxonomy (https://bugcrowd.com/vulnerability-rating-taxonomy), here (https://docs.bugcrowd.com/researchers/participating-in-program/your-bugcrowdninja-email-address/), here (https://info.fireblocks.com/fireblocks-developer-account)

**New allowed techniques** – The program has explicitly listed new acceptable techniques. Incorporate these into your testing workflow.

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Fireblocks Web Managed Bug Bounty Engagement",
  "program_url": "https://bugcrowd.com/engagements/fireblocks-mbb-og",
  "scope_assets": [
    "Bugcrowd Vulnerability Rating Taxonomy (https://bugcrowd.com/vulnerability-rating-taxonomy)",
    "here (https://docs.bugcrowd.com/researchers/participating-in-program/your-bugcrowdninja-email-address/)",
    "here (https://info.fireblocks.com/fireblocks-developer-account)",
    "https://developers.fireblocks.com/docs/sandbox-quickstart (https://developers.fireblocks.com/docs/sandbox-quickstart)",
    "https://developers.fireblocks.com/docs/postman-guide (https://developers.fireblocks.com/docs/postman-guide)",
    "sb-console-api.fireblocks.io (https://sb-console-api.fireblocks.io)",
    "sb-mobile-api.fireblocks.io (https://sb-mobile-api.fireblocks.io)",
    "sandbox-api.fireblocks.io (https://sandbox-api.fireblocks.io)",
    "Bugcrowd Support Portal (https://bugcrowd-support.freshdesk.com/support/tickets/new)",
    "sam_exploit (https://bugcrowd.com/h/sam_exploit)",
    "LTiDi (https://bugcrowd.com/h/LTiDi)",
    "standard disclosure terms. (https://www.bugcrowd.com/resource/standard-disclosure-terms/)",
    "Public Disclosure Policy (https://docs.bugcrowd.com/researchers/disclosure/disclosure/#f-coordinated-disclosure)"
  ],
  "exclusions": [
    "Testing is only authorized on the targets listed as in scope. Any domain/property of Fireblocks not listed in the targets section is out of scope. This includes any/all subdomains not listed above. If you happen to identify a security vulnerability on a target that is not in scope, but it demonstrably belongs to Fireblocks, you can report it to this engagement. However, be aware that it is ineligible for rewards or points-based compensation."
  ],
  "reward_range": "$7000 – $12000",
  "reward_currency": "USD",
  "payout_notes": "Safe harbor: Safe harbor",
  "allowed_techniques": [
    "XSS",
    "CSRF",
    "RCE"
  ],
  "prohibited_techniques": [],
  "last_seen_at": "Sep 09, 2025",
  "source_snapshot_hash": "3745173b33fca30d5f4986c6f6d6487d681ebe919b2e3b756b9b0ed48f0ae3a3",
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
    "newHash": "c594ba86f867e919773cacf16078d356f708d2c915bdac377e9ffee47ffaea31",
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
