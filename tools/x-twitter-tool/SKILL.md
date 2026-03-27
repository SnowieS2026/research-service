# X/Twitter API Tool — SKILL.md

## Overview
Post to **@InfinitaraReal** (non-premium, 260 char limit) via X API v2 using OAuth 1.0a user-context authentication.

---

## Authentication — What You Have

### OAuth 1.0a (user-level, READ+WRITE) ✅ BEST FOR POSTING
- **Consumer Key (API Key):** `EyLjlwhrNOAmSEjX6fYjEJS1K`
- **Consumer Secret (API Secret):** `WCrFZs9PyHBWPUiXZ3xjxezNKiyNNlJfluBJhrj1pRNpFIYkZP`
- **Bearer Token:** ✅ CONFIRMED WORKING — `AAAAAAAAAAAAAAAAFFFFRygEAAAAAa9aASazSspXNn0%2FtnyaQfSufrF0%3Dvn2KSpAhBVZ46YQhTr0rFNvY8XcSeeNK7UnmRjq7tHihmkWpoG`
**Associated Account:** @InfinitaraReal — User ID: `1044578660`
- **Access Token + Secret:** ❌ NOT YET PROVIDED — needed for posting

### OAuth 2.0 PKCE (user-level, READ+WRITE)
- **Client ID:** `ckU4dkU5Y3NlXzc4VnUyVFl2RXU6MTpjaQ`
- **Client Secret:** `waxKcSoRg2bP7gLVH65D-w7RdgcGFc--sMqFRAk1sBFDOvTP9R`
- Requires authorization code flow (user must visit URL, get code, exchange for token)
- Would also need Access Token + Refresh Token

---

## Key API Facts

### POST /2/tweets — Create Post
- **Endpoint:** `https://api.x.com/2/tweets`
- **Auth:** OAuth 1.0a (signed) OR OAuth 2.0 User Token
- **Scopes required:** `tweet.write` + `tweet.read` + `users.read`
- **Rate limit:** User-context pool (separate from app-only)
- **Request body (JSON):**
  ```json
  { "text": "Your post content here (max 260 chars for non-premium)" }
  ```
- **Success response (201):**
  ```json
  { "data": { "id": "1234567890", "text": "..." } }
  ```

### App-Only (Bearer Token) — Read-Only
- **Endpoint base:** `https://api.x.com/2/`
- **Auth header:** `Authorization: Bearer <BEARER_TOKEN>`
- Can search tweets, get user timelines, access public info
- **CANNOT post** — no user context

### OAuth 1.0a Signing (required for posting)
Each request must be signed with HMAC-SHA1 using:
1. Consumer Secret + Access Token Secret as the key
2. A signature base string of: `POST&<url_encoded_base>&<sorted_params>`
3. Then base64 encode the HMAC output

---

## File Locations
- **Script:** `tools/x-twitter-tool/post-tweet.ts`
- **Credentials:** `TOOLS.md` (X Integration section)
- **Test script:** `tools/x-twitter-tool/test-auth.ts`

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

### Requirements to post:
1. **Access Token + Access Token Secret** from developer.twitter.com
   - Found under: Keys and Tokens tab → Authentication Tokens → Access Token and Secret
   - Regenerate if not available
2. The posting script (`post-tweet.ts`) must be updated with these values
3. Then posting works via OAuth 1.0a HMAC-SHA1 signed requests

---

## Status
- ✅ Bearer Token: stored in TOOLS.md
- ✅ Consumer keys: stored in TOOLS.md  
- ❌ Access Token + Secret: NOT YET PROVIDED — needed to post
- ✅ Posting script: built, needs access token + secret to activate
