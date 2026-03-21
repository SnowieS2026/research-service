# Bug Bounty Report – Blockchain.com Managed Bug Bounty Engagement

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/blockchain-dot-com |
| Report Date | 2026-03-20 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 11 new asset(s) added to scope; Allowed techniques updated; 3 asset(s) removed from scope; Program notes/triage status updated |

## Summary

11 new assets added to the scope of Blockchain.com Managed Bug Bounty Engagement on bugcrowd. 3 assets removed from scope. Allowed testing techniques list updated.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_name | Blockchain.com Managed Bug Bounty Engagement | Blockchain.com Managed Bug Bounty Engagement |
| scope_assets | Security Learning Portal (https://www.blockchain.com/learning-portal#crypto-cour… | Security Learning Portal (https://www.blockchain.com/learning-portal#crypto-cour… |
| exclusions | Testing is only authorized on the targets listed as in scope. Any domain/propert… | Testing is only authorized on the targets listed as in scope. Any domain/propert… |
| reward_range | $7000 – $10000 | $7000 – $10000 |
| payout_notes | Safe harbor: Safe harbor | Safe harbor: Safe harbor |
| allowed_techniques | RCE | RCE |
| last_seen_at | Apr 01, 2025 | Apr 01, 2025 |
| source_snapshot_hash | 7ea0d57027499e64f8626aacfc7251f3593d4cc766f1e5790dbfe06cb86aa576 | 7ea0d57027499e64f8626aacfc7251f3593d4cc766f1e5790dbfe06cb86aa576 |

## New Scope Assets

- Security Learning Portal (https://www.blockchain.com/learning-portal#crypto-courses)
- Bugcrowd Vulnerability Rating Taxonomy (https://bugcrowd.com/vulnerability-rating-taxonomy)
- blockchain.com (https://www.blockchain.com/)
- Blockchain.com: Crypto Wallet (iOS) (https://apps.apple.com/us/app/blockchain-com-buy-btc-sol/id493253309)
- Blockchain.com: Crypto Wallet (Android) (https://play.google.com/store/apps/details?id=piuk.blockchain.android)
- here (https://docs.bugcrowd.com/researchers/participating-in-program/your-bugcrowdninja-email-address/)
- here (https://login.blockchain.com/beta/auth/signup)
- Bugcrowd Support Portal (https://bugcrowd-support.freshdesk.com/support/tickets/new)
- plumcake (https://bugcrowd.com/h/plumcake)
- standard disclosure terms. (https://www.bugcrowd.com/resource/standard-disclosure-terms/)
- Public Disclosure Policy (https://docs.bugcrowd.com/researchers/disclosure/disclosure/#f-coordinated-disclosure)

## Removed Scope Assets

- ~~The world’s leading crypto finance house serving people~~
- ~~projects~~
- ~~protocols and institutions since 2011.~~

## Recommendations

**Scope expansion detected** – 11 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: Security Learning Portal (https://www.blockchain.com/learning-portal#crypto-courses), Bugcrowd Vulnerability Rating Taxonomy (https://bugcrowd.com/vulnerability-rating-taxonomy), blockchain.com (https://www.blockchain.com/)

**New allowed techniques** – The program has explicitly listed new acceptable techniques. Incorporate these into your testing workflow.

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Blockchain.com Managed Bug Bounty Engagement",
  "program_url": "https://bugcrowd.com/engagements/blockchain-dot-com",
  "scope_assets": [
    "Security Learning Portal (https://www.blockchain.com/learning-portal#crypto-courses)",
    "Bugcrowd Vulnerability Rating Taxonomy (https://bugcrowd.com/vulnerability-rating-taxonomy)",
    "blockchain.com (https://www.blockchain.com/)",
    "Blockchain.com: Crypto Wallet (iOS) (https://apps.apple.com/us/app/blockchain-com-buy-btc-sol/id493253309)",
    "Blockchain.com: Crypto Wallet (Android) (https://play.google.com/store/apps/details?id=piuk.blockchain.android)",
    "here (https://docs.bugcrowd.com/researchers/participating-in-program/your-bugcrowdninja-email-address/)",
    "here (https://login.blockchain.com/beta/auth/signup)",
    "Bugcrowd Support Portal (https://bugcrowd-support.freshdesk.com/support/tickets/new)",
    "plumcake (https://bugcrowd.com/h/plumcake)",
    "standard disclosure terms. (https://www.bugcrowd.com/resource/standard-disclosure-terms/)",
    "Public Disclosure Policy (https://docs.bugcrowd.com/researchers/disclosure/disclosure/#f-coordinated-disclosure)"
  ],
  "exclusions": [
    "Testing is only authorized on the targets listed as in scope. Any domain/property of Blockchain.com not listed in the targets section is out of scope. This includes any/all subdomains not listed above. If you happen to identify a security vulnerability on a target that is not in scope, but it demonstrably belongs to Blockchain.com, you can report it to this engagement. However, be aware that it is ineligible for rewards or points-based compensation."
  ],
  "reward_range": "$7000 – $10000",
  "reward_currency": "USD",
  "payout_notes": "Safe harbor: Safe harbor",
  "allowed_techniques": [
    "RCE"
  ],
  "prohibited_techniques": [],
  "last_seen_at": "Apr 01, 2025",
  "source_snapshot_hash": "7ea0d57027499e64f8626aacfc7251f3593d4cc766f1e5790dbfe06cb86aa576",
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Unknown",
    "program_url": "https://bugcrowd.com/engagements/blockchain-dot-com",
    "scope_assets": [
      "The world’s leading crypto finance house serving people",
      "projects",
      "protocols and institutions since 2011."
    ],
    "exclusions": [
      "As a pioneer in the cryptocurrency space",
      "Blockchain.com has been at the forefront of developing crucial infrastructure for the Bitcoin community. We started with the Blockchain Explorer",
      "empowering users to examine transactions and understand the blockchain",
      "and an API that enabled businesses to build on Bitcoin.  Furthermore",
      "we provide a widely popular and user-friendly crypto wallet",
      "allowing individuals globally to securely manage their own digital assets."
    ],
    "reward_range": "Thank you for your interest in helping us enhance the security of our platform! Your contributions are highly valued.",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "The world’s leading crypto finance house serving people, projects, protocols and institutions since 2011.",
    "source_snapshot_hash": "e6cddff6a782a49a0a17209dfde03f0956fadb2437f22b04ba2f6e823c7f01f3"
  },
  "diff": {
    "oldHash": "09b87488c0f5cac217cea8afad4edcc96046721e1a28319f4e3297fd35d271e2",
    "newHash": "6eb533d8a1c57759ffb3a552b697b31c3f9f82e83fbb16051f0918919874dabb",
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
