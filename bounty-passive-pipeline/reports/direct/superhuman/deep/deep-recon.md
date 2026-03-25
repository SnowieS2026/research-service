# Superhuman (Grammarly) Deep Recon — 2026-03-25

## Scope Assets Probed

| Target | Result |
|---|---|
| subscription.ppgr.io | ❌ Connection refused (port 443 filtered) |
| gateway.ppgr.io | ❌ Connection refused (port 443 filtered) |
| capi.ppgr.io | ❌ Connection refused (port 443 filtered) |
| wss://capi.ppgr.io | ❌ Connection refused |
| wss://apigw.dplane.ppgr.io | ❌ Connection refused |
| wss://capi-local.ppgr.io | ❌ Connection refused |
| auth.ppgr.io | 🔒 401 Unauthorized (HTTP Basic) |
| gates.ppgr.io | 🔒 404 Not Found (AWS ELB - alive) |
| treatment.ppgr.io | ⏱️ Timeout (alive, no HTTP response) |
| goldengate.ppgr.io | ⏱️ Timeout (alive, no HTTP response) |
| in.ppgr.io | 🔒 404 Not Found (alive) |
| pp-sh.io | 🔀 302 → id.pp-sh.io/cf/auth |
| id.pp-sh.io | 🔀 302 → Cloudflare auth (auth required) |
| gateway.pp-sh.io | 🔀 302 → superhuman.com (SSO mediator) |
| staging-superhuman.com | 🔀 302 → superhuman.com (SSO mediator) |
| app.grammarly.com | 🔀 301 → grammarly.com/1 |
| id.superhuman.com | 🔀 302 → superhuman.com (SSO mediator) |
| staging.coda.io | ✅ **200 OK — CRITICAL: Full client config leak** |

---

## 🔴 CRITICAL: staging.coda.io Client Config Exposure

The staging.coda.io main page (200 OK) contains a **full inline JavaScript client config** with sensitive internal infrastructure:

### Endpoints Exposed (from config):
- `assistantFileUploadUrl`: `https://gr-preprod-core-assistant-file.s3.amazonaws.com/`
- `authBaseUrl`: `https://auth.ppgr.io`
- `capiEphemeralWsUrl`: `wss://apigw.dplane.ppgr.io/GRAMMARLY_EPHEMERAL_ENVIRONMENT/freews`
- `capiLocalWsUrl`: `wss://capi-local.ppgr.io/freews`
- `capiWsUrl`: `wss://capi.ppgr.io/freews`
- `felogUrl`: `https://f-log-ai-editor.grammarly.io`
- `femetricsUrl`: `https://ai-editor.femetrics.grammarly.io`
- `gatesBaseUrl`: `https://gates.ppgr.io`
- `oneGatewayBaseUrl`: `https://gateway.qagr.io`
- `rootHost`: `ppgr.io`
- `settingsRegistryBaseUrl`: `https://goldengate.ppgr.io`
- `subscriptionBaseUrl`: `https://subscription.ppgr.io`
- `tracesUrl`: `https://traces.grammarly.io/v1/traces`
- `treatmentBaseUrl`: `https://treatment.ppgr.io`
- `uphookHubUrl`: `https://gateway.ppgr.io/uhub`

### Third-Party Keys Exposed:
- **Braze SDK**: `sdkEndpoint: sdk.iad-05.braze.com`, `webSdkKey: 0e1f0912-cdcb-441c-ae5a-5960c235a7fb`
- **Statsig**: `clientSdkKey: client-dubWc4hZRNQwa5oIhfi5JK5a8HHvH2s8NjYhyfFyFx8`
- **Google Auth**: `clientId: 817144272411-jqekficevem2rfmbagas6usph4jnvmhg.apps.googleusercontent.com`
- **Miro**: `clientId: 3074457347940789744`
- **Microsoft Teams**: `clientId: a1556f69-8725-4dc6-aa71-4c9d5599254b`
- **Stripe (Test)**: `pk_test_iT63GWjj2jB147qBJzlvEaOK`
- **Recaptcha**: `6LcDCtgUAAAAAJVtZTlIe34DkP6zrpyI5JcXsIwO`
- **Sanity**: `projectId: 2epdaewr`, `dataset: production`
- **Intercom**: `appId: vw02dovh`
- **Trello Import Key**: `3dd429c38754043a9872883a88ba6daf`
- **OneTrust**: `dataDomain: 0bb76475-5cc6-48df-8c13-a810bf2494cd-test`

