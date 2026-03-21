# Bug Bounty Report – YNAB

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/ynab |
| Report Date | 2026-03-21 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 5 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

5 new assets added to the scope of YNAB on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | YNAB | YNAB |
| scope_assets | https://staging-api.bany.dev/v1,https://api.ynab.com/,https://support.ynab.com/e… | https://staging-api.bany.dev/v1,https://api.ynab.com/,https://support.ynab.com/e… |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-21T10:59:42.385Z | 2026-03-21T10:59:42.385Z |
| source_snapshot_hash | 3d9f0472eee9 | 3d9f0472eee9 |

## New Scope Assets

- https://staging-api.bany.dev/v1
- https://api.ynab.com/
- https://support.ynab.com/en_us/how-to-protect-your-account-with-two-step-verification-rkKHuLlRc#troubleshoot
- https://staging-api.bany.dev/
- https://www.ynab.com/

## Removed Scope Assets

- ~~Download YNAB to get good with money and never worry about it again.~~

## Recommendations

**Scope expansion detected** – 5 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://staging-api.bany.dev/v1, https://api.ynab.com/, https://support.ynab.com/en_us/how-to-protect-your-account-with-two-step-verification-rkKHuLlRc#troubleshoot

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "YNAB",
  "program_url": "https://bugcrowd.com/engagements/ynab",
  "scope_assets": [
    "https://staging-api.bany.dev/v1",
    "https://api.ynab.com/",
    "https://support.ynab.com/en_us/how-to-protect-your-account-with-two-step-verification-rkKHuLlRc#troubleshoot",
    "https://staging-api.bany.dev/",
    "https://www.ynab.com/"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-21T10:59:42.385Z",
  "source_snapshot_hash": "3d9f0472eee9",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Unknown",
    "program_url": "https://bugcrowd.com/engagements/ynab",
    "scope_assets": [
      "Download YNAB to get good with money and never worry about it again."
    ],
    "exclusions": [
      "For the initial prioritization/rating of findings",
      "this engagement will use the Bugcrowd Vulnerability Rating Taxonomy. However",
      "it is important to note that in some cases a vulnerability priority will be modified due to its likelihood or impact. In any instance where an issue is downgraded",
      "a full",
      "detailed explanation will be provided to the researcher - along with the opportunity to appeal",
      "and make a case for a higher priority."
    ],
    "reward_range": "Client-Side:\nEmber.js Single-Page Application\nLatest versions of Chrome, Safari, Edge, and Firefox supported\nServer-Side:\nRuby on Rails 7.x (Running on Heroku)\nRuby 3.x, Puma 6.x\nCrunchyBridge Postgres\nCloudFront CDN\nMarketing Site:\nWebFlow",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "Download YNAB to get good with money and never worry about it again.",
    "source_snapshot_hash": "193a9df60c53dd7b2183c23bf92e95fd937bbe1652b0febec1002d19596e400c"
  },
  "diff": {
    "oldHash": "10a9a86eb9f1c8fd947715436da421b248db4b5e9d85326c3922ff6a2cb50886",
    "newHash": "9634b7c806825289023e03ef2643ff90e09c318a0bfbb22b6b7439b6a7c7f22a",
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
