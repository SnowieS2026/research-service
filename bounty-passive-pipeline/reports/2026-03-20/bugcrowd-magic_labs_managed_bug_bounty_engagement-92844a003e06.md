# Bug Bounty Report – Magic Labs Managed Bug Bounty Engagement

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/magiclabs-mbb-og |
| Report Date | 2026-03-20 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 11 new asset(s) added to scope; Allowed techniques updated; 1 asset(s) removed from scope; Program notes/triage status updated |

## Summary

11 new assets added to the scope of Magic Labs Managed Bug Bounty Engagement on bugcrowd. 1 asset removed from scope. Allowed testing techniques list updated.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_name | Magic Labs Managed Bug Bounty Engagement | Magic Labs Managed Bug Bounty Engagement |
| scope_assets | mission (https://magic.link/docs/introduction/security),Vulnerability Rating Tax… | mission (https://magic.link/docs/introduction/security),Vulnerability Rating Tax… |
| exclusions | Testing is only authorized on the targets listed as in scope. Any domain/propert… | Testing is only authorized on the targets listed as in scope. Any domain/propert… |
| reward_range | $3000 | $3000 |
| payout_notes | Safe harbor: Safe harbor | Safe harbor: Safe harbor |
| allowed_techniques | RCE,OAUTH | RCE,OAUTH |
| last_seen_at | Dec 09, 2025 | Dec 09, 2025 |
| source_snapshot_hash | b25cf29df2b203d1bfdf220c25c6a82e37ce7bda3b12c5e8f8f72ab85d39f5ec | b25cf29df2b203d1bfdf220c25c6a82e37ce7bda3b12c5e8f8f72ab85d39f5ec |

## New Scope Assets

- mission (https://magic.link/docs/introduction/security)
- Vulnerability Rating Taxonomy (https://bugcrowd.com/vulnerability-rating-taxonomy)
- dashboard (https://dashboard.magic.link/login?ref=h1)
- here (https://docs.magic.link/home/welcome)
- Developer Terms & Conditions (https://magic.link/legal/developer-terms)
- Developer API & SDK License Agreement (https://magic.link/legal/developer-license-agreement)
- Developer Terms & Conditions (https://www.fortmatic.com/legal/developer-terms-conditions)
- Developer API & SDK License Agreement (https://www.fortmatic.com/legal/developer-license-agreement)
- Freshdesk Portal (https://bugcrowd-support.freshdesk.com/)
- Bugcrowd Support (https://bugcrowd-support.freshdesk.com/support/tickets/new)
- standard disclosure terms. (https://www.bugcrowd.com/resource/standard-disclosure-terms/)

## Removed Scope Assets

- ~~Magic Labs provides web3 wallet infrastructure to make it easier for users to access decentralized applications.~~

## Recommendations

**Scope expansion detected** – 11 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: mission (https://magic.link/docs/introduction/security), Vulnerability Rating Taxonomy (https://bugcrowd.com/vulnerability-rating-taxonomy), dashboard (https://dashboard.magic.link/login?ref=h1)

**New allowed techniques** – The program has explicitly listed new acceptable techniques. Incorporate these into your testing workflow.

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Magic Labs Managed Bug Bounty Engagement",
  "program_url": "https://bugcrowd.com/engagements/magiclabs-mbb-og",
  "scope_assets": [
    "mission (https://magic.link/docs/introduction/security)",
    "Vulnerability Rating Taxonomy (https://bugcrowd.com/vulnerability-rating-taxonomy)",
    "dashboard (https://dashboard.magic.link/login?ref=h1)",
    "here (https://docs.magic.link/home/welcome)",
    "Developer Terms & Conditions (https://magic.link/legal/developer-terms)",
    "Developer API & SDK License Agreement (https://magic.link/legal/developer-license-agreement)",
    "Developer Terms & Conditions (https://www.fortmatic.com/legal/developer-terms-conditions)",
    "Developer API & SDK License Agreement (https://www.fortmatic.com/legal/developer-license-agreement)",
    "Freshdesk Portal (https://bugcrowd-support.freshdesk.com/)",
    "Bugcrowd Support (https://bugcrowd-support.freshdesk.com/support/tickets/new)",
    "standard disclosure terms. (https://www.bugcrowd.com/resource/standard-disclosure-terms/)"
  ],
  "exclusions": [
    "Testing is only authorized on the targets listed as in scope. Any domain/property of Magic Labs not listed in the targets section is out of scope. This includes any/all subdomains not listed above. If you happen to identify a security vulnerability on a target that is not in scope, but it demonstrably belongs to Magic Labs, you can report it here. However, be aware that it is ineligible for rewards or points-based compensation."
  ],
  "reward_range": "$3000",
  "reward_currency": "USD",
  "payout_notes": "Safe harbor: Safe harbor",
  "allowed_techniques": [
    "RCE",
    "OAUTH"
  ],
  "prohibited_techniques": [],
  "last_seen_at": "Dec 09, 2025",
  "source_snapshot_hash": "b25cf29df2b203d1bfdf220c25c6a82e37ce7bda3b12c5e8f8f72ab85d39f5ec",
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Unknown",
    "program_url": "https://bugcrowd.com/engagements/magiclabs-mbb-og",
    "scope_assets": [
      "Magic Labs provides web3 wallet infrastructure to make it easier for users to access decentralized applications."
    ],
    "exclusions": [
      "Magic also builds a robust and distributed key management solution that supports this authentication infrastructure."
    ],
    "reward_range": "As part of Magic's mission and security=overview, we want to improve the developer experience of authentication, while keeping security top of mind for all developers. We recognize the importance of maintaining security in our services in order to keep our users safe. With this bounty program, we encourage researchers to discover security vulnerabilities in our\nsystems. These can cover almost any aspect of the product, from SDKs, APIs, public-facing codebases, user interfaces, developer dashboards, and more.",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "Magic Labs provides web3 wallet infrastructure to make it easier for users to access decentralized applications.",
    "source_snapshot_hash": "6b6fe33c3aaed9dfb7a6a43666af155d2700203741b1a072953cb628e6a1b5ee"
  },
  "diff": {
    "oldHash": "039512fb7c90375b2256347b24dfe22f7aaf10e70e37180f4900b62287aa4eee",
    "newHash": "92844a003e06d8acbbd94991c94363e6a30e8f33b397c1754f56fce5d18b7614",
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