### Internal Hostnames NOT previously known:
- `gateway.qagr.io` (alternative gateway)
- `goldengate.ppgr.io` (settings registry)
- `in.ppgr.io` (analytics ingestion)
- `capi-local.ppgr.io` (local CAPI WebSocket)
- `apigw.dplane.ppgr.io` (ephemeral environment)
- `account.ppgr.io` (account management)
- `redirect.ppgr.io` (redirect service)
- `master.app.ppgr.io` (doc list)
- `f-log-ai-editor.grammarly.io`
- `ai-editor.femetrics.grammarly.io`
- `traces.grammarly.io`
- `settings.pp-sh.io`
- `codahosted.io`, `codacontent.io` (CDN blobs)

### Also notable from page title/meta:
- `grammarlyEnvironment: "preprod"` — confirms staging is pre-production
- `blobAuthEnabled: false` — S3 uploads may not require auth
- `env: "staging"`

---

## AWS S3 Buckets

| Bucket | Result |
|---|---|
| `coda-us-west-2-staging-blobs.s3.us-west-2.amazonaws.com` | 🔒 AccessDenied |
| `gr-preprod-core-assistant-file.s3.amazonaws.com` | 🔒 AccessDenied |

Both buckets deny access — but `blobAuthEnabled: false` in config suggests unauthenticated uploads may be possible via the upload API rather than direct S3.

---

## CSP from staging.coda.io

CSP reveals additional internal domains:
- `wss://staging.coda.io` (self)
- `https://staging.codahosted.io`
- `https://staging.codacontent.io`
- `https://staging-superhuman.com`
- `https://pp-sh.io`
- `https://coda-migrations.femetrics.grammarly.io`
- `wss://apigw.dplane.ppgr.io`

---

## Authentication Notes

- **HackerOne session cookies** are domain-locked to `.hackerone.com` — cannot be used for Grammarly/Superhuman
- **id.pp-sh.io** uses Cloudflare Access authentication (no direct access)
- **auth.ppgr.io** uses HTTP Basic Auth (no anonymous access)
- **staging-superhuman.com** and **gateway.pp-sh.io** redirect to `superhuman.com/v1/mediator/initiate` — this is the SSO mediator flow between Superhuman and Grammarly

---

## Bug Bounty Context (SSRF Patterns That Worked)

From top HackerOne SSRF reports:
- **Internal port scanning** via SSRF on preview/link APIs (Reddit, $6000)
- **AWS metadata** access via SSRF (Shopify root, Dropbox keys, Vimeo)
- **Blind SSRF** with interaction — probe internal services, detect via DNS/HTTP callbacks
- **Webhook SSRF** — parameter reflecting user-controlled URLs (HackerOne, $2500)
- **GraphQL SSRF** — introspection or query injection ($3000)

---

## Recommended Next Steps

1. **Test SSRF on `gateway.ppgr.io/uhub`** — uphook hub endpoint may reflect URLs
2. **Probe `wss://capi.ppgr.io` via WebSocket** — may accept connections even if HTTP fails
3. **Test IDOR on `subscription.ppgr.io`** — sequential IDs, upgrade/downgrade flows
4. **Test GraphQL on internal endpoints** — `gateway.ppgr.io/graphql`, `goldengate.ppgr.io/graphql`
5. **Test `treatment.ppgr.io` for experimentation SSRF** — treatment assignment endpoints often reflect host headers
6. **Try `gateway.qagr.io`** — different TLD (.qagr.io vs .ppgr.io), may have different access controls
7. **Check if `gr-preprod-core-assistant-file.s3.amazonaws.com` upload is exploitable** — blobAuthEnabled:false suggests unauthenticated uploads
8. **Test header-based SSRF on `f-log-ai-editor.grammarly.io`** — logging endpoints often reflect headers

---

## Files

- Screenshot/HTTP logs: `logs/browser-sessions/hackerone-state.json` (session used)
- Report: `reports/direct/superhuman/deep/deep-recon.md` (this file)
