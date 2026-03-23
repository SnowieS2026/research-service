# Bug Bounty Report – Unknown

## Meta

| Field | Value |
| --- | --- |
| Platform | standoff365 |
| Program URL | https://bugbounty.standoff365.com/en-US/ |
| Report Date | 2026-03-22 |
| Severity | **CRITICAL** |
| CVSS | 10 |
| Reasons | Program may have been closed or renamed |

## Summary

Minor metadata change detected for Unknown. Severity: CRITICAL.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_name | Unknown | Unknown |
| program_url | https://bugbounty.standoff365.com/en-US/ | https://bugbounty.standoff365.com/en-US/ |
| last_seen_at | 2026-03-22 | 2026-03-22 |
| source_snapshot_hash | 96616c9d1bf325c7d91f6a312523c26b78fc75d91b0df28f26fea1cb06152772 | 96616c9d1bf325c7d91f6a312523c26b78fc75d91b0df28f26fea1cb06152772 |

## Recommendations

**High-impact change detected** – This change warrants immediate attention. Prioritise this program in your current testing cycle.

## Raw Diff

```json
{
  "platform": "standoff365",
  "program_name": "Unknown",
  "program_url": "https://bugbounty.standoff365.com/en-US/",
  "scope_assets": [],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-22",
  "source_snapshot_hash": "96616c9d1bf325c7d91f6a312523c26b78fc75d91b0df28f26fea1cb06152772",
  "prevProgram": {
    "platform": "standoff365",
    "program_name": "Here businesses \nand white hat hackers \njoin forces",
    "program_url": "https://standoff365.com/en-US/",
    "scope_assets": [],
    "exclusions": [],
    "reward_range": "unknown",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "2026-03-21",
    "source_snapshot_hash": "06f0a073a9b7cd367afc02f6222222129eeccfa3c327111cc270256f3cb2566a"
  },
  "diff": {
    "oldHash": "2e2691dcff3bb23f5daa7637ff7c160dd72d00eee58e316977a0a30522294981",
    "newHash": "9cd0398044e4c1e8c4649392fd58cf5433755c4f89b1352240b74db79b923be8",
    "addedFields": [],
    "removedFields": [],
    "changedFields": [
      "program_name",
      "program_url",
      "last_seen_at",
      "source_snapshot_hash"
    ]
  }
}
```
