/**
 * test-auth.ts — Test X API credentials
 * Tests OAuth 1.0a consumer keys validity
 * Posting requires Access Token + Secret from dev.twitter.com
 */

import https from 'https';
import crypto from 'crypto';

// OAuth 1.0a (consumer keys — for signing user-context requests)
const CONSUMER_KEY = 'EyLjlwhrNOAmSEjX6fYjEJS1K';
const CONSUMER_SECRET = 'WCrFZs9PyHBWPUiXZ3xjxezNKiyNNlJfluBJhrj1pRNpFIYkZP';
// OAuth 2.0 PKCE (client credentials — for PKCE auth code flow only)
const CLIENT_ID = 'ckU4dkU5Y3NlXzc4VnUyVFl2RXU6MTpjaQ';
const CLIENT_SECRET = 'waxKcSoRg2bP7gLVH65D-w7RdgcGFc--sMqFRAk1sBFDOvTP9R';

function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28')
    .replace(/\)/g, '%29').replace(/\*/g, '%2A');
}

function getJson(path: string, auth: string) {
  return new Promise<{ ok: boolean; status: number; body: string }>((resolve) => {
    const req = https.request({ hostname: 'api.x.com', path, method: 'GET', headers: { 'Authorization': auth } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ ok: res.statusCode === 200, status: res.statusCode ?? 0, body: d }));
    });
    req.on('error', e => resolve({ ok: false, status: 0, body: e.message }));
    req.end();
  });
}

// Test OAuth 1.0a consumer keys by generating an app-only bearer token
// (this uses consumer keys directly, no access token needed)
async function testOAuth1ConsumerKeys(): Promise<void> {
  console.log('Test 1: OAuth 1.0a Consumer Keys → Bearer Token...');

  // Step 1: Exchange consumer keys for an app-only bearer token
  // This is the OAuth 1.0a app-only flow (NOT the OAuth 2.0 client credentials flow)
  const creds = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  const body = 'grant_type=client_credentials';

  const tokenRes = await new Promise<{ ok: boolean; status: number; body: string }>((resolve) => {
    const req = https.request({
      hostname: 'api.x.com', path: '/oauth2/token', method: 'POST',
      headers: {
        'Authorization': `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ ok: res.statusCode === 200, status: res.statusCode ?? 0, body: d }));
    });
    req.on('error', e => resolve({ ok: false, status: 0, body: e.message }));
    req.write(body);
    req.end();
  });

  if (tokenRes.ok) {
    const parsed = JSON.parse(tokenRes.body);
    console.log(`  ✅ Consumer keys valid — bearer token: ${parsed.access_token?.slice(0, 20)}...`);

    // Step 2: Use bearer to fetch public user profile
    const userRes = await getJson('/2/users/by/username/InfinitaraReal', `Bearer ${parsed.access_token}`);
    if (userRes.ok) {
      const user = JSON.parse(userRes.body);
      console.log(`  ✅ Bearer auth works — @InfinitaraReal id: ${user.data?.id}`);
    } else {
      const userErr = JSON.parse(userRes.body);
      console.log(`  ⚠️  Bearer issued but lookup failed: ${userErr.detail || userErr.title || userRes.body.slice(0, 100)}`);
    }
  } else {
    const err = JSON.parse(tokenRes.body);
    console.log(`  ❌ Consumer keys invalid (${tokenRes.status}): ${err.error_description || tokenRes.body}`);
  }
}

async function main() {
  console.log('=== X API Credential Test ===\n');

  await testOAuth1ConsumerKeys();

  console.log('\n--- Credential Status ---');
  console.log(`OAuth 1.0a Consumer Key:    ${CONSUMER_KEY.slice(0, 8)}...  ✅ stored`);
  console.log(`OAuth 1.0a Consumer Secret: ${CONSUMER_SECRET.slice(0, 8)}... ✅ stored`);
  console.log(`OAuth 2.0 Client ID:       ${CLIENT_ID.slice(0, 8)}...  ✅ stored (PKCE flow only)`);
  console.log(`OAuth 2.0 Client Secret:   ${CLIENT_SECRET.slice(0, 8)}... ✅ stored (PKCE flow only)`);
  console.log('\nPosting requires Access Token + Secret:');
  console.log('  1. developer.twitter.com → your app → Keys and Tokens');
  console.log('  2. Authentication Tokens section → Access Token and Secret → Generate');
  console.log('  3. Share Access Token + Access Token Secret');
}

main().catch(console.error);
