# Active Scan Report – https://bugcrowd.com/engagements/okta

## Summary

| Metric | Value |
| --- | --- |
| Target | https://bugcrowd.com/engagements/okta |
| Scan ID | scan-19d0c4aa25a |
| Targets | 6 |
| Total Findings | 150 |

### Findings by Type

| Type | Count |
| --- | --- |
| XSS | 0 |
| SQLi | 0 |
| SSRF | 9 |
| IDOR | 0 |
| Auth | 0 |
| Info/Nuclei | 141 |

### Findings

1. **HIGH** [`ssrf`] @ https://pagead2.googlesyndication.com/pagead/gen_204?id=tcfe (id) — SSRF via parameter 'id' – payload targeted internal resource
2. **HIGH** [`ssrf`] @ https://stats.g.doubleclick.net/g/collect?v=2& (v) — SSRF via parameter 'v' – payload targeted internal resource
3. **HIGH** [`ssrf`] @ https://www.google-analytics.com/gtm/js?id= (id) — SSRF via parameter 'id' – payload targeted internal resource
4. **HIGH** [`ssrf`] @ https://www.googletagmanager.com/gtag/js?id= (id) — SSRF via parameter 'id' – payload targeted internal resource
5. **HIGH** [`ssrf`] @ https://www.google-analytics.com/debug/bootstrap?id= (id) — SSRF via parameter 'id' – payload targeted internal resource
6. **HIGH** [`ssrf`] @ https://play.google.com/log?format=json&hasfast=true (format) — SSRF via parameter 'format' – payload targeted internal resource
7. **HIGH** [`ssrf`] @ https://www.googletagmanager.com/gtm.js?id= (id) — SSRF via parameter 'id' – payload targeted internal resource
8. **HIGH** [`ssrf`] @ https://surveys.okta.com/jfe/form/SV_e4L0iW8a3tz8Yol?source= (source) — SSRF via parameter 'source' – payload targeted internal resource
9. **HIGH** [`ssrf`] @ https://www.pendo.io/pendo-free/nps?utm_source=pendo_app&utm_medium=branded-nps&utm_campaign=free-branded-nps (utm_source) — SSRF via parameter 'utm_source' – payload targeted internal resource
10. **HIGH** [`api`] @ https://www.youtube.com/api/v1/users (missing-auth) — Sensitive API endpoint https://www.youtube.com/api/v1/users accessible without authentication
11. **HIGH** [`api`] @ https://www.youtube.com/api/v1/users/ (missing-auth) — Sensitive API endpoint https://www.youtube.com/api/v1/users/ accessible without authentication
12. **HIGH** [`api`] @ https://www.youtube.com/api/v1/admin (missing-auth) — Sensitive API endpoint https://www.youtube.com/api/v1/admin accessible without authentication
13. **HIGH** [`api`] @ https://www.youtube.com/api/users (missing-auth) — Sensitive API endpoint https://www.youtube.com/api/users accessible without authentication
14. **HIGH** [`api`] @ https://www.youtube.com/api/admin (missing-auth) — Sensitive API endpoint https://www.youtube.com/api/admin accessible without authentication
15. **HIGH** [`api`] @ https://www.youtube.com/api/v2/users (missing-auth) — Sensitive API endpoint https://www.youtube.com/api/v2/users accessible without authentication
16. **HIGH** [`api`] @ https://www.youtube.com/api/me (missing-auth) — Sensitive API endpoint https://www.youtube.com/api/me accessible without authentication
17. **HIGH** [`api`] @ https://www.youtube.com/api/config (missing-auth) — Sensitive API endpoint https://www.youtube.com/api/config accessible without authentication
18. **HIGH** [`api`] @ https://www.youtube.com/api/settings (missing-auth) — Sensitive API endpoint https://www.youtube.com/api/settings accessible without authentication
19. **HIGH** [`api`] @ https://m.youtube.com/api/v1/users (missing-auth) — Sensitive API endpoint https://m.youtube.com/api/v1/users accessible without authentication
20. **HIGH** [`api`] @ https://m.youtube.com/api/v1/users/ (missing-auth) — Sensitive API endpoint https://m.youtube.com/api/v1/users/ accessible without authentication
21. **HIGH** [`api`] @ https://m.youtube.com/api/v1/admin (missing-auth) — Sensitive API endpoint https://m.youtube.com/api/v1/admin accessible without authentication
22. **HIGH** [`api`] @ https://m.youtube.com/api/users (missing-auth) — Sensitive API endpoint https://m.youtube.com/api/users accessible without authentication
23. **HIGH** [`api`] @ https://m.youtube.com/api/admin (missing-auth) — Sensitive API endpoint https://m.youtube.com/api/admin accessible without authentication
24. **HIGH** [`api`] @ https://m.youtube.com/api/v2/users (missing-auth) — Sensitive API endpoint https://m.youtube.com/api/v2/users accessible without authentication
25. **HIGH** [`api`] @ https://m.youtube.com/api/me (missing-auth) — Sensitive API endpoint https://m.youtube.com/api/me accessible without authentication
26. **HIGH** [`api`] @ https://m.youtube.com/api/config (missing-auth) — Sensitive API endpoint https://m.youtube.com/api/config accessible without authentication
27. **HIGH** [`api`] @ https://m.youtube.com/api/settings (missing-auth) — Sensitive API endpoint https://m.youtube.com/api/settings accessible without authentication
28. **HIGH** [`api`] @ https://stats.g.doubleclick.net/api/v1/users/ (missing-auth) — Sensitive API endpoint https://stats.g.doubleclick.net/api/v1/users/ accessible without authenticati
29. **HIGH** [`api`] @ https://www.google-analytics.com/api/v1/users/ (missing-auth) — Sensitive API endpoint https://www.google-analytics.com/api/v1/users/ accessible without authenticat
30. **HIGH** [`api`] @ https://angular.dev/api/v1/users (missing-auth) — Sensitive API endpoint https://angular.dev/api/v1/users accessible without authentication
31. **HIGH** [`api`] @ https://angular.dev/api/v1/users/ (missing-auth) — Sensitive API endpoint https://angular.dev/api/v1/users/ accessible without authentication
32. **HIGH** [`api`] @ https://angular.dev/api/v1/admin (missing-auth) — Sensitive API endpoint https://angular.dev/api/v1/admin accessible without authentication
33. **HIGH** [`api`] @ https://angular.dev/api/users (missing-auth) — Sensitive API endpoint https://angular.dev/api/users accessible without authentication
34. **HIGH** [`api`] @ https://angular.dev/api/admin (missing-auth) — Sensitive API endpoint https://angular.dev/api/admin accessible without authentication
35. **HIGH** [`api`] @ https://angular.dev/api/v2/users (missing-auth) — Sensitive API endpoint https://angular.dev/api/v2/users accessible without authentication
36. **HIGH** [`api`] @ https://angular.dev/api/me (missing-auth) — Sensitive API endpoint https://angular.dev/api/me accessible without authentication
37. **HIGH** [`api`] @ https://angular.dev/api/config (missing-auth) — Sensitive API endpoint https://angular.dev/api/config accessible without authentication
38. **HIGH** [`api`] @ https://angular.dev/api/settings (missing-auth) — Sensitive API endpoint https://angular.dev/api/settings accessible without authentication
39. **HIGH** [`api`] @ https://angular.io/api/v1/users (missing-auth) — Sensitive API endpoint https://angular.io/api/v1/users accessible without authentication
40. **HIGH** [`api`] @ https://angular.io/api/v1/users/ (missing-auth) — Sensitive API endpoint https://angular.io/api/v1/users/ accessible without authentication
41. **HIGH** [`api`] @ https://angular.io/api/v1/admin (missing-auth) — Sensitive API endpoint https://angular.io/api/v1/admin accessible without authentication
42. **HIGH** [`api`] @ https://angular.io/api/users (missing-auth) — Sensitive API endpoint https://angular.io/api/users accessible without authentication
43. **HIGH** [`api`] @ https://angular.io/api/admin (missing-auth) — Sensitive API endpoint https://angular.io/api/admin accessible without authentication
44. **HIGH** [`api`] @ https://angular.io/api/v2/users (missing-auth) — Sensitive API endpoint https://angular.io/api/v2/users accessible without authentication
45. **HIGH** [`api`] @ https://angular.io/api/me (missing-auth) — Sensitive API endpoint https://angular.io/api/me accessible without authentication
46. **HIGH** [`api`] @ https://angular.io/api/config (missing-auth) — Sensitive API endpoint https://angular.io/api/config accessible without authentication
47. **HIGH** [`api`] @ https://angular.io/api/settings (missing-auth) — Sensitive API endpoint https://angular.io/api/settings accessible without authentication
48. **HIGH** [`api`] @ http://angular.io/api/v1/users (missing-auth) — Sensitive API endpoint http://angular.io/api/v1/users accessible without authentication
49. **HIGH** [`api`] @ http://angular.io/api/v1/users/ (missing-auth) — Sensitive API endpoint http://angular.io/api/v1/users/ accessible without authentication
50. **HIGH** [`api`] @ http://angular.io/api/v1/admin (missing-auth) — Sensitive API endpoint http://angular.io/api/v1/admin accessible without authentication

_Generated at 2026-03-20T17:28:31.072Z_