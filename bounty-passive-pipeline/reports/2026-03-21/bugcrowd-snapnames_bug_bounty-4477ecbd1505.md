# Bug Bounty Report – SnapNames Bug Bounty

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/snapnames |
| Report Date | 2026-03-21 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 2 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

2 new assets added to the scope of SnapNames Bug Bounty on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | SnapNames Bug Bounty | SnapNames Bug Bounty |
| scope_assets | https://snapnames.com/,https://www.namejet.com/ | https://snapnames.com/,https://www.namejet.com/ |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-21T10:59:17.892Z | 2026-03-21T10:59:17.892Z |
| source_snapshot_hash | 2b6decefb8c6 | 2b6decefb8c6 |

## New Scope Assets

- https://snapnames.com/
- https://www.namejet.com/

## Removed Scope Assets

- ~~SnapNames is the web's domain name marketplace of choice throughout the world. We bring businesses global access to already-registered domains with the convenience of online and mobile shopping.~~

## Recommendations

**Scope expansion detected** – 2 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://snapnames.com/, https://www.namejet.com/

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "SnapNames Bug Bounty",
  "program_url": "https://bugcrowd.com/engagements/snapnames",
  "scope_assets": [
    "https://snapnames.com/",
    "https://www.namejet.com/"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-21T10:59:17.892Z",
  "source_snapshot_hash": "2b6decefb8c6",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Unknown",
    "program_url": "https://bugcrowd.com/engagements/snapnames",
    "scope_assets": [
      "SnapNames is the web's domain name marketplace of choice throughout the world. We bring businesses global access to already-registered domains with the convenience of online and mobile shopping."
    ],
    "exclusions": [
      "You may not participate in this program if you are an employee or family member of an employee",
      "or a current vendor or employee of such vendor of Newfold Digital and any of its subsidiaries. You are also prohibited from participating if you are (i) in a country or territory that is the target of U.S. sanctions (including Cuba",
      "Iran",
      "Syria",
      "North Korea",
      "or the Crimea region of Ukraine)",
      "(ii) designated as a Specially Designated National or Blocked Person by the U.S. Department of the Treasury’s Office of Foreign Assets Control or otherwise owned",
      "controlled",
      "or acting on behalf of such a person or entity",
      "or (iii) otherwise a prohibited party under U.S. trade and export control laws."
    ],
    "reward_range": "The program relies on CVSS to evaluate impact and determine reward allocations. It is essential to highlight that the priority of a vulnerability might be altered due to following:",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "SnapNames is the web's domain name marketplace of choice throughout the world. We bring businesses global access to already-registered domains with the convenience of online and mobile shopping.",
    "source_snapshot_hash": "4d7c8e9530c14db89041e1d70431f78275a986795c148d528deb3bc94909d8c9"
  },
  "diff": {
    "oldHash": "342f94fd62f2afb117bab8386475cc4eeb5e19c530d64fa4373d0305cbca1207",
    "newHash": "4477ecbd1505f7a7aca3b65e64da6da87b391d3b9b917ad5c457e00ff5759909",
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
