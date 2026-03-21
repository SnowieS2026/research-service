# Bug Bounty Report – Secure the US Government

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/featured/cisa |
| Report Date | 2026-03-21 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 2 new asset(s) added to scope; 3 asset(s) removed from scope |

## Summary

2 new assets added to the scope of Secure the US Government on bugcrowd. 3 assets removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| scope_assets | https://www.bugcrowd.com/,https://docs.bugcrowd.com/researchers/onboarding/welco… | https://www.bugcrowd.com/,https://docs.bugcrowd.com/researchers/onboarding/welco… |
| last_seen_at | 2026-03-21T12:10:48.256Z | 2026-03-21T12:10:48.256Z |
| source_snapshot_hash | 03c6be7ad9dc | 03c6be7ad9dc |

## New Scope Assets

- https://www.bugcrowd.com/
- https://docs.bugcrowd.com/researchers/onboarding/welcome

## Removed Scope Assets

- ~~The Cybersecurity and Infrastructure Security Agency (CISA)~~
- ~~a federal agency of the US government~~
- ~~has selected Bugcrowd and EnDyna to launch its first federal civilian enterprise-wide crowdsourced vulnerability disclosure policy (VDP) platform in support of Binding Operational Directive (BOD) 20-01. Below you will find the current list of participating agencies. Check back regularly as the list continues to grow!~~

## Recommendations

**Scope expansion detected** – 2 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://www.bugcrowd.com/, https://docs.bugcrowd.com/researchers/onboarding/welcome

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Secure the US Government",
  "program_url": "https://bugcrowd.com/engagements/featured/cisa",
  "scope_assets": [
    "https://www.bugcrowd.com/",
    "https://docs.bugcrowd.com/researchers/onboarding/welcome"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-21T12:10:48.256Z",
  "source_snapshot_hash": "03c6be7ad9dc",
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
    "newHash": "113408c3e839082889106f901a104738360bf5777291d84abc1c8358a272d2f4",
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
