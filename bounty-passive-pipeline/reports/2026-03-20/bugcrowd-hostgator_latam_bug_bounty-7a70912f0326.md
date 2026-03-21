# Bug Bounty Report – HostGator LATAM Bug Bounty

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/hostgator-latam-bb |
| Report Date | 2026-03-20 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 1 new asset(s) added to scope; Allowed techniques updated; 4 asset(s) removed from scope |

## Summary

1 new asset added to the scope of HostGator LATAM Bug Bounty on bugcrowd. 4 assets removed from scope. Allowed testing techniques list updated.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| scope_assets | https://financeiro.hostgator.com.br/ | https://financeiro.hostgator.com.br/ |
| exclusions |  |  |
| reward_range | unknown | unknown |
| payout_notes |  |  |
| allowed_techniques |  |  |
| last_seen_at | 2026-03-20T22:28:39.482Z | 2026-03-20T22:28:39.482Z |
| source_snapshot_hash | 79da2637697c | 79da2637697c |

## New Scope Assets

- https://financeiro.hostgator.com.br/

## Removed Scope Assets

- ~~https://financeiro.hostgator.com.br (https://financeiro.hostgator.com.br)~~
- ~~here (https://docs.bugcrowd.com/researchers/participating-in-program/your-bugcrowdninja-email-address/)~~
- ~~Bugcrowd Support (https://bugcrowd-support.freshdesk.com/support/tickets/new)~~
- ~~standard disclosure terms. (https://www.bugcrowd.com/resource/standard-disclosure-terms/)~~

## Recommendations

**Scope expansion detected** – 1 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://financeiro.hostgator.com.br/

**New allowed techniques** – The program has explicitly listed new acceptable techniques. Incorporate these into your testing workflow.

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "HostGator LATAM Bug Bounty",
  "program_url": "https://bugcrowd.com/engagements/hostgator-latam-bb",
  "scope_assets": [
    "https://financeiro.hostgator.com.br/"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-20T22:28:39.482Z",
  "source_snapshot_hash": "79da2637697c",
  "rewards": [],
  "prevProgram": {
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
    "source_snapshot_hash": "7a20e829bed57c0a6dae2fec8f8f42d0e37e7e31616dbb275cc6c54950c7f597"
  },
  "diff": {
    "oldHash": "524171c3b77ca733b9c3807041f18e357a298582cdefd906ef183755777f0233",
    "newHash": "7a70912f03268cb5b505b5bf0f14574e81ea25fb9215e23a5df11a33f706bae8",
    "addedFields": [
      "rewards"
    ],
    "removedFields": [],
    "changedFields": [
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
