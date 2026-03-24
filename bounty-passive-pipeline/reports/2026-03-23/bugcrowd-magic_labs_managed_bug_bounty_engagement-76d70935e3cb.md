# Bug Bounty Report – Magic Labs Managed Bug Bounty Engagement

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/magiclabs-mbb-og |
| Report Date | 2026-03-23 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 5 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

5 new assets added to the scope of Magic Labs Managed Bug Bounty Engagement on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | Magic Labs Managed Bug Bounty Engagement | Magic Labs Managed Bug Bounty Engagement |
| scope_assets | https://docs.magic.link/home/welcome,https://magic.link/legal/developer-terms,ht… | https://docs.magic.link/home/welcome,https://magic.link/legal/developer-terms,ht… |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-23T12:20:19.861Z | 2026-03-23T12:20:19.861Z |
| source_snapshot_hash | 62ef54a9b7f4 | 62ef54a9b7f4 |

## New Scope Assets

- https://docs.magic.link/home/welcome
- https://magic.link/legal/developer-terms
- https://magic.link/legal/developer-license-agreement
- https://www.fortmatic.com/legal/developer-terms-conditions
- https://www.fortmatic.com/legal/developer-license-agreement

## Removed Scope Assets

- ~~Magic Labs provides web3 wallet infrastructure to make it easier for users to access decentralized applications.~~

## Recommendations

**Scope expansion detected** – 5 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://docs.magic.link/home/welcome, https://magic.link/legal/developer-terms, https://magic.link/legal/developer-license-agreement

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Magic Labs Managed Bug Bounty Engagement",
  "program_url": "https://bugcrowd.com/engagements/magiclabs-mbb-og",
  "scope_assets": [
    "https://docs.magic.link/home/welcome",
    "https://magic.link/legal/developer-terms",
    "https://magic.link/legal/developer-license-agreement",
    "https://www.fortmatic.com/legal/developer-terms-conditions",
    "https://www.fortmatic.com/legal/developer-license-agreement"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-23T12:20:19.861Z",
  "source_snapshot_hash": "62ef54a9b7f4",
  "rewards": [],
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
    "newHash": "76d70935e3cbc23af32d59540f658590da860f86abdbf36b39cfadf2b627b9f7",
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
