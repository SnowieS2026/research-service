# Bug Bounty Report – KuCoin Managed Bug Bounty Program

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/kucoin |
| Report Date | 2026-03-25 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 3 new asset(s) added to scope; 9 asset(s) removed from scope |

## Summary

3 new assets added to the scope of KuCoin Managed Bug Bounty Program on bugcrowd. 9 assets removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | KuCoin Managed Bug Bounty Program | KuCoin Managed Bug Bounty Program |
| scope_assets | https://kucoin.com/,https://apps.apple.com/us/app/kucoin-buy-bitcoin-crypto/id13… | https://kucoin.com/,https://apps.apple.com/us/app/kucoin-buy-bitcoin-crypto/id13… |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-25T06:07:42.427Z | 2026-03-25T06:07:42.427Z |
| source_snapshot_hash | 5e06757282b9 | 5e06757282b9 |

## New Scope Assets

- https://kucoin.com/
- https://apps.apple.com/us/app/kucoin-buy-bitcoin-crypto/id1378956601?mt=8
- https://play.google.com/store/apps/details?id=com.kubi.kucoin

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

**Scope expansion detected** – 3 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://kucoin.com/, https://apps.apple.com/us/app/kucoin-buy-bitcoin-crypto/id1378956601?mt=8, https://play.google.com/store/apps/details?id=com.kubi.kucoin

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "KuCoin Managed Bug Bounty Program",
  "program_url": "https://bugcrowd.com/engagements/kucoin",
  "scope_assets": [
    "https://kucoin.com/",
    "https://apps.apple.com/us/app/kucoin-buy-bitcoin-crypto/id1378956601?mt=8",
    "https://play.google.com/store/apps/details?id=com.kubi.kucoin"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-25T06:07:42.427Z",
  "source_snapshot_hash": "5e06757282b9",
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
    "newHash": "b82c2b20837e47327c356fe8282faa2a4020d17a29a7eeaf7a9dd7613336956e",
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
