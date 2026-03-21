# Bug Bounty Report – Unknown

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements |
| Report Date | 2026-03-20 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | Allowed techniques updated |

## Summary

Allowed testing techniques list updated.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| allowed_techniques | RCE | RCE |
| source_snapshot_hash | 846a5c99b66c5434819b2e09b75a553defbe581563cf254cf6b864ec6a9cd820 | 846a5c99b66c5434819b2e09b75a553defbe581563cf254cf6b864ec6a9cd820 |

## Recommendations

**New allowed techniques** – The program has explicitly listed new acceptable techniques. Incorporate these into your testing workflow.

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Unknown",
  "program_url": "https://bugcrowd.com/engagements",
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
  "source_snapshot_hash": "846a5c99b66c5434819b2e09b75a553defbe581563cf254cf6b864ec6a9cd820",
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Unknown",
    "program_url": "https://bugcrowd.com/engagements",
    "scope_assets": [],
    "exclusions": [],
    "reward_range": "unknown",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "2026-03-20",
    "source_snapshot_hash": "0b9a10d3d8b248295acfd0724ea8f99984d5a6e54ea644894386c5a85590ebd1"
  },
  "diff": {
    "oldHash": "2e2ca7253aefe1cdd9b24f0eb1237a17c8da75a21652e5756175ffb66530b2d1",
    "newHash": "dfb60a49dc536d917b48df12531fc7f0a642b43204559a4bc3c9cd4e17765165",
    "addedFields": [],
    "removedFields": [],
    "changedFields": [
      "allowed_techniques",
      "source_snapshot_hash"
    ]
  }
}
```
