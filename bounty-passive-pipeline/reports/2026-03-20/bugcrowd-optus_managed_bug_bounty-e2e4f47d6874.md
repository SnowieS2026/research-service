# Bug Bounty Report – Optus Managed Bug Bounty

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/optus-mbb-og |
| Report Date | 2026-03-20 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 33 new asset(s) added to scope; Allowed techniques updated; 6 asset(s) removed from scope; Program notes/triage status updated |

## Summary

33 new assets added to the scope of Optus Managed Bug Bounty on bugcrowd. 6 assets removed from scope. Allowed testing techniques list updated.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| program_name | Optus Managed Bug Bounty | Optus Managed Bug Bounty |
| scope_assets | Bugcrowd Vulnerability Rating Taxonomy (https://bugcrowd.com/vulnerability-ratin… | Bugcrowd Vulnerability Rating Taxonomy (https://bugcrowd.com/vulnerability-ratin… |
| exclusions | Out of Scope | Out of Scope |
| reward_range | $4200 – $5000 | $4200 – $5000 |
| payout_notes | Safe harbor: Safe harbor | Safe harbor: Safe harbor |
| allowed_techniques | RCE | RCE |
| last_seen_at | Jan 17, 2023 | Jan 17, 2023 |
| source_snapshot_hash | 3051df04e1c8e95c0abff8788334bbd55161638e910dc228912739e26d348ea3 | 3051df04e1c8e95c0abff8788334bbd55161638e910dc228912739e26d348ea3 |

## New Scope Assets

- Bugcrowd Vulnerability Rating Taxonomy (https://bugcrowd.com/vulnerability-rating-taxonomy)
- https://webmail.optusnet.com.au/ (https://webmail.optusnet.com.au/)
- Optus iOS App (https://apps.apple.com/au/app/my-optus/id503716230)
- Optus android app (https://play.google.com/store/apps/details?id=au.com.optus.selfservice&hl=en_AU&gl=US)
- FM - EFRAMS (https://www.outsourcing.optus.net.au/eFRAMS3/)
- FM2 – EFRAMS (https://www.outsourcing2.optus.net.au/eFRAMS3/)
- OB PORTAL (https://www.optus.com.au/osp-ecare)
- https://optus.my.site.com/MyHub/s/ (https://optus.my.site.com/MyHub/s/)
- ddosportal.optus.com.au (https://ddosportal.optus.com.au)
- https://ogws.optusnet.com.au/ (https://ogws.optusnet.com.au/)
- https://oes.optusnet.com.au/ (https://oes.optusnet.com.au/)
- samsung-pp.optussport.tv (https://samsung-pp.optussport.tv/)
- chromecast-pp.optussport.tv (https://chromecast-pp.optussport.tv)
- api-cdn.optussport.info/api/ (https://api-cdn.optussport.info/api/*)
- static.sport-pp.optus.com.au/api/ (https://static.sport-pp.optus.com.au/api/*)
- stats-pp.akamai.optussport.tv (https://stats-pp.akamai.optussport.tv)
- stats.optussport.info (https://stats.optussport.info)
- cms-uat.optussport.tv (https://cms-uat.optussport.tv)
- cms-qa.optussport.tv (https://cms-qa.optussport.tv)
- static.cms-uat.optussport.tv (https://static.cms-uat.optussport.tv)
- static.cms-qa.optussport.tv (https://static.cms-qa.optussport.tv)
- sport.optus.com.au (https://sport.optus.com.au/)
- chromecast.optussport.tv (https://samsung.optussport.tv)
- api-cdn.optussport.tv (https://api-cdn.optussport.tv/api/*)
- static.sport.optus.com.au (https://static.sport.optus.com.au/api/*)
- stats.sport.optus.com.au (https://stats.sport.optus.com.au)
- stats.akamai.optussport.tv (https://stats.akamai.optussport.tv)
- cms.optussport.tv (https://cms.optussport.tv)
- static.cms.optussport.tv (https://static.cms.optussport.tv)
- Optus%20-%20AI%20search%20Sample%20Request.pdf (https://bugcrowd.com/engagements/optus-mbb-og/attachments/dbd11454-3149-41cd-8d5a-5c65b87b7026)
- create a ticket with Bugcrowd Support (https://bugcrowd-support.freshdesk.com/support/tickets/new)
- standard disclosure terms. (https://www.bugcrowd.com/resource/standard-disclosure-terms/)
- Public Disclosure Policy (https://docs.bugcrowd.com/researchers/disclosure/disclosure/#f-coordinated-disclosure)

## Removed Scope Assets

- ~~SingTel Optus is one of the largest telecommunications companies in Australia~~
- ~~Optus provides mobile~~
- ~~telephony~~
- ~~internet~~
- ~~satellite~~
- ~~entertainment and business network services each day. Please submit your findings to this Bug Bounty Program~~

## Recommendations

**Scope expansion detected** – 33 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: Bugcrowd Vulnerability Rating Taxonomy (https://bugcrowd.com/vulnerability-rating-taxonomy), https://webmail.optusnet.com.au/ (https://webmail.optusnet.com.au/), Optus iOS App (https://apps.apple.com/au/app/my-optus/id503716230)

**New allowed techniques** – The program has explicitly listed new acceptable techniques. Incorporate these into your testing workflow.

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Optus Managed Bug Bounty",
  "program_url": "https://bugcrowd.com/engagements/optus-mbb-og",
  "scope_assets": [
    "Bugcrowd Vulnerability Rating Taxonomy (https://bugcrowd.com/vulnerability-rating-taxonomy)",
    "https://webmail.optusnet.com.au/ (https://webmail.optusnet.com.au/)",
    "Optus iOS App (https://apps.apple.com/au/app/my-optus/id503716230)",
    "Optus android app (https://play.google.com/store/apps/details?id=au.com.optus.selfservice&hl=en_AU&gl=US)",
    "FM - EFRAMS (https://www.outsourcing.optus.net.au/eFRAMS3/)",
    "FM2 – EFRAMS (https://www.outsourcing2.optus.net.au/eFRAMS3/)",
    "OB PORTAL (https://www.optus.com.au/osp-ecare)",
    "https://optus.my.site.com/MyHub/s/ (https://optus.my.site.com/MyHub/s/)",
    "ddosportal.optus.com.au (https://ddosportal.optus.com.au)",
    "https://ogws.optusnet.com.au/ (https://ogws.optusnet.com.au/)",
    "https://oes.optusnet.com.au/ (https://oes.optusnet.com.au/)",
    "samsung-pp.optussport.tv (https://samsung-pp.optussport.tv/)",
    "chromecast-pp.optussport.tv (https://chromecast-pp.optussport.tv)",
    "api-cdn.optussport.info/api/ (https://api-cdn.optussport.info/api/*)",
    "static.sport-pp.optus.com.au/api/ (https://static.sport-pp.optus.com.au/api/*)",
    "stats-pp.akamai.optussport.tv (https://stats-pp.akamai.optussport.tv)",
    "stats.optussport.info (https://stats.optussport.info)",
    "cms-uat.optussport.tv (https://cms-uat.optussport.tv)",
    "cms-qa.optussport.tv (https://cms-qa.optussport.tv)",
    "static.cms-uat.optussport.tv (https://static.cms-uat.optussport.tv)",
    "static.cms-qa.optussport.tv (https://static.cms-qa.optussport.tv)",
    "sport.optus.com.au (https://sport.optus.com.au/)",
    "chromecast.optussport.tv (https://samsung.optussport.tv)",
    "api-cdn.optussport.tv (https://api-cdn.optussport.tv/api/*)",
    "static.sport.optus.com.au (https://static.sport.optus.com.au/api/*)",
    "stats.sport.optus.com.au (https://stats.sport.optus.com.au)",
    "stats.akamai.optussport.tv (https://stats.akamai.optussport.tv)",
    "cms.optussport.tv (https://cms.optussport.tv)",
    "static.cms.optussport.tv (https://static.cms.optussport.tv)",
    "Optus%20-%20AI%20search%20Sample%20Request.pdf (https://bugcrowd.com/engagements/optus-mbb-og/attachments/dbd11454-3149-41cd-8d5a-5c65b87b7026)",
    "create a ticket with Bugcrowd Support (https://bugcrowd-support.freshdesk.com/support/tickets/new)",
    "standard disclosure terms. (https://www.bugcrowd.com/resource/standard-disclosure-terms/)",
    "Public Disclosure Policy (https://docs.bugcrowd.com/researchers/disclosure/disclosure/#f-coordinated-disclosure)"
  ],
  "exclusions": [
    "Out of Scope"
  ],
  "reward_range": "$4200 – $5000",
  "reward_currency": "USD",
  "payout_notes": "Safe harbor: Safe harbor",
  "allowed_techniques": [
    "RCE"
  ],
  "prohibited_techniques": [],
  "last_seen_at": "Jan 17, 2023",
  "source_snapshot_hash": "3051df04e1c8e95c0abff8788334bbd55161638e910dc228912739e26d348ea3",
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
    "newHash": "e2e4f47d687473f53bb45be9421235d18bb1f0fb5e9320562b4ac2fdc1ca4fbc",
    "addedFields": [],
    "removedFields": [],
    "changedFields": [
      "program_name",
      "scope_assets",
      "exclusions",
      "reward_range",
      "payout_notes",
      "allowed_techniques",
      "last_seen_at",
      "source_snapshot_hash"
    ]
  }
}
```
