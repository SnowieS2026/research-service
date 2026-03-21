# Bug Bounty Report – Under Armour Corporate

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/underarmour-corp |
| Report Date | 2026-03-21 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 12 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

12 new assets added to the scope of Under Armour Corporate on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | Under Armour Corporate | Under Armour Corporate |
| scope_assets | https://apphouse.underarmour.com/,http://ourhouse.underarmour.com/,https://trans… | https://apphouse.underarmour.com/,http://ourhouse.underarmour.com/,https://trans… |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-21T18:12:52.674Z | 2026-03-21T18:12:52.674Z |
| source_snapshot_hash | a5e3de1a4094 | a5e3de1a4094 |

## New Scope Assets

- https://apphouse.underarmour.com/
- http://ourhouse.underarmour.com/
- https://transfer.underarmour.com/
- https://vpe-us.underarmour.com/
- https://snc.underarmour.com/
- https://snctest-s.underarmour.com/
- https://snctest-c.underarmour.com/
- https://supplier.underarmour.com/
- https://vtxapp9p.underarmour.com/
- https://vtxapp9q.underarmour.com/
- https://vtxapp9d.underarmour.com/
- https://vtxappd.underarmour.com/

## Removed Scope Assets

- ~~Submit your finding to Under Armour's program!~~

## Recommendations

**Scope expansion detected** – 12 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://apphouse.underarmour.com/, http://ourhouse.underarmour.com/, https://transfer.underarmour.com/

## Raw Diff

```json
{
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
  "last_seen_at": "2026-03-21T18:12:52.674Z",
  "source_snapshot_hash": "a5e3de1a4094",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Unknown",
    "program_url": "https://bugcrowd.com/engagements/underarmour-corp",
    "scope_assets": [
      "Submit your finding to Under Armour's program!"
    ],
    "exclusions": [
      "No technology is perfect and Under Armour believes that working with skilled security researchers across the globe is crucial in identifying weaknesses in any technology. We are excited for you to participate as a security researcher to help us identify vulnerabilities in our corporate assets. Good luck",
      "and happy hunting!"
    ],
    "reward_range": "For the initial prioritization/rating of findings, this program will use the Bugcrowd Vulnerability Rating Taxonomy. However, it is important to note that in some cases a vulnerability priority will be modified due to its likelihood or impact. In any instance where an issue is downgraded, a full, detailed explanation will be provided to the researcher - along with the opportunity to appeal, and make a case for a higher priority.",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "Submit your finding to Under Armour's program!",
    "source_snapshot_hash": "71369324855a36a8a31de2a59db546c022f1ee417b64502625bfa5e0b0b47e1b"
  },
  "diff": {
    "oldHash": "084bfd40171b27af430235f199f1e60914a2ae6ff1e7e08974936d391a6e80de",
    "newHash": "6480cdaa29ff03d2d15c36f2577e16ae4d1be2725a4925053940b988b6dfcfcf",
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
