# Bug Bounty Report – Unknown

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/underarmour |
| Report Date | 2026-03-19 |
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
| source_snapshot_hash | a4420e9b7e582f40d21a415f94c4fc94480cfee74622cbeef2fe32a5b31d09b7 | a4420e9b7e582f40d21a415f94c4fc94480cfee74622cbeef2fe32a5b31d09b7 |

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
  "source_snapshot_hash": "a4420e9b7e582f40d21a415f94c4fc94480cfee74622cbeef2fe32a5b31d09b7",
  "diff": {
    "oldHash": "corp-251ed2cdb1129d81be34f2ec44e5aa210e797851989c380824644fb6a008fd68",
    "newHash": "da87d1b6ebf08907b047157e27c05d6ca3d1121fe15707cbf70ca9c8061cb8a8",
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
