# Bug Bounty Report – American Battle Monuments Commission

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/abmc-vdp |
| Report Date | 2026-03-22 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 1 new asset(s) added to scope; 1 asset(s) removed from scope |

## Summary

1 new asset added to the scope of American Battle Monuments Commission on bugcrowd. 1 asset removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | American Battle Monuments Commission | American Battle Monuments Commission |
| scope_assets | https://abmc.gov/ | https://abmc.gov/ |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-22T00:31:33.339Z | 2026-03-22T00:31:33.339Z |
| source_snapshot_hash | 4b894d218fcf | 4b894d218fcf |

## New Scope Assets

- https://abmc.gov/

## Removed Scope Assets

- ~~American Battle Monuments Commission Vulnerability Disclosure Policy~~

## Recommendations

**Scope expansion detected** – 1 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://abmc.gov/

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "American Battle Monuments Commission",
  "program_url": "https://bugcrowd.com/engagements/abmc-vdp",
  "scope_assets": [
    "https://abmc.gov/"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-22T00:31:33.339Z",
  "source_snapshot_hash": "4b894d218fcf",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Unknown",
    "program_url": "https://bugcrowd.com/engagements/abmc-vdp",
    "scope_assets": [
      "American Battle Monuments Commission Vulnerability Disclosure Policy"
    ],
    "exclusions": [
      "ABMC is committed to ensuring the security of the American public by protecting their information. This policy is intended to give security researchers clear guidelines for conducting vulnerability discovery activities and to convey our preferences about how to submit discovered vulnerabilities to us."
    ],
    "reward_range": "This policy describes what systems and types of research are covered under this policy, how to send us vulnerability reports, and how long we ask security researchers to wait before publicly disclosing vulnerabilities.",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "American Battle Monuments Commission Vulnerability Disclosure Policy",
    "source_snapshot_hash": "1b9f3b9c8f74d47617e52eb4bed226719fe6957dca0ab67a65ee6630844bcb80"
  },
  "diff": {
    "oldHash": "569592774eb8b155e55cef6bd3596953f93ad3fbbb7e211640c77f5fb32f04e2",
    "newHash": "0f2a1c4ec716e7de7cd2c6f9e893cfb687bb8102dc2320ea328433ab920b5836",
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
