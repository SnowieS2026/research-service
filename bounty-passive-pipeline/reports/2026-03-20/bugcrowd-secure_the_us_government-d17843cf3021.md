# Bug Bounty Report – Secure the US Government

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/featured/cisa |
| Report Date | 2026-03-20 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 10 new asset(s) added to scope; 3 asset(s) removed from scope |

## Summary

10 new assets added to the scope of Secure the US Government on bugcrowd. 3 assets removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| scope_assets | https://www.bugcrowd.com/,https://www.bugcrowd.com/terms-and-conditions/,https:/… | https://www.bugcrowd.com/,https://www.bugcrowd.com/terms-and-conditions/,https:/… |
| last_seen_at | 2026-03-20T22:33:24.579Z | 2026-03-20T22:33:24.579Z |
| source_snapshot_hash | 24526620b3e5 | 24526620b3e5 |

## New Scope Assets

- https://www.bugcrowd.com/
- https://www.bugcrowd.com/terms-and-conditions/
- https://www.bugcrowd.com/privacy/
- https://www.bugcrowd.com/solutions/security-companies
- https://www.bugcrowd.com/privacy/do-not-sell-my-information/
- https://docs.bugcrowd.com/researchers/onboarding/welcome
- https://www.bugcrowd.com/hackers/faqs/
- https://www.bugcrowd.com/resources
- https://www.bugcrowd.com/blog
- https://www.bugcrowd.com/about/contact

## Removed Scope Assets

- ~~The Cybersecurity and Infrastructure Security Agency (CISA)~~
- ~~a federal agency of the US government~~
- ~~has selected Bugcrowd and EnDyna to launch its first federal civilian enterprise-wide crowdsourced vulnerability disclosure policy (VDP) platform in support of Binding Operational Directive (BOD) 20-01. Below you will find the current list of participating agencies. Check back regularly as the list continues to grow!~~

## Recommendations

**Scope expansion detected** – 10 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://www.bugcrowd.com/, https://www.bugcrowd.com/terms-and-conditions/, https://www.bugcrowd.com/privacy/

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Secure the US Government",
  "program_url": "https://bugcrowd.com/engagements/featured/cisa",
  "scope_assets": [
    "https://www.bugcrowd.com/",
    "https://www.bugcrowd.com/terms-and-conditions/",
    "https://www.bugcrowd.com/privacy/",
    "https://www.bugcrowd.com/solutions/security-companies",
    "https://www.bugcrowd.com/privacy/do-not-sell-my-information/",
    "https://docs.bugcrowd.com/researchers/onboarding/welcome",
    "https://www.bugcrowd.com/hackers/faqs/",
    "https://www.bugcrowd.com/resources",
    "https://www.bugcrowd.com/blog",
    "https://www.bugcrowd.com/about/contact"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-20T22:33:24.579Z",
  "source_snapshot_hash": "24526620b3e5",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Secure the US Government",
    "program_url": "https://bugcrowd.com/engagements/featured/cisa",
    "scope_assets": [
      "The Cybersecurity and Infrastructure Security Agency (CISA)",
      "a federal agency of the US government",
      "has selected Bugcrowd and EnDyna to launch its first federal civilian enterprise-wide crowdsourced vulnerability disclosure policy (VDP) platform in support of Binding Operational Directive (BOD) 20-01. Below you will find the current list of participating agencies. Check back regularly as the list continues to grow!"
    ],
    "exclusions": [],
    "reward_range": "unknown",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "The Cybersecurity and Infrastructure Security Agency (CISA), a federal agency of the US government, has selected Bugcrowd and EnDyna to launch its first federal civilian enterprise-wide crowdsourced vulnerability disclosure policy (VDP) platform in support of Binding Operational Directive (BOD) 20-01. Below you will find the current list of participating agencies. Check back regularly as the list continues to grow!",
    "source_snapshot_hash": "c206fdcdf7fb256d8ae40267e7093d6c79e950337fb446bcfbc2837580fe0fc2"
  },
  "diff": {
    "oldHash": "6908a9f2bab53592dd4cd18c56ab4efe883ae39750d95f8c204cbce0466f7ca4",
    "newHash": "d17843cf3021a6dc16dd102a21d9eeb303c487aef4dc6a92b32bb86bebde9db6",
    "addedFields": [
      "rewards"
    ],
    "removedFields": [],
    "changedFields": [
      "scope_assets",
      "last_seen_at",
      "source_snapshot_hash"
    ]
  }
}
```
