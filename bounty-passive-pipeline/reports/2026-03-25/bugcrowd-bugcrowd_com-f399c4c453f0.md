# Bug Bounty Report – bugcrowd.com

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/chime |
| Report Date | 2026-03-25 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 2 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

2 new assets added to the scope of bugcrowd.com on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | bugcrowd.com | bugcrowd.com |
| scope_assets | *.chime.com,*.chime.aws | *.chime.com,*.chime.aws |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-25T01:58:57.301Z | 2026-03-25T01:58:57.301Z |
| source_snapshot_hash | 3e9bb7b430a5 | 3e9bb7b430a5 |

## New Scope Assets

- *.chime.com
- *.chime.aws

## Removed Scope Assets

- ~~We unite everyday people to unlock their financial progress!~~

## Recommendations

**Scope expansion detected** – 2 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: *.chime.com, *.chime.aws

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "bugcrowd.com",
  "program_url": "https://bugcrowd.com/engagements/chime",
  "scope_assets": [
    "*.chime.com",
    "*.chime.aws"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-25T01:58:57.301Z",
  "source_snapshot_hash": "3e9bb7b430a5",
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
    "newHash": "f399c4c453f046a23394bbb1dc65bb21cfbf96b3956ae53b679e1666c86c38af",
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
