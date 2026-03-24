# Bug Bounty Report – Bureau of Indian Affairs

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/bia-vdp |
| Report Date | 2026-03-23 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 9 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

9 new assets added to the scope of Bureau of Indian Affairs on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | Bureau of Indian Affairs | Bureau of Indian Affairs |
| scope_assets | https://www.bugcrowd.com/,https://bugcrowd.com/vulnerability-rating-taxonomy,htt… | https://www.bugcrowd.com/,https://bugcrowd.com/vulnerability-rating-taxonomy,htt… |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-23T12:00:13.898Z | 2026-03-23T12:00:13.898Z |
| source_snapshot_hash | c6f3cf3c61b9 | c6f3cf3c61b9 |

## New Scope Assets

- https://www.bugcrowd.com/
- https://bugcrowd.com/vulnerability-rating-taxonomy
- https://bugcrowd.com/engagements/bia-vdp/attachments/a7277c50-1ef0-4832-a392-e8ba6dcc0b0b
- https://bugcrowd.com/engagements/bia-vdp/attachments/b5690147-a054-4b29-afa3-f0d3b5f54222
- https://bugcrowd.com/h/Mrinfinite
- https://bugcrowd-support.freshdesk.com/support/tickets/new
- https://www.bugcrowd.com/resource/standard-disclosure-terms/
- https://docs.bugcrowd.com/researchers/disclosure/disclosure/#f-coordinated-disclosure
- https://docs.bugcrowd.com/researchers/onboarding/welcome

## Removed Scope Assets

- ~~Submit your findings to help secure BIA!~~

## Recommendations

**Scope expansion detected** – 9 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://www.bugcrowd.com/, https://bugcrowd.com/vulnerability-rating-taxonomy, https://bugcrowd.com/engagements/bia-vdp/attachments/a7277c50-1ef0-4832-a392-e8ba6dcc0b0b

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Bureau of Indian Affairs",
  "program_url": "https://bugcrowd.com/engagements/bia-vdp",
  "scope_assets": [
    "https://www.bugcrowd.com/",
    "https://bugcrowd.com/vulnerability-rating-taxonomy",
    "https://bugcrowd.com/engagements/bia-vdp/attachments/a7277c50-1ef0-4832-a392-e8ba6dcc0b0b",
    "https://bugcrowd.com/engagements/bia-vdp/attachments/b5690147-a054-4b29-afa3-f0d3b5f54222",
    "https://bugcrowd.com/h/Mrinfinite",
    "https://bugcrowd-support.freshdesk.com/support/tickets/new",
    "https://www.bugcrowd.com/resource/standard-disclosure-terms/",
    "https://docs.bugcrowd.com/researchers/disclosure/disclosure/#f-coordinated-disclosure",
    "https://docs.bugcrowd.com/researchers/onboarding/welcome"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-23T12:00:13.898Z",
  "source_snapshot_hash": "c6f3cf3c61b9",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Unknown",
    "program_url": "https://bugcrowd.com/engagements/bia-vdp",
    "scope_assets": [
      "Submit your findings to help secure BIA!"
    ],
    "exclusions": [
      "This policy describes what systems and types of research are covered under this policy",
      "how to send us vulnerability reports",
      "and how long we ask security researchers to wait before publicly disclosing vulnerabilities. We encourage you to contact us to report potential vulnerabilities in our systems."
    ],
    "reward_range": "For the initial prioritization/rating of findings, this program will use the Bugcrowd Vulnerability Rating Taxonomy. However, it is important to note that in some cases a vulnerability priority will be modified due to its likelihood or impact. In any instance where an issue is downgraded, a full, detailed explanation will be provided to the researcher - along with the opportunity to appeal, and make a case for a higher priority.",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "Submit your findings to help secure BIA!",
    "source_snapshot_hash": "7c540da2ffc7ddb515dbff5553ce69c1dd699cce06ca7cbec125b3a0fe0df744"
  },
  "diff": {
    "oldHash": "1ee39a12e9d931249d931a8afe45403b76d8025072180b16068dc930a1150e59",
    "newHash": "fdd4030bc244ed1f01b41b00c7534d2bf4dda32b05b7ccf80d348a8636922a65",
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
