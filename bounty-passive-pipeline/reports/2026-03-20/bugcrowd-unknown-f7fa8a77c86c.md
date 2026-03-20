# Bug Bounty Report – Unknown

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/underarmour |
| Report Date | 2026-03-20 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | New assets added to scope |

## Summary

1 new asset added to the scope of Unknown on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_url | https://bugcrowd.com/engagements/underarmour | https://bugcrowd.com/engagements/underarmour |
| scope_assets | Under Armour’s vision is to inspire you with performance solutions you never kne… | Under Armour’s vision is to inspire you with performance solutions you never kne… |
| exclusions | Under Armour Mission & Values | Under Armour Mission & Values |
| reward_range | We want to engage the security research community as partners & teammates to Sta… | We want to engage the security research community as partners & teammates to Sta… |
| last_seen_at | Under Armour’s vision is to inspire you with performance solutions you never kne… | Under Armour’s vision is to inspire you with performance solutions you never kne… |
| source_snapshot_hash | a535340ab69d80d520ac561a57ddbfdc55d69b4e4ed2566bffd1237fb567b9ab | a535340ab69d80d520ac561a57ddbfdc55d69b4e4ed2566bffd1237fb567b9ab |

## New Scope Assets

- Under Armour’s vision is to inspire you with performance solutions you never knew you needed and can’t imagine living without.

## Removed Scope Assets

- ~~Under Armour’s vision is to inspire you with performance solutions you never knew you needed and can’t imagine living without.~~

## Recommendations

**Scope expansion detected** – 1 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: Under Armour’s vision is to inspire you with performance solutions you never knew you needed and can’t imagine living without.

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Unknown",
  "program_url": "https://bugcrowd.com/engagements/underarmour",
  "scope_assets": [
    "Under Armour’s vision is to inspire you with performance solutions you never knew you needed and can’t imagine living without."
  ],
  "exclusions": [
    "Under Armour Mission & Values"
  ],
  "reward_range": "We want to engage the security research community as partners & teammates to Stay True, protect our athletes, and protect their data. Doing so enables our Global Community of athletes to Celebrate their Goals.",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "Under Armour’s vision is to inspire you with performance solutions you never knew you needed and can’t imagine living without.",
  "source_snapshot_hash": "a535340ab69d80d520ac561a57ddbfdc55d69b4e4ed2566bffd1237fb567b9ab",
  "diff": {
    "oldHash": "corp-084bfd40171b27af430235f199f1e60914a2ae6ff1e7e08974936d391a6e80de",
    "newHash": "f7fa8a77c86c418d9441f79800687a6b3c5bf0a02eab4024ab7ecdc8eae68939",
    "addedFields": [],
    "removedFields": [],
    "changedFields": [
      "program_url",
      "scope_assets",
      "exclusions",
      "reward_range",
      "last_seen_at",
      "source_snapshot_hash"
    ]
  }
}
```
