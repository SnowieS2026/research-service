# Bug Bounty Report – Unknown

## Meta

| Field | Value |
| --- | --- |
| Platform | standoff365 |
| Program URL | https://bugbounty.standoff365.com/en-US/ |
| Report Date | 2026-03-25 |
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
| last_seen_at | 2026-03-25 | 2026-03-25 |
| source_snapshot_hash | 83783035aef2dcf776d6e8f32071ca37b63370f4547497049225180715162ad1 | 83783035aef2dcf776d6e8f32071ca37b63370f4547497049225180715162ad1 |

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
  "last_seen_at": "2026-03-25",
  "source_snapshot_hash": "83783035aef2dcf776d6e8f32071ca37b63370f4547497049225180715162ad1",
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
    "last_seen_at": "2026-03-23",
    "source_snapshot_hash": "2f42b16cb20df1102923cec7a8149defc8c0f359a0a37668fcc35b571f61e8da"
  },
  "diff": {
    "oldHash": "22e49bbcc15364290ec803b0c68ae6fd4863a0252bf445eefea01bb6643937ba",
    "newHash": "03f49553f026befeb54d899ff52ea6df53bf87bbae3321f28fbef8782453e505",
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
