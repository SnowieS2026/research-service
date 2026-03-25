# Bug Bounty Report – bugcrowd.com

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/okta |
| Report Date | 2026-03-25 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 2 new asset(s) added to scope; 21 asset(s) removed from scope |

## Summary

2 new assets added to the scope of bugcrowd.com on bugcrowd. 21 assets removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_name | bugcrowd.com | bugcrowd.com |
| scope_assets | *.okta.com,*.okta-cx.com | *.okta.com,*.okta-cx.com |
| last_seen_at | 2026-03-25T01:59:32.401Z | 2026-03-25T01:59:32.401Z |
| source_snapshot_hash | 56476b069aeb | 56476b069aeb |

## New Scope Assets

- *.okta.com
- *.okta-cx.com

## Removed Scope Assets

- ~~https://personal.trexcloud.com/~~
- ~~https://appdistribution.firebase.dev/i/4116040c826cc62f~~
- ~~https://appdistribution.firebase.dev/i/2f6eccc30f6a70eb~~
- ~~https://support.oktapersonal.com/~~
- ~~https://www.okta.com/sites/default/files/2024-03/Okta%20Personal%20Technical%20Whitepaper-020124.pdf~~
- ~~https://help.okta.com/en-us/content/topics/privileged-access/pam-overview.htm~~
- ~~https://help.okta.com/oie/en-us/content/topics/oda/oda-overview.htm~~
- ~~https://help.okta.com/oie/en-us/content/topics/oda/windows-mfa/win-mfa.htm~~
- ~~https://help.okta.com/oie/en-us/content/topics/oda/macos-mfa/macos-mfa.htm~~
- ~~https://help.okta.com/oie/en-us/content/topics/oda/macos-pw-sync/macos-pw-sync.htm~~
- ~~https://support.okta.com/~~
- ~~https://www.okta.com/fastpass/~~
- ~~https://bugcrowd.com/user/sign_up~~
- ~~https://app.scaleft.com/p/signupV2~~
- ~~https://docs.bugcrowd.com/researchers/participating-in-program/your-bugcrowdninja-email-address/~~
- ~~https://www.okta.com/products/advanced-server-access/~~
- ~~https://help.okta.com/asa/en-us/Content/Topics/Adv_Server_Access/docs/client.htm~~
- ~~https://apps.apple.com/us/app/okta-verify/id490179405~~
- ~~https://play.google.com/store/apps/details?id=com.okta.android.auth&hl=en_US&gl=US~~
- ~~https://help.okta.com/en/prod/Content/Topics/Adv_Server_Access/docs/sftd-windows.htm~~
- ~~https://help.okta.com/en/prod/Content/Topics/Settings/download-browser-plugin.htm~~

## Recommendations

**Scope expansion detected** – 2 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: *.okta.com, *.okta-cx.com

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "bugcrowd.com",
  "program_url": "https://bugcrowd.com/engagements/okta",
  "scope_assets": [
    "*.okta.com",
    "*.okta-cx.com"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-25T01:59:32.401Z",
  "source_snapshot_hash": "56476b069aeb",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Okta",
    "program_url": "https://bugcrowd.com/engagements/okta",
    "scope_assets": [
      "https://personal.trexcloud.com/",
      "https://appdistribution.firebase.dev/i/4116040c826cc62f",
      "https://appdistribution.firebase.dev/i/2f6eccc30f6a70eb",
      "https://support.oktapersonal.com/",
      "https://www.okta.com/sites/default/files/2024-03/Okta%20Personal%20Technical%20Whitepaper-020124.pdf",
      "https://help.okta.com/en-us/content/topics/privileged-access/pam-overview.htm",
      "https://help.okta.com/oie/en-us/content/topics/oda/oda-overview.htm",
      "https://help.okta.com/oie/en-us/content/topics/oda/windows-mfa/win-mfa.htm",
      "https://help.okta.com/oie/en-us/content/topics/oda/macos-mfa/macos-mfa.htm",
      "https://help.okta.com/oie/en-us/content/topics/oda/macos-pw-sync/macos-pw-sync.htm",
      "https://support.okta.com/",
      "https://www.okta.com/fastpass/",
      "https://bugcrowd.com/user/sign_up",
      "https://app.scaleft.com/p/signupV2",
      "https://docs.bugcrowd.com/researchers/participating-in-program/your-bugcrowdninja-email-address/",
      "https://www.okta.com/products/advanced-server-access/",
      "https://help.okta.com/asa/en-us/Content/Topics/Adv_Server_Access/docs/client.htm",
      "https://apps.apple.com/us/app/okta-verify/id490179405",
      "https://play.google.com/store/apps/details?id=com.okta.android.auth&hl=en_US&gl=US",
      "https://help.okta.com/en/prod/Content/Topics/Adv_Server_Access/docs/sftd-windows.htm",
      "https://help.okta.com/en/prod/Content/Topics/Settings/download-browser-plugin.htm"
    ],
    "exclusions": [],
    "reward_range": "unknown",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "2026-03-23T09:42:31.013Z",
    "source_snapshot_hash": "5e62f75a5c2a",
    "rewards": []
  },
  "diff": {
    "oldHash": "03038beb0732784ed85c75b23e1224487bc33cb90360b008009eeea6f084eb55",
    "newHash": "1e82e1ccb2a6c18d1aabee2591fae587a0b56482a32345c71e1ff606ab1bbae7",
    "addedFields": [],
    "removedFields": [],
    "changedFields": [
      "program_name",
      "scope_assets",
      "last_seen_at",
      "source_snapshot_hash"
    ]
  }
}
```
