# Bug Bounty Report – Verisign Bug Bounty

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/verisign |
| Report Date | 2026-03-21 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 5 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

5 new assets added to the scope of Verisign Bug Bounty on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | Verisign Bug Bounty | Verisign Bug Bounty |
| scope_assets | https://www.verisign.com/,https://youcouldbe.com/,https://blog.verisign.com/,htt… | https://www.verisign.com/,https://youcouldbe.com/,https://blog.verisign.com/,htt… |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-21T12:08:26.079Z | 2026-03-21T12:08:26.079Z |
| source_snapshot_hash | da33d880a3f4 | da33d880a3f4 |

## New Scope Assets

- https://www.verisign.com/
- https://youcouldbe.com/
- https://blog.verisign.com/
- https://namestudioforsocial.com/
- https://namestudio.com/

## Removed Scope Assets

- ~~A global provider of critical internet infrastructure and domain name registry services.~~

## Recommendations

**Scope expansion detected** – 5 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://www.verisign.com/, https://youcouldbe.com/, https://blog.verisign.com/

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Verisign Bug Bounty",
  "program_url": "https://bugcrowd.com/engagements/verisign",
  "scope_assets": [
    "https://www.verisign.com/",
    "https://youcouldbe.com/",
    "https://blog.verisign.com/",
    "https://namestudioforsocial.com/",
    "https://namestudio.com/"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-21T12:08:26.079Z",
  "source_snapshot_hash": "da33d880a3f4",
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
    "newHash": "12d5c27c73977b4db086c4d159a38a2c6cc0871f82f791a931564b081ac85ddb",
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
