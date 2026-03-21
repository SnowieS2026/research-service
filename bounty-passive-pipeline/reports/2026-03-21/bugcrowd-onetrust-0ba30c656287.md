# Bug Bounty Report – OneTrust

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/onetrust |
| Report Date | 2026-03-21 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 1 new asset(s) added to scope; 3 asset(s) removed from scope |

## Summary

1 new asset added to the scope of OneTrust on bugcrowd. 3 assets removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | OneTrust | OneTrust |
| scope_assets | https://pentest-app.onetrust.com/ | https://pentest-app.onetrust.com/ |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-21T12:07:40.847Z | 2026-03-21T12:07:40.847Z |
| source_snapshot_hash | 9105cbb51913 | 9105cbb51913 |

## New Scope Assets

- https://pentest-app.onetrust.com/

## Removed Scope Assets

- ~~OneTrust helps companies build and demonstrate trust~~
- ~~measure and manage risk~~
- ~~and go beyond compliance.~~

## Recommendations

**Scope expansion detected** – 1 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://pentest-app.onetrust.com/

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "OneTrust",
  "program_url": "https://bugcrowd.com/engagements/onetrust",
  "scope_assets": [
    "https://pentest-app.onetrust.com/"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-21T12:07:40.847Z",
  "source_snapshot_hash": "9105cbb51913",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Unknown",
    "program_url": "https://bugcrowd.com/engagements/onetrust",
    "scope_assets": [
      "OneTrust helps companies build and demonstrate trust",
      "measure and manage risk",
      "and go beyond compliance."
    ],
    "exclusions": [
      "For the initial prioritization/rating of findings",
      "this program will use the Bugcrowd Vulnerability Rating Taxonomy. However",
      "it is important to note that in some cases a vulnerability priority will be modified due to its likelihood or impact. In any instance where an issue is downgraded",
      "a full",
      "detailed explanation will be provided to the researcher - along with the opportunity to appeal",
      "and make a case for a higher priority."
    ],
    "reward_range": "The targets will be accessed through a OneTrust staging environment. Submissions made using any environment other than pentest-app.onetrust.com is ineligible for a bounty.",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "OneTrust helps companies build and demonstrate trust, measure and manage risk, and go beyond compliance.",
    "source_snapshot_hash": "beedc52ee238299c1c358a66ba8c0ff67a0496ba62f1f2b530af5f65a60c39d4"
  },
  "diff": {
    "oldHash": "0e958949b6bbfe9f427b5d7077bd8f89140fff28b699bbbca8df132d2104337c",
    "newHash": "0ba30c656287e87f7f82cbadbfd94ee67bb25d6b98ed2ceb3026de40232f2ff8",
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
