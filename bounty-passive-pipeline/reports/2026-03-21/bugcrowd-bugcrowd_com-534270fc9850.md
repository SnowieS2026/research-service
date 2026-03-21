# Bug Bounty Report – bugcrowd.com

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/justeattakeaway |
| Report Date | 2026-03-21 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 2 new asset(s) added to scope; 39 asset(s) removed from scope |

## Summary

2 new assets added to the scope of bugcrowd.com on bugcrowd. 39 assets removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_name | bugcrowd.com | bugcrowd.com |
| scope_assets | *.just Eat.com,*.takeaway.com | *.just Eat.com,*.takeaway.com |
| last_seen_at | 2026-03-21T12:18:54.215Z | 2026-03-21T12:18:54.215Z |
| source_snapshot_hash | b9e78d2dae4d | b9e78d2dae4d |

## New Scope Assets

- *.just Eat.com
- *.takeaway.com

## Removed Scope Assets

- ~~https://api-payments-secure-prod.skippayments.com/~~
- ~~https://takeawaypay.azurefd.net/en/takeawaypay/~~
- ~~https://takeaway.pay-creditcard.takeaway.com/~~
- ~~https://global-payments-web.payments.pmt-1.eu-west-1.production.jet-external.com/~~
- ~~https://uk.api.just-eat.io/docs~~
- ~~https://rest.api.eu-central-1.production.jet-external.com/~~
- ~~https://uk.api.just-eat.io/~~
- ~~https://aus.api.just-eat.io/~~
- ~~https://api-skipthedishes.skipthedishes.com/~~
- ~~https://i18n.api.just-eat.io/~~
- ~~https://cw-api.takeaway.com/~~
- ~~https://www.thuisbezorgd.nl/~~
- ~~https://takeaway.com/~~
- ~~https://skipthedishes.com/~~
- ~~https://just-eat.dk/~~
- ~~https://lieferando.de/~~
- ~~https://pyszne.pl/~~
- ~~https://bistro.sk/~~
- ~~https://just-eat.es/~~
- ~~https://www.just-eat.co.uk/~~
- ~~https://just-eat.ch/~~
- ~~https://10bis.co.il/~~
- ~~https://scoober.com/~~
- ~~https://just-eat.com/~~
- ~~https://skippayments.com/~~
- ~~https://play.google.com/store/apps/developer?id=Takeaway.com~~
- ~~https://play.google.com/store/apps/developer?id=Just-Eat+Holding+Limited~~
- ~~https://play.google.com/store/apps/developer?id=10bis.co.il+ltd.~~
- ~~https://play.google.com/store/apps/developer?id=Skip+Canada~~
- ~~https://apps.apple.com/nz/developer/just-eat-com/id383091095~~
- ~~https://apps.apple.com/it/developer/takeaway-com-central-core-b-v/id329472762~~
- ~~https://apps.apple.com/us/developer/skipthedishes/id969229980~~
- ~~https://apps.apple.com/us/developer/10bis-co-il-ltd/id434368194~~
- ~~https://www.justeattakeaway.com/~~
- ~~https://just-eat.io/~~
- ~~https://api.justeat-int.com/~~
- ~~https://yourdelivery.de/~~
- ~~https://just-data.io/~~
- ~~https://jet-external.com/~~

## Recommendations

**Scope expansion detected** – 2 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: *.just Eat.com, *.takeaway.com

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "bugcrowd.com",
  "program_url": "https://bugcrowd.com/engagements/justeattakeaway",
  "scope_assets": [
    "*.just Eat.com",
    "*.takeaway.com"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-21T12:18:54.215Z",
  "source_snapshot_hash": "b9e78d2dae4d",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Just Eat Takeaway.com",
    "program_url": "https://bugcrowd.com/engagements/justeattakeaway",
    "scope_assets": [
      "https://api-payments-secure-prod.skippayments.com/",
      "https://takeawaypay.azurefd.net/en/takeawaypay/",
      "https://takeaway.pay-creditcard.takeaway.com/",
      "https://global-payments-web.payments.pmt-1.eu-west-1.production.jet-external.com/",
      "https://uk.api.just-eat.io/docs",
      "https://rest.api.eu-central-1.production.jet-external.com/",
      "https://uk.api.just-eat.io/",
      "https://aus.api.just-eat.io/",
      "https://api-skipthedishes.skipthedishes.com/",
      "https://i18n.api.just-eat.io/",
      "https://cw-api.takeaway.com/",
      "https://www.thuisbezorgd.nl/",
      "https://takeaway.com/",
      "https://skipthedishes.com/",
      "https://just-eat.dk/",
      "https://lieferando.de/",
      "https://pyszne.pl/",
      "https://bistro.sk/",
      "https://just-eat.es/",
      "https://www.just-eat.co.uk/",
      "https://just-eat.ch/",
      "https://10bis.co.il/",
      "https://scoober.com/",
      "https://just-eat.com/",
      "https://skippayments.com/",
      "https://play.google.com/store/apps/developer?id=Takeaway.com",
      "https://play.google.com/store/apps/developer?id=Just-Eat+Holding+Limited",
      "https://play.google.com/store/apps/developer?id=10bis.co.il+ltd.",
      "https://play.google.com/store/apps/developer?id=Skip+Canada",
      "https://apps.apple.com/nz/developer/just-eat-com/id383091095",
      "https://apps.apple.com/it/developer/takeaway-com-central-core-b-v/id329472762",
      "https://apps.apple.com/us/developer/skipthedishes/id969229980",
      "https://apps.apple.com/us/developer/10bis-co-il-ltd/id434368194",
      "https://www.justeattakeaway.com/",
      "https://just-eat.io/",
      "https://api.justeat-int.com/",
      "https://yourdelivery.de/",
      "https://just-data.io/",
      "https://jet-external.com/"
    ],
    "exclusions": [],
    "reward_range": "unknown",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "2026-03-21T12:08:34.469Z",
    "source_snapshot_hash": "f511ca635c77",
    "rewards": []
  },
  "diff": {
    "oldHash": "0613c4b16f74489a61e40eb8b1c73ffa077f80b1bb5c147347d931b5eb3483fe",
    "newHash": "534270fc9850108f999ea8628830149d8eb6acfd2e780c339bced5245539c481",
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
