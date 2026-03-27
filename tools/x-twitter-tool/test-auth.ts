/**
 * test-auth.ts — Test X API credentials
 * Fill in credentials at the top, then run:
 *   npx tsx tools/x-twitter-tool/test-auth.ts
 */

import https from 'https';

// ─── FILL IN YOUR CREDENTIALS ────────────────────────────────────────────────
const CONSUMER_KEY = 'YOUR_CONSUMER_KEY';        // e.g. 'AbC123...'
const CONSUMER_SECRET = 'YOUR_CONSUMER_SECRET';   // e.g. 'XyZ789...'
const CLIENT_ID = 'YOUR_CLIENT_ID';              // OAuth 2.0 PKCE client ID
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';     // OAuth 2.0 PKCE client secret
// ─────────────────────────────────────────────────────────────────────────────

function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28')
    .replace(/\)/g, '%29').replace(/\*/g, '%2A');
}

function getJson(hostname: string, path: string, auth: string) {
  return new Promise<{ ok: boolean; status: number; body: string }>((resolve) => {
    const req = https.request({ hostname, path, method: 'GET', headers: { 'Authorization': auth } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ ok: res.statusCode === 200, status: res.statusCode ?? 0, body: d }));
    });
    req.on('error', e => resolve({ ok: false, status: 0, body: e.message }));
    req.end();
  });
}

async function testOAuth1ToBearer(): Promise<void> {
  console.log('Test 1: OAuth 1.0a Consumer Keys → Bearer Token...');

  if (CONSUMER_KEY === 'YOUR_CONSUMER_KEY') {
    console.log('  ⚠️  Set CONSUMER_KEY and CONSUMER_SECRET at the top of this file');
    return;
  }

  const creds = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  const body = 'grant_type=client_credentials';

  const tokenRes = await new Promise<{ ok: boolean; status: number; body: string }>((resolve) => {
    const req = https.request({
      hostname: 'api.x.com', path: '/oauth2/token', method: 'POST',
      headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }
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
    console.log(`  ✅ Consumer keys valid — bearer: ${parsed.access_token?.slice(0, 20)}...`);

    const userRes = await getJson('api.x.com', '/2/users/by/username/InfinitaraReal', `Bearer ${parsed.access_token}`);
    if (userRes.ok) {
      const user = JSON.parse(userRes.body);
      console.log(`  ✅ Bearer auth works — @InfinitaraReal id: ${user.data?.id}`);
    }
  } else {
    const err = JSON.parse(tokenRes.body);
    console.log(`  ❌ Consumer keys invalid (${tokenRes.status}): ${err.error_description || tokenRes.body}`);
  }
}

async function main() {
  if (CONSUMER_KEY === 'YOUR_CONSUMER_KEY') {
    console.log('⚠️  Credentials not set — edit tools/x-twitter-tool/test-auth.ts and fill in your keys');
    return;
  }
  console.log('=== X API Credential Test ===\n');
  await testOAuth1ToBearer();
  console.log('\nCredential summary stored in TOOLS.md when confirmed.');
}

main().catch(console.error);
