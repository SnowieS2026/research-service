# Bug Bounty Report – Zendesk Managed Bug Bounty Engagement

## Meta

| Field | Value |
| --- | --- |
| Platform | bugcrowd |
| Program URL | https://bugcrowd.com/engagements/zendesk |
| Report Date | 2026-03-21 |
| Severity | **MEDIUM** |
| CVSS | 6 |
| Reasons | 13 new asset(s) added to scope; Allowed techniques updated; 19 asset(s) removed from scope |

## Summary

13 new assets added to the scope of Zendesk Managed Bug Bounty Engagement on bugcrowd. 19 assets removed from scope. Allowed testing techniques list updated.

## Changes Detected

| Field | Old Value | New Value |
| --- | --- | --- |
| rewards | (new) |  |
| scope_assets | https://forms.gle/XLVbqFQ3opensnt79,https://developer.zendesk.com/documentation/… | https://forms.gle/XLVbqFQ3opensnt79,https://developer.zendesk.com/documentation/… |
| exclusions |  |  |
| reward_range | unknown | unknown |
| payout_notes |  |  |
| allowed_techniques |  |  |
| last_seen_at | 2026-03-21T12:17:22.416Z | 2026-03-21T12:17:22.416Z |
| source_snapshot_hash | d0dfa61d881d | d0dfa61d881d |

## New Scope Assets

- https://forms.gle/XLVbqFQ3opensnt79
- https://developer.zendesk.com/documentation/zendesk-sdks/#ios
- https://developer.zendesk.com/documentation/zendesk-sdks/#android
- https://support.zendesk.com/hc/en-us/articles/4408831648794-Getting-started-with-social-messaging
- https://support.zendesk.com/hc/en-us/articles/4408832757146-Enabling-attachments-in-tickets#topic_nrp_bnx_xdb
- https://support.zendesk.com/hc/en-us/articles/4483794022170-Managing-malicious-attachments#topic_jyj_r25_xsb__ul_h5j_mf5_xsb
- https://apps.apple.com/app/id1174276185
- https://play.google.com/store/apps/details?id=com.zendesk.android&hl=en
- https://www.zendesk.com/marketplace/partners/475/zendesk/
- https://www.zendesk.com/marketplace/apps/support/4895/zendesk-workforce-management/
- https://www.zendesk.com/marketplace/partners/2196/ultimate/
- https://www.zendesk.com/marketplace/apps/chat/181357/klaus/?queryID=9b0ed729ffdbec96657b1bd437baa91d
- https://www.zendesk.com/marketplace/apps/support/181357/klaus/?queryID=9b0ed729ffdbec96657b1bd437baa91d

## Removed Scope Assets

