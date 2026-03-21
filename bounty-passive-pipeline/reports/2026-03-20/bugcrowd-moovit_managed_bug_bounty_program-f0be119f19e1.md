# Bug Bounty Report – Moovit Managed Bug Bounty Program

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/moovit-mbb-og |
| Report Date | 2026-03-20 |
| Severity | **HIGH** |
| CVSS | 8.5 |
| Reasons | 10 new asset(s) added to scope; Reward range increased; Allowed techniques updated; 1 asset(s) removed from scope; Program notes/triage status updated |

## Summary

10 new assets added to the scope of Moovit Managed Bug Bounty Program on bugcrowd. 1 asset removed from scope. Reward range increased – higher payouts may be available now. Allowed testing techniques list updated.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_name | Moovit Managed Bug Bounty Program | Moovit Managed Bug Bounty Program |
| scope_assets | Bugcrowd Vulnerability Rating Taxonomy (https://bugcrowd.com/vulnerability-ratin… | Bugcrowd Vulnerability Rating Taxonomy (https://bugcrowd.com/vulnerability-ratin… |
| exclusions | Out Of Scope | Out Of Scope |
| reward_range | $4000 – $7000 | $4000 – $7000 |
| payout_notes | Safe harbor: Safe harbor | Safe harbor: Safe harbor |
| allowed_techniques | CSRF,RCE | CSRF,RCE |
| last_seen_at | Jan 16, 2024 | Jan 16, 2024 |
| source_snapshot_hash | 5e4df2669be49ca5ffa0bb3ff039036c99ead586f9ac2e548f19f44f3a0e76c3 | 5e4df2669be49ca5ffa0bb3ff039036c99ead586f9ac2e548f19f44f3a0e76c3 |

## New Scope Assets

- Bugcrowd Vulnerability Rating Taxonomy (https://bugcrowd.com/vulnerability-rating-taxonomy)
- Moovit Android App (https://play.google.com/store/apps/details?id=com.tranzmate&hl=en_US)
- Moovit iOS App (https://apps.apple.com/us/app/moovit-all-transit-options/id498477945)
- WayFinder - Augmented Reality helper to find your stop (https://support.moovitapp.com/hc/en-us/articles/11389054527122-WayFinder-Augmented-Reality-helper-to-find-your-stop-iPhone-only)
- here (https://docs.bugcrowd.com/researchers/participating-in-program/your-bugcrowdninja-email-address/)
- moovitapp.com (http://moovitapp.com/)
- create a ticket with Bugcrowd Support (https://bugcrowd-support.freshdesk.com/support/tickets/new)
- Moovit Support (https://support.moovitapp.com/hc/en-us/categories/4403004531090-What-s-New)
- standard disclosure terms. (https://www.bugcrowd.com/resource/standard-disclosure-terms/)
- Public Disclosure Policy (https://docs.bugcrowd.com/researchers/disclosure/disclosure/#f-coordinated-disclosure)

## Removed Scope Assets

- ~~Moovit is a leading Mobility as a Service (MaaS) solutions company and the #1 urban mobility app. Please submit your findings to this Bug Bounty Program.~~

## Reward Changes

Reward range **increased**.

## Recommendations

**Scope expansion detected** – 10 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: Bugcrowd Vulnerability Rating Taxonomy (https://bugcrowd.com/vulnerability-rating-taxonomy), Moovit Android App (https://play.google.com/store/apps/details?id=com.tranzmate&hl=en_US), Moovit iOS App (https://apps.apple.com/us/app/moovit-all-transit-options/id498477945)

**Bounty increased** – Reward ranges have gone up. This program may be actively soliciting higher-severity findings. Consider focusing effort here.

**New allowed techniques** – The program has explicitly listed new acceptable techniques. Incorporate these into your testing workflow.

**High-impact change detected** – This change warrants immediate attention. Prioritise this program in your current testing cycle.

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Moovit Managed Bug Bounty Program",
  "program_url": "https://bugcrowd.com/engagements/moovit-mbb-og",
  "scope_assets": [
    "Bugcrowd Vulnerability Rating Taxonomy (https://bugcrowd.com/vulnerability-rating-taxonomy)",
    "Moovit Android App (https://play.google.com/store/apps/details?id=com.tranzmate&hl=en_US)",
    "Moovit iOS App (https://apps.apple.com/us/app/moovit-all-transit-options/id498477945)",
    "WayFinder - Augmented Reality helper to find your stop (https://support.moovitapp.com/hc/en-us/articles/11389054527122-WayFinder-Augmented-Reality-helper-to-find-your-stop-iPhone-only)",
    "here (https://docs.bugcrowd.com/researchers/participating-in-program/your-bugcrowdninja-email-address/)",
    "moovitapp.com (http://moovitapp.com/)",
    "create a ticket with Bugcrowd Support (https://bugcrowd-support.freshdesk.com/support/tickets/new)",
    "Moovit Support (https://support.moovitapp.com/hc/en-us/categories/4403004531090-What-s-New)",
    "standard disclosure terms. (https://www.bugcrowd.com/resource/standard-disclosure-terms/)",
    "Public Disclosure Policy (https://docs.bugcrowd.com/researchers/disclosure/disclosure/#f-coordinated-disclosure)"
  ],
  "exclusions": [
    "Out Of Scope"
  ],
  "reward_range": "$4000 – $7000",
  "reward_currency": "USD",
  "payout_notes": "Safe harbor: Safe harbor",
  "allowed_techniques": [
    "CSRF",
    "RCE"
  ],
  "prohibited_techniques": [],
  "last_seen_at": "Jan 16, 2024",
  "source_snapshot_hash": "5e4df2669be49ca5ffa0bb3ff039036c99ead586f9ac2e548f19f44f3a0e76c3",
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
    "newHash": "f0be119f19e1aa375d5a3569d68bebd5b15e923385eb9fee65dfa89436f52cfd",
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
