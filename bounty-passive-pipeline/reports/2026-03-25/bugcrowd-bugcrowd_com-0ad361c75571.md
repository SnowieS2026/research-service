# Bug Bounty Report – bugcrowd.com

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/underarmour-corp |
| Report Date | 2026-03-25 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 2 new asset(s) added to scope; 12 asset(s) removed from scope |

## Summary

2 new assets added to the scope of bugcrowd.com on bugcrowd. 12 assets removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_name | bugcrowd.com | bugcrowd.com |
| scope_assets | *.underarmour.com,*.mapmyrun.com | *.underarmour.com,*.mapmyrun.com |
| last_seen_at | 2026-03-25T02:02:30.791Z | 2026-03-25T02:02:30.791Z |
| source_snapshot_hash | 97a39669161d | 97a39669161d |

## New Scope Assets

- *.underarmour.com
- *.mapmyrun.com

## Removed Scope Assets

- ~~https://apphouse.underarmour.com/~~
- ~~http://ourhouse.underarmour.com/~~
- ~~https://transfer.underarmour.com/~~
- ~~https://vpe-us.underarmour.com/~~
- ~~https://snc.underarmour.com/~~
- ~~https://snctest-s.underarmour.com/~~
- ~~https://snctest-c.underarmour.com/~~
- ~~https://supplier.underarmour.com/~~
- ~~https://vtxapp9p.underarmour.com/~~
- ~~https://vtxapp9q.underarmour.com/~~
- ~~https://vtxapp9d.underarmour.com/~~
- ~~https://vtxappd.underarmour.com/~~

## Recommendations

**Scope expansion detected** – 2 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: *.underarmour.com, *.mapmyrun.com

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "bugcrowd.com",
  "program_url": "https://bugcrowd.com/engagements/underarmour-corp",
  "scope_assets": [
    "*.underarmour.com",
    "*.mapmyrun.com"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-25T02:02:30.791Z",
  "source_snapshot_hash": "97a39669161d",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Under Armour Corporate",
    "program_url": "https://bugcrowd.com/engagements/underarmour-corp",
    "scope_assets": [
      "https://apphouse.underarmour.com/",
      "http://ourhouse.underarmour.com/",
      "https://transfer.underarmour.com/",
      "https://vpe-us.underarmour.com/",
      "https://snc.underarmour.com/",
      "https://snctest-s.underarmour.com/",
      "https://snctest-c.underarmour.com/",
      "https://supplier.underarmour.com/",
      "https://vtxapp9p.underarmour.com/",
      "https://vtxapp9q.underarmour.com/",
      "https://vtxapp9d.underarmour.com/",
      "https://vtxappd.underarmour.com/"
    ],
    "exclusions": [],
    "reward_range": "unknown",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "2026-03-23T09:43:21.159Z",
    "source_snapshot_hash": "ba54c51011fd",
    "rewards": []
  },
  "diff": {
    "oldHash": "05d823b9d9e996db6568283c0211ff613eb7ce514a767acd33565502d53f0ad5",
    "newHash": "0ad361c755716c0500c3debeb6327bd0cf4873b634d073b42af484a68583fbb0",
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
