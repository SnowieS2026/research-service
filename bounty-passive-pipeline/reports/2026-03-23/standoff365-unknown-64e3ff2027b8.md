# Bug Bounty Report – Unknown

## Meta

| Field | Value |
| --- | --- |
| Platform | standoff365 |
| Program URL | https://bugbounty.standoff365.com/en-US/ |
| Report Date | 2026-03-23 |
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
| source_snapshot_hash | 99f36cfe30de1b1acef9ec3e129343a9d716a321a3824c366cfc0fe16ccf9555 | 99f36cfe30de1b1acef9ec3e129343a9d716a321a3824c366cfc0fe16ccf9555 |

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
  "last_seen_at": "2026-03-23",
  "source_snapshot_hash": "99f36cfe30de1b1acef9ec3e129343a9d716a321a3824c366cfc0fe16ccf9555",
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
    "newHash": "64e3ff2027b80075364b9ed27cb1c3fe990868ddb1c4f22f16c67e6bb5bf0d8b",
    "addedFields": [],
    "removedFields": [],
    "changedFields": [
      "program_name",
      "program_url",
      "source_snapshot_hash"
    ]
  }
}
```
