# Bug Bounty Report – Bureau of Land Management

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/blm-vdp |
| Report Date | 2026-03-23 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 7 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

7 new assets added to the scope of Bureau of Land Management on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | Bureau of Land Management | Bureau of Land Management |
| scope_assets | https://www.bugcrowd.com/,https://bugcrowd.com/h/p396,https://bugcrowd.com/h/MX7… | https://www.bugcrowd.com/,https://bugcrowd.com/h/p396,https://bugcrowd.com/h/MX7… |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-23T10:38:26.089Z | 2026-03-23T10:38:26.089Z |
| source_snapshot_hash | 9e1198aa6102 | 9e1198aa6102 |

## New Scope Assets

- https://www.bugcrowd.com/
- https://bugcrowd.com/h/p396
- https://bugcrowd.com/h/MX7OW
- https://bugcrowd-support.freshdesk.com/support/tickets/new
- https://www.bugcrowd.com/resource/standard-disclosure-terms/
- https://docs.bugcrowd.com/researchers/disclosure/disclosure/#f-coordinated-disclosure
- https://docs.bugcrowd.com/researchers/onboarding/welcome

## Removed Scope Assets

- ~~Vulnerability Disclosure Policy~~

## Recommendations

**Scope expansion detected** – 7 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://www.bugcrowd.com/, https://bugcrowd.com/h/p396, https://bugcrowd.com/h/MX7OW

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Bureau of Land Management",
  "program_url": "https://bugcrowd.com/engagements/blm-vdp",
  "scope_assets": [
    "https://www.bugcrowd.com/",
    "https://bugcrowd.com/h/p396",
    "https://bugcrowd.com/h/MX7OW",
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
  "last_seen_at": "2026-03-23T10:38:26.089Z",
  "source_snapshot_hash": "9e1198aa6102",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Unknown",
    "program_url": "https://bugcrowd.com/engagements/blm-vdp",
    "scope_assets": [
      "Vulnerability Disclosure Policy"
    ],
    "exclusions": [
      "This policy describes what systems and types of research are covered under this policy",
      "how to send us vulnerability reports",
      "and how long we ask security researchers to wait before publicly disclosing vulnerabilities."
    ],
    "reward_range": "We encourage you to contact us to report potential vulnerabilities in our systems.",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "Vulnerability Disclosure Policy",
    "source_snapshot_hash": "e0ad0c04355210d254be9948976e8df3dfb40b258d4207c3b595ee75ddf61bb8"
  },
  "diff": {
    "oldHash": "007f66eb7bb7199fc529b9d941a06ab724284f8e05aa6a59443fce33e89d8c89",
    "newHash": "7ddaceb5953005b640eafe51ce9075557727cebe1ba8bf151935978d634dc91b",
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
