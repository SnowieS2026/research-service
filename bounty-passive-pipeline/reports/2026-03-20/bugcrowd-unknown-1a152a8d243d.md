# Bug Bounty Report – Unknown

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/featured |
| Report Date | 2026-03-20 |
| Severity | **CRITICAL** |
| CVSS | 10 |
| Reasons | Allowed techniques updated; Program may have been closed or renamed |

## Summary

Allowed testing techniques list updated.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_name | Unknown | Unknown |
| allowed_techniques | RCE | RCE |
| source_snapshot_hash | b3bf9f527c7be13c7cdb1d59067364ee08ab6065036d400a16e2bf82d7297001 | b3bf9f527c7be13c7cdb1d59067364ee08ab6065036d400a16e2bf82d7297001 |

## Recommendations

**New allowed techniques** – The program has explicitly listed new acceptable techniques. Incorporate these into your testing workflow.

**High-impact change detected** – This change warrants immediate attention. Prioritise this program in your current testing cycle.

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Unknown",
  "program_url": "https://bugcrowd.com/engagements/featured",
  "scope_assets": [],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [
    "RCE"
  ],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-20",
  "source_snapshot_hash": "b3bf9f527c7be13c7cdb1d59067364ee08ab6065036d400a16e2bf82d7297001",
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Featured collections",
    "program_url": "https://bugcrowd.com/engagements/featured",
    "scope_assets": [],
    "exclusions": [],
    "reward_range": "unknown",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "2026-03-20",
    "source_snapshot_hash": "f38ff99acb7d9864744476ce9318e7dfdecfaa9114506d07fe9fbd806e03d76f"
  },
  "diff": {
    "oldHash": "077d65b6618984c9592f255c9c56f41382ca1b0265f2ac7eb51006f1bcefca7b",
    "newHash": "1a152a8d243d682208265baf08141b8c90bb7f69459cb07a54816a4d00d2a5ae",
    "addedFields": [],
    "removedFields": [],
    "changedFields": [
      "program_name",
      "allowed_techniques",
      "source_snapshot_hash"
    ]
  }
}
```
