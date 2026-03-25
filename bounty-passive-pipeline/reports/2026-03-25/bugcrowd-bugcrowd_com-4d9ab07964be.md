# Bug Bounty Report – bugcrowd.com

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/underarmour |
| Report Date | 2026-03-25 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 2 new asset(s) added to scope; 15 asset(s) removed from scope |

## Summary

2 new assets added to the scope of bugcrowd.com on bugcrowd. 15 assets removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_name | bugcrowd.com | bugcrowd.com |
| scope_assets | *.underarmour.com,*.underarmour.co.uk | *.underarmour.com,*.underarmour.co.uk |
| last_seen_at | 2026-03-25T02:02:12.950Z | 2026-03-25T02:02:12.950Z |
| source_snapshot_hash | 67bc8ab9cbf5 | 67bc8ab9cbf5 |

## New Scope Assets

- *.underarmour.com
- *.underarmour.co.uk

## Removed Scope Assets

- ~~https://developer.underarmour.com/~~
- ~~https://www.underarmour.com/~~
- ~~https://www.underarmour.co.uk/~~
- ~~https://apps.apple.com/us/app/under-armour/id1092704571~~
- ~~https://play.google.com/store/apps/details?id=com.ua.shop&hl=en~~
- ~~https://api.shop.ua.com/graphql~~
- ~~https://www.underarmournext.co.uk/~~
- ~~https://underarmournext.com/~~
- ~~https://*.api.ua.com/~~
- ~~https://consumer-sustainability.underarmour.com/en~~
- ~~https://vpe-us.underarmour.com/~~
- ~~https://www.underarmour.cn/~~
- ~~http://www.underarmour.com.sg/~~
- ~~https://underarmour.co.kr/~~
- ~~https://armourhouse.underarmour.com/~~

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
  "last_seen_at": "2026-03-25T02:02:12.950Z",
  "source_snapshot_hash": "67bc8ab9cbf5",
  "rewards": [],
  "prevProgram": {
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
    "last_seen_at": "2026-03-23T11:59:23.590Z",
    "source_snapshot_hash": "347a595429a4",
    "rewards": []
  },
  "diff": {
    "oldHash": "0787e9e93c6e9a0a6f0c17cc2b41065dc01e1961e32b7735450b0d944033b8f0",
    "newHash": "4d9ab07964be76b99cf4f1c746a1538ad8ca2ce4f8fd8a13af2355fb505d4d1f",
    "addedFields": [],
    "removedFields": [],
    "changedFields": [
      "program_name",
      "scope_assets",
      "last_seen_at",
      "source_snapshot_hash"
    ]
  }
}
```
