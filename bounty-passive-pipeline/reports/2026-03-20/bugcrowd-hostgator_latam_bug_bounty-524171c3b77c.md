# Bug Bounty Report – HostGator LATAM Bug Bounty

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/hostgator-latam-bb |
| Report Date | 2026-03-20 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 4 new asset(s) added to scope; Allowed techniques updated; 6 asset(s) removed from scope; Program notes/triage status updated |

## Summary

4 new assets added to the scope of HostGator LATAM Bug Bounty on bugcrowd. 6 assets removed from scope. Allowed testing techniques list updated.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_name | HostGator LATAM Bug Bounty | HostGator LATAM Bug Bounty |
| scope_assets | https://financeiro.hostgator.com.br (https://financeiro.hostgator.com.br),here (… | https://financeiro.hostgator.com.br (https://financeiro.hostgator.com.br),here (… |
| exclusions | Out of Scope | Out of Scope |
| reward_range | $1500 – $2500 | $1500 – $2500 |
| payout_notes | Safe harbor: Safe harbor | Safe harbor: Safe harbor |
| allowed_techniques | XSS,CSRF,RCE,OAUTH | XSS,CSRF,RCE,OAUTH |
| last_seen_at | Feb 01, 2022 | Feb 01, 2022 |
| source_snapshot_hash | 7a20e829bed57c0a6dae2fec8f8f42d0e37e7e31616dbb275cc6c54950c7f597 | 7a20e829bed57c0a6dae2fec8f8f42d0e37e7e31616dbb275cc6c54950c7f597 |

## New Scope Assets

- https://financeiro.hostgator.com.br (https://financeiro.hostgator.com.br)
- here (https://docs.bugcrowd.com/researchers/participating-in-program/your-bugcrowdninja-email-address/)
- Bugcrowd Support (https://bugcrowd-support.freshdesk.com/support/tickets/new)
- standard disclosure terms. (https://www.bugcrowd.com/resource/standard-disclosure-terms/)

## Removed Scope Assets

- ~~HostGator LATAM is the division of the global web hosting provider HostGator that serves Latin American markets~~
- ~~offering localized web hosting solutions~~
- ~~including shared hosting~~
- ~~WordPress hosting~~
- ~~and VPS hosting~~
- ~~tailored to the needs of businesses and individuals in the region.~~

## Recommendations

**Scope expansion detected** – 4 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://financeiro.hostgator.com.br (https://financeiro.hostgator.com.br), here (https://docs.bugcrowd.com/researchers/participating-in-program/your-bugcrowdninja-email-address/), Bugcrowd Support (https://bugcrowd-support.freshdesk.com/support/tickets/new)

**New allowed techniques** – The program has explicitly listed new acceptable techniques. Incorporate these into your testing workflow.

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "HostGator LATAM Bug Bounty",
  "program_url": "https://bugcrowd.com/engagements/hostgator-latam-bb",
  "scope_assets": [
    "https://financeiro.hostgator.com.br (https://financeiro.hostgator.com.br)",
    "here (https://docs.bugcrowd.com/researchers/participating-in-program/your-bugcrowdninja-email-address/)",
    "Bugcrowd Support (https://bugcrowd-support.freshdesk.com/support/tickets/new)",
    "standard disclosure terms. (https://www.bugcrowd.com/resource/standard-disclosure-terms/)"
  ],
  "exclusions": [
    "Out of Scope"
  ],
  "reward_range": "$1500 – $2500",
  "reward_currency": "USD",
  "payout_notes": "Safe harbor: Safe harbor",
  "allowed_techniques": [
    "XSS",
    "CSRF",
    "RCE",
    "OAUTH"
  ],
  "prohibited_techniques": [],
  "last_seen_at": "Feb 01, 2022",
  "source_snapshot_hash": "7a20e829bed57c0a6dae2fec8f8f42d0e37e7e31616dbb275cc6c54950c7f597",
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Unknown",
    "program_url": "https://bugcrowd.com/engagements/hostgator-latam-bb",
    "scope_assets": [
      "HostGator LATAM is the division of the global web hosting provider HostGator that serves Latin American markets",
      "offering localized web hosting solutions",
      "including shared hosting",
      "WordPress hosting",
      "and VPS hosting",
      "tailored to the needs of businesses and individuals in the region."
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
    "last_seen_at": "HostGator LATAM is the division of the global web hosting provider HostGator that serves Latin American markets, offering localized web hosting solutions, including shared hosting, WordPress hosting, and VPS hosting, tailored to the needs of businesses and individuals in the region.",
    "source_snapshot_hash": "a58e1b26d7c71d4a662fc8c50573936b6b7c33693c3c99feafe0e47f8e6c071e"
  },
  "diff": {
    "oldHash": "7351433a04fdfee2ab8392db3f1d3d5ede62d6d03f2ac93e5e52425b0ad79596",
    "newHash": "524171c3b77ca733b9c3807041f18e357a298582cdefd906ef183755777f0233",
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
