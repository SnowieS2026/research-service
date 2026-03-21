# Bug Bounty Report – Moovit Managed Bug Bounty Program

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/moovit-mbb-og |
| Report Date | 2026-03-21 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 3 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

3 new assets added to the scope of Moovit Managed Bug Bounty Program on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | Moovit Managed Bug Bounty Program | Moovit Managed Bug Bounty Program |
| scope_assets | https://play.google.com/store/apps/details?id=com.tranzmate&hl=en_US,https://app… | https://play.google.com/store/apps/details?id=com.tranzmate&hl=en_US,https://app… |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-21T10:57:45.949Z | 2026-03-21T10:57:45.949Z |
| source_snapshot_hash | d242d3e31b64 | d242d3e31b64 |

## New Scope Assets

- https://play.google.com/store/apps/details?id=com.tranzmate&hl=en_US
- https://apps.apple.com/us/app/moovit-all-transit-options/id498477945
- https://support.moovitapp.com/hc/en-us/articles/11389054527122-WayFinder-Augmented-Reality-helper-to-find-your-stop-iPhone-only

## Removed Scope Assets

- ~~Moovit is a leading Mobility as a Service (MaaS) solutions company and the #1 urban mobility app. Please submit your findings to this Bug Bounty Program.~~

## Recommendations

**Scope expansion detected** – 3 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://play.google.com/store/apps/details?id=com.tranzmate&hl=en_US, https://apps.apple.com/us/app/moovit-all-transit-options/id498477945, https://support.moovitapp.com/hc/en-us/articles/11389054527122-WayFinder-Augmented-Reality-helper-to-find-your-stop-iPhone-only

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Moovit Managed Bug Bounty Program",
  "program_url": "https://bugcrowd.com/engagements/moovit-mbb-og",
  "scope_assets": [
    "https://play.google.com/store/apps/details?id=com.tranzmate&hl=en_US",
    "https://apps.apple.com/us/app/moovit-all-transit-options/id498477945",
    "https://support.moovitapp.com/hc/en-us/articles/11389054527122-WayFinder-Augmented-Reality-helper-to-find-your-stop-iPhone-only"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-21T10:57:45.949Z",
  "source_snapshot_hash": "d242d3e31b64",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Unknown",
    "program_url": "https://bugcrowd.com/engagements/moovit-mbb-og",
    "scope_assets": [
      "Moovit is a leading Mobility as a Service (MaaS) solutions company and the #1 urban mobility app. Please submit your findings to this Bug Bounty Program."
    ],
    "exclusions": [
      "As further elaborated below",
      "we expect you to provide us with the full scope of information you come across when conducting your vulnerability research. Please try to minimize your access to personal information to the minimal extent possible."
    ],
    "reward_range": "Moovit is an innovative app that revolutionizes the way people navigate and use public transportation, allowing commuters to plan their journeys seamlessly. With real-time data, accurate schedules, and detailed routes, Moovit provides reliable information on buses, trains, metros, trams, and other public transportation options available in over 3,200 cities worldwide.",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "Moovit is a leading Mobility as a Service (MaaS) solutions company and the #1 urban mobility app. Please submit your findings to this Bug Bounty Program.",
    "source_snapshot_hash": "c5c5880805340b56b751bc48802c0c7324832f37ecac7a2cee2e8836c76c1e78"
  },
  "diff": {
    "oldHash": "0a186f80cad3eedd012ed7aabc7e8ab1d367126c38fcf66071e32d5d1f23d808",
    "newHash": "090317aa7ab708bcd719d946bd634229b348c1df9ef6e42ba10b10b3ed3eb533",
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
