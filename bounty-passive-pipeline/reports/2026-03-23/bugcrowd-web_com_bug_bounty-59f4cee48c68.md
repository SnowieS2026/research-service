# Bug Bounty Report – Web.com Bug Bounty

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/webdotcom |
| Report Date | 2026-03-23 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 3 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

3 new assets added to the scope of Web.com Bug Bounty on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | Web.com Bug Bounty | Web.com Bug Bounty |
| scope_assets | https://www.networksolutions.com/,https://www.bluehost.com/,https://www.hostgato… | https://www.networksolutions.com/,https://www.bluehost.com/,https://www.hostgato… |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-23T12:06:14.348Z | 2026-03-23T12:06:14.348Z |
| source_snapshot_hash | 7ce317f21ffe | 7ce317f21ffe |

## New Scope Assets

- https://www.networksolutions.com/
- https://www.bluehost.com/
- https://www.hostgator.com/

## Removed Scope Assets

- ~~You say it. We build it. It's as easy as Web.com!~~

## Recommendations

**Scope expansion detected** – 3 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://www.networksolutions.com/, https://www.bluehost.com/, https://www.hostgator.com/

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Web.com Bug Bounty",
  "program_url": "https://bugcrowd.com/engagements/webdotcom",
  "scope_assets": [
    "https://www.networksolutions.com/",
    "https://www.bluehost.com/",
    "https://www.hostgator.com/"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-23T12:06:14.348Z",
  "source_snapshot_hash": "7ce317f21ffe",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Unknown",
    "program_url": "https://bugcrowd.com/engagements/webdotcom",
    "scope_assets": [
      "You say it. We build it. It's as easy as Web.com!"
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
    "reward_range": "The program relies on CVSS to evaluate impact and determine reward allocations. It is essential to highlight that the priority of a vulnerability might be altered due to its likelihood or impact.",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "You say it. We build it. It's as easy as Web.com!",
    "source_snapshot_hash": "cae76d920051ceacd39e9c9bd9b3a85b5ec593b199e4749639f218f9231dae0c"
  },
  "diff": {
    "oldHash": "18ab9478bfc024ab5ce9723b81b4143f233da63c0a89d8aeccd2156a63754f25",
    "newHash": "59f4cee48c68a80cf63c4e4fd5fabd918a9d6410fb8b4cfcdade17df74bee768",
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
