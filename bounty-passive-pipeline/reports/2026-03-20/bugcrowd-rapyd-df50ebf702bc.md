# Bug Bounty Report – Rapyd

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/rapyd |
| Report Date | 2026-03-20 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 9 new asset(s) added to scope; Allowed techniques updated; 17 asset(s) removed from scope |

## Summary

9 new assets added to the scope of Rapyd on bugcrowd. 17 assets removed from scope. Allowed testing techniques list updated.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| scope_assets | https://docs.rapyd.net/,https://docs.rapyd.net/build-with-rapyd/docs,https://doc… | https://docs.rapyd.net/,https://docs.rapyd.net/build-with-rapyd/docs,https://doc… |
| exclusions |  |  |
| reward_range | unknown | unknown |
| payout_notes |  |  |
| allowed_techniques |  |  |
| last_seen_at | 2026-03-20T22:27:46.708Z | 2026-03-20T22:27:46.708Z |
| source_snapshot_hash | 5e39a81ccd30 | 5e39a81ccd30 |

## New Scope Assets

- https://docs.rapyd.net/
- https://docs.rapyd.net/build-with-rapyd/docs
- https://docs.rapyd.net/en/make-your-first-api-call.html
- https://dashboard.rapyd.net/
- https://docs.rapyd.net/client-portal/docs/client-portal-overview
- https://docs.rapyd.net/build-with-rapyd/docs/rapyd-checkout-overview
- https://bugcrowd.com/rapyd-og/attachments/627492e1-9f27-482d-8710-174a392f38c5
- https://docs.rapyd.net/build-with-rapyd/reference/rapyd-verify-1
- https://jointhemoment.net/

## Removed Scope Assets

- ~~download here (https://bugcrowd.com/engagements/rapyd/attachments/903f7799-ad94-4746-a5f9-1df08635cac6)~~
- ~~read here (https://docs.bugcrowd.com/researchers/participating-in-program/your-bugcrowdninja-email-address/)~~
- ~~GitHub (https://github.com/RapydPayments/rapyd-request-signatures)~~
- ~~API Documentation (https://docs.rapyd.net/)~~
- ~~Rapyd documentation website (https://docs.rapyd.net/build-with-rapyd/docs)~~
- ~~Postman collection (https://docs.rapyd.net/en/make-your-first-api-call.html)~~
- ~~Client Portal (https://dashboard.rapyd.net/)~~
- ~~Client Portal Overview (https://docs.rapyd.net/client-portal/docs/client-portal-overview)~~
- ~~Checkout Overview (https://docs.rapyd.net/build-with-rapyd/docs/rapyd-checkout-overview)~~
- ~~How to find Rapyd Verify IFrame Video (https://bugcrowd.com/rapyd-og/attachments/627492e1-9f27-482d-8710-174a392f38c5)~~
- ~~Verify docs (https://docs.rapyd.net/build-with-rapyd/reference/rapyd-verify-1)~~
- ~~jointhemoment.net (https://jointhemoment.net/)~~
- ~~VerifyIframeDiscovery.mov (https://bugcrowd.com/engagements/rapyd/attachments/79562186-89eb-4ee0-9021-c90166897fe3)~~
- ~~create a ticket with Bugcrowd Support (https://bugcrowd-support.freshdesk.com/support/tickets/new)~~
- ~~boomerang_ (https://bugcrowd.com/h/boomerang_)~~
- ~~j34nsh33 (https://bugcrowd.com/h/j34nsh33)~~
- ~~standard disclosure terms. (https://www.bugcrowd.com/resource/standard-disclosure-terms/)~~

## Recommendations

**Scope expansion detected** – 9 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://docs.rapyd.net/, https://docs.rapyd.net/build-with-rapyd/docs, https://docs.rapyd.net/en/make-your-first-api-call.html

**New allowed techniques** – The program has explicitly listed new acceptable techniques. Incorporate these into your testing workflow.

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Rapyd",
  "program_url": "https://bugcrowd.com/engagements/rapyd",
  "scope_assets": [
    "https://docs.rapyd.net/",
    "https://docs.rapyd.net/build-with-rapyd/docs",
    "https://docs.rapyd.net/en/make-your-first-api-call.html",
    "https://dashboard.rapyd.net/",
    "https://docs.rapyd.net/client-portal/docs/client-portal-overview",
    "https://docs.rapyd.net/build-with-rapyd/docs/rapyd-checkout-overview",
    "https://bugcrowd.com/rapyd-og/attachments/627492e1-9f27-482d-8710-174a392f38c5",
    "https://docs.rapyd.net/build-with-rapyd/reference/rapyd-verify-1",
    "https://jointhemoment.net/"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-20T22:27:46.708Z",
  "source_snapshot_hash": "5e39a81ccd30",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Rapyd",
    "program_url": "https://bugcrowd.com/engagements/rapyd",
    "scope_assets": [
      "download here (https://bugcrowd.com/engagements/rapyd/attachments/903f7799-ad94-4746-a5f9-1df08635cac6)",
      "read here (https://docs.bugcrowd.com/researchers/participating-in-program/your-bugcrowdninja-email-address/)",
      "GitHub (https://github.com/RapydPayments/rapyd-request-signatures)",
      "API Documentation (https://docs.rapyd.net/)",
      "Rapyd documentation website (https://docs.rapyd.net/build-with-rapyd/docs)",
      "Postman collection (https://docs.rapyd.net/en/make-your-first-api-call.html)",
      "Client Portal (https://dashboard.rapyd.net/)",
      "Client Portal Overview (https://docs.rapyd.net/client-portal/docs/client-portal-overview)",
      "Checkout Overview (https://docs.rapyd.net/build-with-rapyd/docs/rapyd-checkout-overview)",
      "How to find Rapyd Verify IFrame Video (https://bugcrowd.com/rapyd-og/attachments/627492e1-9f27-482d-8710-174a392f38c5)",
      "Verify docs (https://docs.rapyd.net/build-with-rapyd/reference/rapyd-verify-1)",
      "jointhemoment.net (https://jointhemoment.net/)",
      "VerifyIframeDiscovery.mov (https://bugcrowd.com/engagements/rapyd/attachments/79562186-89eb-4ee0-9021-c90166897fe3)",
      "create a ticket with Bugcrowd Support (https://bugcrowd-support.freshdesk.com/support/tickets/new)",
      "boomerang_ (https://bugcrowd.com/h/boomerang_)",
      "j34nsh33 (https://bugcrowd.com/h/j34nsh33)",
      "standard disclosure terms. (https://www.bugcrowd.com/resource/standard-disclosure-terms/)"
    ],
    "exclusions": [
      "Out of Scope Targets"
    ],
    "reward_range": "$5000 – $7500",
    "reward_currency": "USD",
    "payout_notes": "Safe harbor: Safe harbor",
    "allowed_techniques": [
      "CSRF",
      "RCE"
    ],
    "prohibited_techniques": [],
    "last_seen_at": "Nov 01, 2022",
    "source_snapshot_hash": "db1fe87e45ec7a6574cf79d2645e3e43df29c8577a3576e3c1f1bb5bec424253"
  },
  "diff": {
    "oldHash": "030ab4b607115296ab1bccde7bea2e2330067986192f46d2e8900a0a02b6cf9d",
    "newHash": "df50ebf702bc35bf4409bccc9c56e82c8c4ec6cc7319e116e5e598f10d61a424",
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
