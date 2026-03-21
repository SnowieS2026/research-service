# Bug Bounty Report – bugcrowd.com

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/underarmour |
| Report Date | 2026-03-21 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 2 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

2 new assets added to the scope of bugcrowd.com on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | bugcrowd.com | bugcrowd.com |
| scope_assets | *.underarmour.com,*.underarmour.co.uk | *.underarmour.com,*.underarmour.co.uk |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-21T12:19:11.229Z | 2026-03-21T12:19:11.229Z |
| source_snapshot_hash | e3f6b27493e5 | e3f6b27493e5 |

## New Scope Assets

- *.underarmour.com
- *.underarmour.co.uk

## Removed Scope Assets

- ~~Under Armour’s vision is to inspire you with performance solutions you never knew you needed and can’t imagine living without.~~

## Recommendations

**Scope expansion detected** – 2 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: *.underarmour.com, *.underarmour.co.uk

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "bugcrowd.com",
  "program_url": "https://bugcrowd.com/engagements/underarmour",
  "scope_assets": [
    "*.underarmour.com",
    "*.underarmour.co.uk"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-21T12:19:11.229Z",
  "source_snapshot_hash": "e3f6b27493e5",
  "rewards": [],
  "prevProgram": {
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
    "source_snapshot_hash": "995c12e6227cb64d705058b7eb1d5f73081c7aaf5d0e1f17e0db5f2a4e96f43e"
  },
  "diff": {
    "oldHash": "10b10ab033b3690aa5943225bccad128306fb40915acb868e01dab5618f90df0",
    "newHash": "e5384c80de21fcf48460882c806f3542a17d85bd24471771b2c3084f24a4a27c",
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
