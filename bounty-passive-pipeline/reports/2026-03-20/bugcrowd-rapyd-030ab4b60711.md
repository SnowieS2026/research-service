# Bug Bounty Report – Rapyd

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/rapyd |
| Report Date | 2026-03-20 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 17 new asset(s) added to scope; Allowed techniques updated; 1 asset(s) removed from scope; Program notes/triage status updated |

## Summary

17 new assets added to the scope of Rapyd on bugcrowd. 1 asset removed from scope. Allowed testing techniques list updated.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_name | Rapyd | Rapyd |
| scope_assets | download here (https://bugcrowd.com/engagements/rapyd/attachments/903f7799-ad94-… | download here (https://bugcrowd.com/engagements/rapyd/attachments/903f7799-ad94-… |
| exclusions | Out of Scope Targets | Out of Scope Targets |
| reward_range | $5000 – $7500 | $5000 – $7500 |
| payout_notes | Safe harbor: Safe harbor | Safe harbor: Safe harbor |
| allowed_techniques | CSRF,RCE | CSRF,RCE |
| last_seen_at | Nov 01, 2022 | Nov 01, 2022 |
| source_snapshot_hash | db1fe87e45ec7a6574cf79d2645e3e43df29c8577a3576e3c1f1bb5bec424253 | db1fe87e45ec7a6574cf79d2645e3e43df29c8577a3576e3c1f1bb5bec424253 |

## New Scope Assets

- download here (https://bugcrowd.com/engagements/rapyd/attachments/903f7799-ad94-4746-a5f9-1df08635cac6)
- read here (https://docs.bugcrowd.com/researchers/participating-in-program/your-bugcrowdninja-email-address/)
- GitHub (https://github.com/RapydPayments/rapyd-request-signatures)
- API Documentation (https://docs.rapyd.net/)
- Rapyd documentation website (https://docs.rapyd.net/build-with-rapyd/docs)
- Postman collection (https://docs.rapyd.net/en/make-your-first-api-call.html)
- Client Portal (https://dashboard.rapyd.net/)
- Client Portal Overview (https://docs.rapyd.net/client-portal/docs/client-portal-overview)
- Checkout Overview (https://docs.rapyd.net/build-with-rapyd/docs/rapyd-checkout-overview)
- How to find Rapyd Verify IFrame Video (https://bugcrowd.com/rapyd-og/attachments/627492e1-9f27-482d-8710-174a392f38c5)
- Verify docs (https://docs.rapyd.net/build-with-rapyd/reference/rapyd-verify-1)
- jointhemoment.net (https://jointhemoment.net/)
- VerifyIframeDiscovery.mov (https://bugcrowd.com/engagements/rapyd/attachments/79562186-89eb-4ee0-9021-c90166897fe3)
- create a ticket with Bugcrowd Support (https://bugcrowd-support.freshdesk.com/support/tickets/new)
- boomerang_ (https://bugcrowd.com/h/boomerang_)
- j34nsh33 (https://bugcrowd.com/h/j34nsh33)
- standard disclosure terms. (https://www.bugcrowd.com/resource/standard-disclosure-terms/)

## Removed Scope Assets

- ~~We provide APIs that help integrate local payments and Fintech capabilities.~~

## Recommendations

**Scope expansion detected** – 17 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: download here (https://bugcrowd.com/engagements/rapyd/attachments/903f7799-ad94-4746-a5f9-1df08635cac6), read here (https://docs.bugcrowd.com/researchers/participating-in-program/your-bugcrowdninja-email-address/), GitHub (https://github.com/RapydPayments/rapyd-request-signatures)

**New allowed techniques** – The program has explicitly listed new acceptable techniques. Incorporate these into your testing workflow.

## Raw Diff

```json
{
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
  "source_snapshot_hash": "db1fe87e45ec7a6574cf79d2645e3e43df29c8577a3576e3c1f1bb5bec424253",
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Rapyd Stablecoin Promotion Overview",
    "program_url": "https://bugcrowd.com/engagements/rapyd",
    "scope_assets": [
      "We provide APIs that help integrate local payments and Fintech capabilities."
    ],
    "exclusions": [
      "As part of Rapyd's global fintech platform",
      "our Stablecoin capability supports seamless",
      "borderless payments using blockchain-based digital currencies pegged to stable assets such as USD. Unlike traditional cryptocurrencies that can experience high volatility",
      "stablecoins are designed to maintain price stability",
      "making them well-suited for real-world payments",
      "treasury management",
      "settlements",
      "and cross-border fund transfers."
    ],
    "reward_range": "Rapyd’s infrastructure already enables global payouts, digital wallets, local payment methods, and blockchain rails. The Stablecoin functionality further enhances how businesses can hold, transfer, and settle funds globally with improved speed, transparency, and operational efficiency.",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "We provide APIs that help integrate local payments and Fintech capabilities.",
    "source_snapshot_hash": "eb5501b551429c677463e927a5ef4c2a09019f6ac677f9807206300669e245c5"
  },
  "diff": {
    "oldHash": "0c379164d59ecbab45cbf760e4109cda03d1216cc96bbd65425fcd5dd6aba6a5",
    "newHash": "030ab4b607115296ab1bccde7bea2e2330067986192f46d2e8900a0a02b6cf9d",
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
