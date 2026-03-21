# Bug Bounty Report – Infinite Athlete

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/tempusex-public-mbb-og |
| Report Date | 2026-03-21 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 4 new asset(s) added to scope; 4 asset(s) removed from scope |

## Summary

4 new assets added to the scope of Infinite Athlete on bugcrowd. 4 assets removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | Infinite Athlete | Infinite Athlete |
| scope_assets | https://tempus-ex.com/,https://docs.tempus-ex.com/,https://infiniteathlete.ai/,h… | https://tempus-ex.com/,https://docs.tempus-ex.com/,https://infiniteathlete.ai/,h… |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-21T12:09:53.260Z | 2026-03-21T12:09:53.260Z |
| source_snapshot_hash | f6e93ef0e811 | f6e93ef0e811 |

## New Scope Assets

- https://tempus-ex.com/
- https://docs.tempus-ex.com/
- https://infiniteathlete.ai/
- https://platform.infiniteathlete.ai/

## Removed Scope Assets

- ~~Infinite Athlete is the technological vanguard for the sports and entertainment industry. Merging sports~~
- ~~video~~
- ~~and data with innovation and accessibility~~
- ~~Tempus Ex technology enables the creation of new interactive experiences around live events.~~

## Recommendations

**Scope expansion detected** – 4 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://tempus-ex.com/, https://docs.tempus-ex.com/, https://infiniteathlete.ai/

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Infinite Athlete",
  "program_url": "https://bugcrowd.com/engagements/tempusex-public-mbb-og",
  "scope_assets": [
    "https://tempus-ex.com/",
    "https://docs.tempus-ex.com/",
    "https://infiniteathlete.ai/",
    "https://platform.infiniteathlete.ai/"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-21T12:09:53.260Z",
  "source_snapshot_hash": "f6e93ef0e811",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Unknown",
    "program_url": "https://bugcrowd.com/engagements/tempusex-public-mbb-og",
    "scope_assets": [
      "Infinite Athlete is the technological vanguard for the sports and entertainment industry. Merging sports",
      "video",
      "and data with innovation and accessibility",
      "Tempus Ex technology enables the creation of new interactive experiences around live events."
    ],
    "exclusions": [
      "For the initial prioritization/rating of findings",
      "this program will use the Bugcrowd Vulnerability Rating Taxonomy. However",
      "it is important to note that in some cases a vulnerability priority will be modified due to its likelihood or impact. In any instance where an issue is downgraded",
      "a full",
      "detailed explanation will be provided to the researcher - along with the opportunity to appeal",
      "and make a case for a higher priority."
    ],
    "reward_range": "If at any time you have concerns or are uncertain whether your security research is consistent with this policy, please inquire through the Bugcrowd Support Portal before going any further.",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "Infinite Athlete is the technological vanguard for the sports and entertainment industry. Merging sports, video, and data with innovation and accessibility, Tempus Ex technology enables the creation of new interactive experiences around live events.",
    "source_snapshot_hash": "67e77052de11555c692afefe73ec4326794c425cc4e3cc6c7aeacc40050c0c0c"
  },
  "diff": {
    "oldHash": "89fd721c7f9fcf4b17a6fcbf8e0bb75273c6ca9d5e6fe8a7b56b0374bb2fb84f",
    "newHash": "6cdc6c2b44b6a6177dbd72972128f14ef75875f6a48ec274a582b809c7b7a185",
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
