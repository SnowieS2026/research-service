# Bug Bounty Report – bugcrowd.com

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/kucoin |
| Report Date | 2026-03-25 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 2 new asset(s) added to scope; 9 asset(s) removed from scope |

## Summary

2 new assets added to the scope of bugcrowd.com on bugcrowd. 9 assets removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | bugcrowd.com | bugcrowd.com |
| scope_assets | *.kucoin.com,*.kucoin.cloud | *.kucoin.com,*.kucoin.cloud |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-25T02:04:28.755Z | 2026-03-25T02:04:28.755Z |
| source_snapshot_hash | d41ecee7fe14 | d41ecee7fe14 |

## New Scope Assets

- *.kucoin.com
- *.kucoin.cloud

## Removed Scope Assets

- ~~KuCoin~~
- ~~a global cryptocurrency exchange based in Seychelles~~
- ~~offers over 700 digital assets~~
- ~~spot trading~~
- ~~margin trading~~
- ~~P2P fiat trading~~
- ~~futures trading~~
- ~~staking~~
- ~~and lending to 30 million users globally.~~

## Recommendations

**Scope expansion detected** – 2 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: *.kucoin.com, *.kucoin.cloud

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "bugcrowd.com",
  "program_url": "https://bugcrowd.com/engagements/kucoin",
  "scope_assets": [
    "*.kucoin.com",
    "*.kucoin.cloud"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-25T02:04:28.755Z",
  "source_snapshot_hash": "d41ecee7fe14",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Unknown",
    "program_url": "https://bugcrowd.com/engagements/kucoin",
    "scope_assets": [
      "KuCoin",
      "a global cryptocurrency exchange based in Seychelles",
      "offers over 700 digital assets",
      "spot trading",
      "margin trading",
      "P2P fiat trading",
      "futures trading",
      "staking",
      "and lending to 30 million users globally."
    ],
    "exclusions": [
      "For the initial prioritization/rating of findings",
      "this program will use the Bugcrowd Vulnerability Rating Taxonomy. However",
      "it is important to note that in some cases a vulnerability priority will be modified due to its likelihood or impact. In any instance where an issue is downgraded",
      "a full",
      "detailed explanation will be provided to the researcher - along with the opportunity to appeal",
      "and make a case for a higher priority."
    ],
    "reward_range": "Targets are accessible via the public internet.",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "KuCoin, a global cryptocurrency exchange based in Seychelles, offers over 700 digital assets, spot trading, margin trading, P2P fiat trading, futures trading, staking, and lending to 30 million users globally.",
    "source_snapshot_hash": "c22e3123d08144484d07157ea66cababf9c3b211b5f540648dfd307bfb066d0a"
  },
  "diff": {
    "oldHash": "01060d5fcd18c16057adfd839b64baac04295792123a6a5d2788b0853086e94b",
    "newHash": "7ff046292283129dde0170b1aa81ba770bbb32c9636183caa448deb21bc35515",
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
