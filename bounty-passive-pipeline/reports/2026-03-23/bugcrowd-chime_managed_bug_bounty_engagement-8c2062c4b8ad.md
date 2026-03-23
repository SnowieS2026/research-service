# Bug Bounty Report – Chime Managed Bug Bounty Engagement

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/chime |
| Report Date | 2026-03-23 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 14 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

14 new assets added to the scope of Chime Managed Bug Bounty Engagement on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | Chime Managed Bug Bounty Engagement | Chime Managed Bug Bounty Engagement |
| scope_assets | https://*.chime.com/,https://www.chime.com/,https://app.chime.com/,https://play.… | https://*.chime.com/,https://www.chime.com/,https://app.chime.com/,https://play.… |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-23T09:42:17.213Z | 2026-03-23T09:42:17.213Z |
| source_snapshot_hash | 0bd9ddc8318b | 0bd9ddc8318b |

## New Scope Assets

- https://*.chime.com/
- https://www.chime.com/
- https://app.chime.com/
- https://play.google.com/store/apps/details?id=com.onedebit.chime
- https://apps.apple.com/us/app/chime-mobile-banking/id836215269
- https://app.bitrise.io/app/5bec038cb1e318cd/installable-artifacts/9ad837caadc77d33/public-install-page/ef39a3be131d116b6da3f9d05c70d757
- https://app.bitrise.io/app/5bec038cb1e318cd/installable-artifacts/d2424d9760af75d5/public-install-page/4883ab94cee43b34c597ad1df833911f
- http://member-qa.chime.com/enroll
- https://app.saltlabs.com/
- https://play.google.com/store/apps/details?id=com.saltlabs.app
- https://apps.apple.com/us/app/salt-work-and-get-rewarded/id1668462142
- https://app.staging.saltlabs.com/
- https://chime.financial/
- https://chimescholars.org/

## Removed Scope Assets

- ~~We unite everyday people to unlock their financial progress!~~

## Recommendations

**Scope expansion detected** – 14 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://*.chime.com/, https://www.chime.com/, https://app.chime.com/

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Chime Managed Bug Bounty Engagement",
  "program_url": "https://bugcrowd.com/engagements/chime",
  "scope_assets": [
    "https://*.chime.com/",
    "https://www.chime.com/",
    "https://app.chime.com/",
    "https://play.google.com/store/apps/details?id=com.onedebit.chime",
    "https://apps.apple.com/us/app/chime-mobile-banking/id836215269",
    "https://app.bitrise.io/app/5bec038cb1e318cd/installable-artifacts/9ad837caadc77d33/public-install-page/ef39a3be131d116b6da3f9d05c70d757",
    "https://app.bitrise.io/app/5bec038cb1e318cd/installable-artifacts/d2424d9760af75d5/public-install-page/4883ab94cee43b34c597ad1df833911f",
    "http://member-qa.chime.com/enroll",
    "https://app.saltlabs.com/",
    "https://play.google.com/store/apps/details?id=com.saltlabs.app",
    "https://apps.apple.com/us/app/salt-work-and-get-rewarded/id1668462142",
    "https://app.staging.saltlabs.com/",
    "https://chime.financial/",
    "https://chimescholars.org/"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-23T09:42:17.213Z",
  "source_snapshot_hash": "0bd9ddc8318b",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Disclosure Policy",
    "program_url": "https://bugcrowd.com/engagements/chime",
    "scope_assets": [
      "We unite everyday people to unlock their financial progress!"
    ],
    "exclusions": [
      "As a fintech leader",
      "security is at the heart of everything we do. We’re committed to providing our members with a safe",
      "reliable banking experience",
      "and your expertise as a security researcher plays a vital role in making that possible."
    ],
    "reward_range": "At Chime, our mission is to bring financial peace of mind to everyone. We’ve helped millions of Americans by removing unnecessary fees, enabling automatic savings, and offering financial wellness features such as fee-free overdrafts, early paycheck access through MyPay, credit building tools, and Chime at Workplace. These benefits only matter if they’re secure, and that’s where you come in.",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "We unite everyday people to unlock their financial progress!",
    "source_snapshot_hash": "5f348c718ec5b2539d9043bcf276b39932b5c0c7f8d849f9ef16f536470e22bd"
  },
  "diff": {
    "oldHash": "01ddf245b14767ea696c6f1bbf89aa43cf50717ce4e1496061a0eb02790e02ce",
    "newHash": "8c2062c4b8ade83db2301bdd7dda67f7a6482f7dfe1f6aa8c7d482e27da3c03b",
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
