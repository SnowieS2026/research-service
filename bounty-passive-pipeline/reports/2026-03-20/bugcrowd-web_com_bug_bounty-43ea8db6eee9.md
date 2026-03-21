# Bug Bounty Report – Web.com Bug Bounty

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/webdotcom |
| Report Date | 2026-03-20 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 9 new asset(s) added to scope; Allowed techniques updated; 1 asset(s) removed from scope; Program notes/triage status updated |

## Summary

9 new assets added to the scope of Web.com Bug Bounty on bugcrowd. 1 asset removed from scope. Allowed testing techniques list updated.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_name | Web.com Bug Bounty | Web.com Bug Bounty |
| scope_assets | www.networksolutions.com (https://www.networksolutions.com),https://www.bluehost… | www.networksolutions.com (https://www.networksolutions.com),https://www.bluehost… |
| exclusions | Out of Scope Targets | Out of Scope Targets |
| reward_range | $5000 | $5000 |
| payout_notes | Safe harbor: Safe harbor | Safe harbor: Safe harbor |
| allowed_techniques | XSS,CSRF,RCE,OAUTH | XSS,CSRF,RCE,OAUTH |
| last_seen_at | Apr 13, 2017 | Apr 13, 2017 |
| source_snapshot_hash | fcce9b854ea24f336dc19333557a7caa7cedbdfdcf07c50d21f6d0e5059e7adf | fcce9b854ea24f336dc19333557a7caa7cedbdfdcf07c50d21f6d0e5059e7adf |

## New Scope Assets

- www.networksolutions.com (https://www.networksolutions.com)
- https://www.bluehost.com/ (https://www.bluehost.com/)
- https://www.hostgator.com/ (https://www.hostgator.com/)
- here (https://docs.bugcrowd.com/researchers/participating-in-program/your-bugcrowdninja-email-address/)
- Web.com VDP (https://bugcrowd.com/webdotcom-vdp)
- Bugcrowd Support (https://bugcrowd-support.freshdesk.com/support/tickets/new)
- Tolgahan (https://bugcrowd.com/h/Tolgahan)
- 0x3HOLO (https://bugcrowd.com/h/0x3HOLO)
- standard disclosure terms. (https://www.bugcrowd.com/resource/standard-disclosure-terms/)

## Removed Scope Assets

- ~~You say it. We build it. It's as easy as Web.com!~~

## Recommendations

**Scope expansion detected** – 9 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: www.networksolutions.com (https://www.networksolutions.com), https://www.bluehost.com/ (https://www.bluehost.com/), https://www.hostgator.com/ (https://www.hostgator.com/)

**New allowed techniques** – The program has explicitly listed new acceptable techniques. Incorporate these into your testing workflow.

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Web.com Bug Bounty",
  "program_url": "https://bugcrowd.com/engagements/webdotcom",
  "scope_assets": [
    "www.networksolutions.com (https://www.networksolutions.com)",
    "https://www.bluehost.com/ (https://www.bluehost.com/)",
    "https://www.hostgator.com/ (https://www.hostgator.com/)",
    "here (https://docs.bugcrowd.com/researchers/participating-in-program/your-bugcrowdninja-email-address/)",
    "Web.com VDP (https://bugcrowd.com/webdotcom-vdp)",
    "Bugcrowd Support (https://bugcrowd-support.freshdesk.com/support/tickets/new)",
    "Tolgahan (https://bugcrowd.com/h/Tolgahan)",
    "0x3HOLO (https://bugcrowd.com/h/0x3HOLO)",
    "standard disclosure terms. (https://www.bugcrowd.com/resource/standard-disclosure-terms/)"
  ],
  "exclusions": [
    "Out of Scope Targets"
  ],
  "reward_range": "$5000",
  "reward_currency": "USD",
  "payout_notes": "Safe harbor: Safe harbor",
  "allowed_techniques": [
    "XSS",
    "CSRF",
    "RCE",
    "OAUTH"
  ],
  "prohibited_techniques": [],
  "last_seen_at": "Apr 13, 2017",
  "source_snapshot_hash": "fcce9b854ea24f336dc19333557a7caa7cedbdfdcf07c50d21f6d0e5059e7adf",
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
    "newHash": "43ea8db6eee99eba61f6f6ac88a545a8ad4156ea4f049b3e87a433b0d3af679f",
    "addedFields": [],
    "removedFields": [],
    "changedFields": [
      "program_name",
      "scope_assets",
      "exclusions",
      "reward_range",
      "payout_notes",
      "allowed_techniques",
      "last_seen_at",
      "source_snapshot_hash"
    ]
  }
}
```
