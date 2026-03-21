# Bug Bounty Report – Optus Managed Bug Bounty

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/optus-mbb-og |
| Report Date | 2026-03-21 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 28 new asset(s) added to scope; 6 asset(s) removed from scope |

## Summary

28 new assets added to the scope of Optus Managed Bug Bounty on bugcrowd. 6 assets removed from scope.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| program_name | Optus Managed Bug Bounty | Optus Managed Bug Bounty |
| scope_assets | https://webmail.optusnet.com.au/,https://apps.apple.com/au/app/my-optus/id503716… | https://webmail.optusnet.com.au/,https://apps.apple.com/au/app/my-optus/id503716… |
| exclusions |  |  |
| reward_range | unknown | unknown |
| last_seen_at | 2026-03-21T12:16:38.140Z | 2026-03-21T12:16:38.140Z |
| source_snapshot_hash | 482765432d44 | 482765432d44 |

## New Scope Assets

- https://webmail.optusnet.com.au/
- https://apps.apple.com/au/app/my-optus/id503716230
- https://play.google.com/store/apps/details?id=au.com.optus.selfservice&hl=en_AU&gl=US
- https://www.outsourcing.optus.net.au/eFRAMS3/
- https://www.outsourcing2.optus.net.au/eFRAMS3/
- https://www.optus.com.au/osp-ecare
- https://optus.my.site.com/MyHub/s/
- https://ddosportal.optus.com.au/
- https://ogws.optusnet.com.au/
- https://oes.optusnet.com.au/
- https://samsung-pp.optussport.tv/
- https://chromecast-pp.optussport.tv/
- https://api-cdn.optussport.info/api/*
- https://static.sport-pp.optus.com.au/api/*
- https://stats-pp.akamai.optussport.tv/
- https://stats.optussport.info/
- https://cms-uat.optussport.tv/
- https://cms-qa.optussport.tv/
- https://static.cms-uat.optussport.tv/
- https://static.cms-qa.optussport.tv/
- https://sport.optus.com.au/
- https://samsung.optussport.tv/
- https://api-cdn.optussport.tv/api/*
- https://static.sport.optus.com.au/api/*
- https://stats.sport.optus.com.au/
- https://stats.akamai.optussport.tv/
- https://cms.optussport.tv/
- https://static.cms.optussport.tv/

## Removed Scope Assets

- ~~SingTel Optus is one of the largest telecommunications companies in Australia~~
- ~~Optus provides mobile~~
- ~~telephony~~
- ~~internet~~
- ~~satellite~~
- ~~entertainment and business network services each day. Please submit your findings to this Bug Bounty Program~~

## Recommendations

**Scope expansion detected** – 28 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://webmail.optusnet.com.au/, https://apps.apple.com/au/app/my-optus/id503716230, https://play.google.com/store/apps/details?id=au.com.optus.selfservice&hl=en_AU&gl=US

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Optus Managed Bug Bounty",
  "program_url": "https://bugcrowd.com/engagements/optus-mbb-og",
  "scope_assets": [
    "https://webmail.optusnet.com.au/",
    "https://apps.apple.com/au/app/my-optus/id503716230",
    "https://play.google.com/store/apps/details?id=au.com.optus.selfservice&hl=en_AU&gl=US",
    "https://www.outsourcing.optus.net.au/eFRAMS3/",
    "https://www.outsourcing2.optus.net.au/eFRAMS3/",
    "https://www.optus.com.au/osp-ecare",
    "https://optus.my.site.com/MyHub/s/",
    "https://ddosportal.optus.com.au/",
    "https://ogws.optusnet.com.au/",
    "https://oes.optusnet.com.au/",
    "https://samsung-pp.optussport.tv/",
    "https://chromecast-pp.optussport.tv/",
    "https://api-cdn.optussport.info/api/*",
    "https://static.sport-pp.optus.com.au/api/*",
    "https://stats-pp.akamai.optussport.tv/",
    "https://stats.optussport.info/",
    "https://cms-uat.optussport.tv/",
    "https://cms-qa.optussport.tv/",
    "https://static.cms-uat.optussport.tv/",
    "https://static.cms-qa.optussport.tv/",
    "https://sport.optus.com.au/",
    "https://samsung.optussport.tv/",
    "https://api-cdn.optussport.tv/api/*",
    "https://static.sport.optus.com.au/api/*",
    "https://stats.sport.optus.com.au/",
    "https://stats.akamai.optussport.tv/",
    "https://cms.optussport.tv/",
    "https://static.cms.optussport.tv/"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-21T12:16:38.140Z",
  "source_snapshot_hash": "482765432d44",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Unknown",
    "program_url": "https://bugcrowd.com/engagements/optus-mbb-og",
    "scope_assets": [
      "SingTel Optus is one of the largest telecommunications companies in Australia",
      "Optus provides mobile",
      "telephony",
      "internet",
      "satellite",
      "entertainment and business network services each day. Please submit your findings to this Bug Bounty Program"
    ],
    "exclusions": [
      "As part of aspiring to be best for our customers",
      "we have introduced a Managed Bug Bounty Program.  We value and support the work undertaken by the security research community and appreciate it when researchers take the time to report potential security vulnerabilities to us."
    ],
    "reward_range": "Please review the program contents before submitting your findings.",
    "reward_currency": "USD",
    "payout_notes": "",
    "allowed_techniques": [],
    "prohibited_techniques": [],
    "last_seen_at": "SingTel Optus is one of the largest telecommunications companies in Australia, Optus provides mobile, telephony, internet, satellite, entertainment and business network services each day. Please submit your findings to this Bug Bounty Program",
    "source_snapshot_hash": "4851979b2886f7af86fd99127b127dcad85060d5d93a979cde6c59759c1a46b9"
  },
  "diff": {
    "oldHash": "25c23266f5333710c25151628539700f1194062b7edeac1582986f7751cfd5ab",
    "newHash": "48ab5bd2ffef8eeeab97d94acfadceda6419217bea7cecc52daf5dcbacfd2e1a",
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
