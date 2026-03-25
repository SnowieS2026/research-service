# Bug Bounty Report – bugcrowd.com

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/optus-mbb-og |
| Report Date | 2026-03-25 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 2 new asset(s) added to scope; 28 asset(s) removed from scope |

## Summary

2 new assets added to the scope of bugcrowd.com on bugcrowd. 28 assets removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_name | bugcrowd.com | bugcrowd.com |
| scope_assets | *.optus.com,*.optusnet.com.au | *.optus.com,*.optusnet.com.au |
| last_seen_at | 2026-03-25T01:56:51.149Z | 2026-03-25T01:56:51.149Z |
| source_snapshot_hash | d3c0472ea3e3 | d3c0472ea3e3 |

## New Scope Assets

- *.optus.com
- *.optusnet.com.au

## Removed Scope Assets

- ~~https://webmail.optusnet.com.au/~~
- ~~https://apps.apple.com/au/app/my-optus/id503716230~~
- ~~https://play.google.com/store/apps/details?id=au.com.optus.selfservice&hl=en_AU&gl=US~~
- ~~https://www.outsourcing.optus.net.au/eFRAMS3/~~
- ~~https://www.outsourcing2.optus.net.au/eFRAMS3/~~
- ~~https://www.optus.com.au/osp-ecare~~
- ~~https://optus.my.site.com/MyHub/s/~~
- ~~https://ddosportal.optus.com.au/~~
- ~~https://ogws.optusnet.com.au/~~
- ~~https://oes.optusnet.com.au/~~
- ~~https://samsung-pp.optussport.tv/~~
- ~~https://chromecast-pp.optussport.tv/~~
- ~~https://api-cdn.optussport.info/api/*~~
- ~~https://static.sport-pp.optus.com.au/api/*~~
- ~~https://stats-pp.akamai.optussport.tv/~~
- ~~https://stats.optussport.info/~~
- ~~https://cms-uat.optussport.tv/~~
- ~~https://cms-qa.optussport.tv/~~
- ~~https://static.cms-uat.optussport.tv/~~
- ~~https://static.cms-qa.optussport.tv/~~
- ~~https://sport.optus.com.au/~~
- ~~https://samsung.optussport.tv/~~
- ~~https://api-cdn.optussport.tv/api/*~~
- ~~https://static.sport.optus.com.au/api/*~~
- ~~https://stats.sport.optus.com.au/~~
- ~~https://stats.akamai.optussport.tv/~~
- ~~https://cms.optussport.tv/~~
- ~~https://static.cms.optussport.tv/~~

## Recommendations

**Scope expansion detected** – 2 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: *.optus.com, *.optusnet.com.au

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "bugcrowd.com",
  "program_url": "https://bugcrowd.com/engagements/optus-mbb-og",
  "scope_assets": [
    "*.optus.com",
    "*.optusnet.com.au"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-25T01:56:51.149Z",
  "source_snapshot_hash": "d3c0472ea3e3",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Optus Managed Bug Bounty",
    "program_url": "https://bugcrowd.com/engagements/optus-mbb-og",
    "scope_assets": [
      "https://webmail.optusnet.com.au/",
      "https://apps.apple.com/au/app/my-optus/id503716230",
      "https://play.google.com/store/apps/details?id=au.com.optus.selfservice&hl=en_AU&gl=US",
      "https://www.outsourcing.optus.net.au/eFRAMS3/",
      "https://www.outsourcing2.optus.net.au/eFRAMS3/",
      "https://www.optus.com.au/osp-ecare",
      "https://optus.my.site.com/MyHub/s/",
      "https://ddosportal.optus.com.au/",
      "https://ogws.optusnet.com.au/",
      "https://oes.optusnet.com.au/",
      "https://samsung-pp.optussport.tv/",
      "https://chromecast-pp.optussport.tv/",
      "https://api-cdn.optussport.info/api/*",
      "https://static.sport-pp.optus.com.au/api/*",
      "https://stats-pp.akamai.optussport.tv/",
      "https://stats.optussport.info/",
      "https://cms-uat.optussport.tv/",
      "https://cms-qa.optussport.tv/",
      "https://static.cms-uat.optussport.tv/",
      "https://static.cms-qa.optussport.tv/",
      "https://sport.optus.com.au/",
      "https://samsung.optussport.tv/",
      "https://api-cdn.optussport.tv/api/*",
      "https://static.sport.optus.com.au/api/*",
      "https://stats.sport.optus.com.au/",
      "https://stats.akamai.optussport.tv/",
      "https://cms.optussport.tv/",
      "https://static.cms.optussport.tv/"
    ],
    "exclusions": [],
    "reward_range": "unknown",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "2026-03-23T09:41:39.890Z",
    "source_snapshot_hash": "4b1f3ff97228",
    "rewards": []
  },
  "diff": {
    "oldHash": "02453e74dcbc53d067728843876a40e228a35b41177460bba3e7dd95d154f5eb",
    "newHash": "78f0f9a5d919337ea4f7b0470ad2feb81e95642117144f6336f27131499f84f5",
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
