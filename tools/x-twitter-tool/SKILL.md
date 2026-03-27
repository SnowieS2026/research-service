# X/Twitter API Tool — SKILL.md

## Overview
Post to **@InfinitaraReal** (non-premium, 260 char limit) via X API v2 using OAuth 1.0a user-context authentication.

---

## Credentials — Pending (New App Being Created)

When the new app is set up, provide these and fill them in:

### OAuth 1.0a (user-level, READ+WRITE) — BEST FOR POSTING
- **Consumer Key (API Key)**
- **Consumer Secret (API Secret)**
- **Access Token + Access Token Secret**
  → From: developer.twitter.com → Keys and Tokens → Authentication Tokens

### OAuth 2.0 PKCE (optional alternative)
- **Client ID**
- **Client Secret**

---

## File Locations
- **Post tweet script:** `tools/x-twitter-tool/post-tweet.ts`
- **Test auth script:** `tools/x-twitter-tool/test-auth.ts`
- **Credentials:** Fill in at the top of each script

---

## Key API Facts

### POST /2/tweets — Create Post
- **Endpoint:** `https://api.x.com/2/tweets`
- **Auth:** OAuth 1.0a HMAC-SHA1 signed requests
- **Scopes:** `tweet.write` + `tweet.read` + `users.read`
- **Rate limit:** User-context pool
- **Request body:**
  ```json
  { "text": "Your post content here (max 260 chars for non-premium)" }
  ```
- **Success (201):**
  ```json
  { "data": { "id": "1234567890", "text": "..." } }
  ```

### App-Only (Bearer Token) — Read-Only
- **Endpoint base:** `https://api.x.com/2/`
- **Auth header:** `Authorization: Bearer <BEARER_TOKEN>`
- Can search tweets, get user timelines, access public info
- **CANNOT post** — no user context

### OAuth 1.0a Signing (required for posting)
Each request signed with HMAC-SHA1:
1. Consumer Secret + Access Token Secret as the key
2. Signature base: `POST&<url_encoded_base>&<sorted_params>`
3. Base64 the HMAC output

---

## Usage

### Post a tweet:
```bash
cd C:\Users\bryan\.openclaw\workspace
npx tsx tools/x-twitter-tool/post-tweet.ts "Your message here"
```

### Test authentication:
```bash
npx tsx tools/x-twitter-tool/test-auth.ts
```

---

## Status
- ❌ Awaiting new credentials — new app being created
- Script templates ready — just needs new keys filled in