- ~~BugCrowd Vulnerability Rating Taxonomy (https://bugcrowd.com/vulnerability-rating-taxonomy)~~
- ~~here (https://www.zendesk.com/register/)~~
- ~~form (https://forms.gle/XLVbqFQ3opensnt79)~~
- ~~iOS (https://developer.zendesk.com/documentation/zendesk-sdks/#ios)~~
- ~~Android (https://developer.zendesk.com/documentation/zendesk-sdks/#android)~~
- ~~integrations (https://support.zendesk.com/hc/en-us/articles/4408831648794-Getting-started-with-social-messaging)~~
- ~~Enabling private attachments (https://support.zendesk.com/hc/en-us/articles/4408832757146-Enabling-attachments-in-tickets#topic_nrp_bnx_xdb)~~
- ~~About malware scanning (https://support.zendesk.com/hc/en-us/articles/4483794022170-Managing-malicious-attachments#topic_jyj_r25_xsb__ul_h5j_mf5_xsb)~~
- ~~Apple App Store - Zendesk Support App (https://apps.apple.com/app/id1174276185)~~
- ~~Google App Store - Zendesk Support (https://play.google.com/store/apps/details?id=com.zendesk.android&hl=en)~~
- ~~Zendesk owned apps & integrations (https://www.zendesk.com/marketplace/partners/475/zendesk/)~~
- ~~WFM app (https://www.zendesk.com/marketplace/apps/support/4895/zendesk-workforce-management/)~~
- ~~Ultimate app (https://www.zendesk.com/marketplace/partners/2196/ultimate/)~~
- ~~Klaus Chat app (https://www.zendesk.com/marketplace/apps/chat/181357/klaus/?queryID=9b0ed729ffdbec96657b1bd437baa91d)~~
- ~~Klaus Support app (https://www.zendesk.com/marketplace/apps/support/181357/klaus/?queryID=9b0ed729ffdbec96657b1bd437baa91d)~~
- ~~Responsible disclosure policy (https://www.zendesk.com/au/company/policies-and-guidelines/responsible-disclosure-policy/)~~
- ~~Bugcrowd Support Portal (https://bugcrowd-support.freshdesk.com/)~~
- ~~Bugcrowd Support (https://bugcrowd-support.freshdesk.com/support/tickets/new)~~
- ~~standard disclosure terms. (https://www.bugcrowd.com/resource/standard-disclosure-terms/)~~

## Recommendations

**Scope expansion detected** – 13 new asset(s) added. Review the new targets and begin reconnaissance. Priority targets: https://forms.gle/XLVbqFQ3opensnt79, https://developer.zendesk.com/documentation/zendesk-sdks/#ios, https://developer.zendesk.com/documentation/zendesk-sdks/#android

**New allowed techniques** – The program has explicitly listed new acceptable techniques. Incorporate these into your testing workflow.

## Raw Diff

```json
{
  "platform": "bugcrowd",
  "program_name": "Zendesk Managed Bug Bounty Engagement",
  "program_url": "https://bugcrowd.com/engagements/zendesk",
  "scope_assets": [
    "https://forms.gle/XLVbqFQ3opensnt79",
    "https://developer.zendesk.com/documentation/zendesk-sdks/#ios",
    "https://developer.zendesk.com/documentation/zendesk-sdks/#android",
    "https://support.zendesk.com/hc/en-us/articles/4408831648794-Getting-started-with-social-messaging",
    "https://support.zendesk.com/hc/en-us/articles/4408832757146-Enabling-attachments-in-tickets#topic_nrp_bnx_xdb",
    "https://support.zendesk.com/hc/en-us/articles/4483794022170-Managing-malicious-attachments#topic_jyj_r25_xsb__ul_h5j_mf5_xsb",
    "https://apps.apple.com/app/id1174276185",
    "https://play.google.com/store/apps/details?id=com.zendesk.android&hl=en",
    "https://www.zendesk.com/marketplace/partners/475/zendesk/",
    "https://www.zendesk.com/marketplace/apps/support/4895/zendesk-workforce-management/",
    "https://www.zendesk.com/marketplace/partners/2196/ultimate/",
    "https://www.zendesk.com/marketplace/apps/chat/181357/klaus/?queryID=9b0ed729ffdbec96657b1bd437baa91d",
    "https://www.zendesk.com/marketplace/apps/support/181357/klaus/?queryID=9b0ed729ffdbec96657b1bd437baa91d"
  ],
  "exclusions": [],
  "reward_range": "unknown",
  "reward_currency": "USD",
  "payout_notes": "",
  "allowed_techniques": [],
  "prohibited_techniques": [],
  "last_seen_at": "2026-03-21T12:17:22.416Z",
  "source_snapshot_hash": "d0dfa61d881d",
  "rewards": [],
  "prevProgram": {
    "platform": "bugcrowd",
    "program_name": "Zendesk Managed Bug Bounty Engagement",
    "program_url": "https://bugcrowd.com/engagements/zendesk",
    "scope_assets": [
      "BugCrowd Vulnerability Rating Taxonomy (https://bugcrowd.com/vulnerability-rating-taxonomy)",
      "here (https://www.zendesk.com/register/)",
      "form (https://forms.gle/XLVbqFQ3opensnt79)",
      "iOS (https://developer.zendesk.com/documentation/zendesk-sdks/#ios)",
      "Android (https://developer.zendesk.com/documentation/zendesk-sdks/#android)",
      "integrations (https://support.zendesk.com/hc/en-us/articles/4408831648794-Getting-started-with-social-messaging)",
      "Enabling private attachments (https://support.zendesk.com/hc/en-us/articles/4408832757146-Enabling-attachments-in-tickets#topic_nrp_bnx_xdb)",
      "About malware scanning (https://support.zendesk.com/hc/en-us/articles/4483794022170-Managing-malicious-attachments#topic_jyj_r25_xsb__ul_h5j_mf5_xsb)",
      "Apple App Store - Zendesk Support App (https://apps.apple.com/app/id1174276185)",
      "Google App Store - Zendesk Support (https://play.google.com/store/apps/details?id=com.zendesk.android&hl=en)",
      "Zendesk owned apps & integrations (https://www.zendesk.com/marketplace/partners/475/zendesk/)",
      "WFM app (https://www.zendesk.com/marketplace/apps/support/4895/zendesk-workforce-management/)",
      "Ultimate app (https://www.zendesk.com/marketplace/partners/2196/ultimate/)",
      "Klaus Chat app (https://www.zendesk.com/marketplace/apps/chat/181357/klaus/?queryID=9b0ed729ffdbec96657b1bd437baa91d)",
      "Klaus Support app (https://www.zendesk.com/marketplace/apps/support/181357/klaus/?queryID=9b0ed729ffdbec96657b1bd437baa91d)",
      "Responsible disclosure policy (https://www.zendesk.com/au/company/policies-and-guidelines/responsible-disclosure-policy/)",
      "Bugcrowd Support Portal (https://bugcrowd-support.freshdesk.com/)",
      "Bugcrowd Support (https://bugcrowd-support.freshdesk.com/support/tickets/new)",
      "standard disclosure terms. (https://www.bugcrowd.com/resource/standard-disclosure-terms/)"
    ],
    "exclusions": [
      "Out of Scope"
    ],
    "reward_range": "$5000 – $50000",
    "reward_currency": "USD",
    "payout_notes": "Expedited triage: Expedited triage | Safe harbor: Safe harbor",
    "allowed_techniques": [
      "XSS",
      "RCE"
    ],
    "prohibited_techniques": [],
    "last_seen_at": "Dec 11, 2025",
    "source_snapshot_hash": "08b4d8719ff708438e03545a059154138763e37eaef202070e7c2c97cfb7c925"
  },
  "diff": {
    "oldHash": "0446b31da375e2f1f3d883f7a6aec063871990b72241db1e6c82a67a668d0159",
    "newHash": "80a8f750879eb1ae97d30f0305d0fa047f5b01d7f17ea281384f7a611b37c67e",
    "addedFields": [
      "rewards"
    ],
    "removedFields": [],
    "changedFields": [
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
