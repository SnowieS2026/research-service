# Bug Bounty Report – Under Armour Product Security

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/underarmour |
| Report Date | 2026-03-21 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 15 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

15 new assets added to the scope of Under Armour Product Security on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | Under Armour Product Security | Under Armour Product Security |
| scope_assets | https://developer.underarmour.com/,https://www.underarmour.com/,https://www.unde… | https://developer.underarmour.com/,https://www.underarmour.com/,https://www.unde… |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-21T18:12:46.527Z | 2026-03-21T18:12:46.527Z |
| source_snapshot_hash | a8fd5f231c50 | a8fd5f231c50 |

## New Scope Assets

- https://developer.underarmour.com/
- https://www.underarmour.com/
- https://www.underarmour.co.uk/
- https://apps.apple.com/us/app/under-armour/id1092704571
- https://play.google.com/store/apps/details?id=com.ua.shop&hl=en
- https://api.shop.ua.com/graphql
- https://www.underarmournext.co.uk/
- https://underarmournext.com/
- https://*.api.ua.com/
- https://consumer-sustainability.underarmour.com/en
- https://vpe-us.underarmour.com/
- https://www.underarmour.cn/
- http://www.underarmour.com.sg/
- https://underarmour.co.kr/
- https://armourhouse.underarmour.com/

## Removed Scope Assets

- ~~Under Armour’s vision is to inspire you with performance solutions you never knew you needed and can’t imagine living without.~~

## Recommendations

**Scope expansion detected** – 15 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://developer.underarmour.com/, https://www.underarmour.com/, https://www.underarmour.co.uk/

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Under Armour Product Security",
  "program_url": "https://bugcrowd.com/engagements/underarmour",
  "scope_assets": [
    "https://developer.underarmour.com/",
    "https://www.underarmour.com/",
    "https://www.underarmour.co.uk/",
    "https://apps.apple.com/us/app/under-armour/id1092704571",
    "https://play.google.com/store/apps/details?id=com.ua.shop&hl=en",
    "https://api.shop.ua.com/graphql",
    "https://www.underarmournext.co.uk/",
    "https://underarmournext.com/",
    "https://*.api.ua.com/",
    "https://consumer-sustainability.underarmour.com/en",
    "https://vpe-us.underarmour.com/",
    "https://www.underarmour.cn/",
    "http://www.underarmour.com.sg/",
    "https://underarmour.co.kr/",
    "https://armourhouse.underarmour.com/"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-21T18:12:46.527Z",
  "source_snapshot_hash": "a8fd5f231c50",
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
    "newHash": "cbcc3f7919f92c47a2c492bef134eeff2240ea97c5ae648db938da5afa0faa48",
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
