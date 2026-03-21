# Bug Bounty Report – bugcrowd.com

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/verisign |
| Report Date | 2026-03-21 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 2 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

2 new assets added to the scope of bugcrowd.com on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | bugcrowd.com | bugcrowd.com |
| scope_assets | *.verisign.com,*.vrtz.com | *.verisign.com,*.vrtz.com |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-21T12:18:37.160Z | 2026-03-21T12:18:37.160Z |
| source_snapshot_hash | 255b1285e124 | 255b1285e124 |

## New Scope Assets

- *.verisign.com
- *.vrtz.com

## Removed Scope Assets

- ~~A global provider of critical internet infrastructure and domain name registry services.~~

## Recommendations

**Scope expansion detected** – 2 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: *.verisign.com, *.vrtz.com

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "bugcrowd.com",
  "program_url": "https://bugcrowd.com/engagements/verisign",
  "scope_assets": [
    "*.verisign.com",
    "*.vrtz.com"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-21T12:18:37.160Z",
  "source_snapshot_hash": "255b1285e124",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Unknown",
    "program_url": "https://bugcrowd.com/engagements/verisign",
    "scope_assets": [
      "A global provider of critical internet infrastructure and domain name registry services."
    ],
    "exclusions": [
      "No technology is perfect",
      "and Verisign believes that working with skilled security researchers across the globe is crucial in identifying weaknesses in any technology. We are excited for you to participate as a security researcher to help us identify vulnerabilities in our assets. Good luck",
      "and happy hunting!"
    ],
    "reward_range": "For the initial prioritization/rating of findings, this engagement will use the Bugcrowd Vulnerability Rating Taxonomy. However, it is important to note that in some cases a vulnerability priority will be modified due to its likelihood or impact. In any instance where an issue is downgraded, a full, detailed explanation will be provided to the researcher - along with the opportunity to appeal, and make a case for a higher priority.",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "A global provider of critical internet infrastructure and domain name registry services.",
    "source_snapshot_hash": "956c0a6e6d588cec39003548e3f3177cc6514a9c34929090065510f93b5e5720"
  },
  "diff": {
    "oldHash": "0d5f3d9a9d67456a1d4c36ec76fefef682501376696b8bd3b308f54057071a0c",
    "newHash": "6d18fe72c3ef7254f36b93fe584739bf1bd864f3182672ad2c95d02140c5ca2b",
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
