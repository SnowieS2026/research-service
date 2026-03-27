/**
 * post-tweet.ts — Post a tweet to @InfinitaraReal via X API v2 OAuth 1.0a
 * 
 * Prerequisites:
 *   1. Create app at developer.twitter.com
 *   2. Fill in credentials at the top of this file
 *   3. Run: npx tsx tools/x-twitter-tool/post-tweet.ts "Your message"
 */

import https from 'https';
import crypto from 'crypto';

// ─── FILL IN YOUR CREDENTIALS ─────────────────────────────────────────────────
const CONSUMER_KEY = 'YOUR_CONSUMER_KEY';
const CONSUMER_SECRET = 'YOUR_CONSUMER_SECRET';
const ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN';
const ACCESS_TOKEN_SECRET = 'YOUR_ACCESS_TOKEN_SECRET';
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = 'api.x.com';
const POST_PATH = '/2/tweets';

function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28')
    .replace(/\)/g, '%29').replace(/\*/g, '%2A');
}

function buildOAuthHeader(method: string, url: string, postBody: string): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: CONSUMER_KEY,
    oauth_nonce: crypto.randomBytes(32).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: ACCESS_TOKEN,
    oauth_version: '1.0',
  };

  const allParams = { ...oauthParams };
  if (method === 'POST' && postBody) {
    new URLSearchParams(postBody).forEach((val, key) => { allParams[key] = val; });
  }

  const sortedParams = Object.keys(allParams)
    .sort()
    .map(k => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join('&');

  const sigBase = [
    method.toUpperCase(), percentEncode(url), percentEncode(sortedParams)
  ].join('&');

  const signingKey = `${percentEncode(CONSUMER_SECRET)}&${percentEncode(ACCESS_TOKEN_SECRET)}`;
  oauthParams.oauth_signature = crypto.createHmac('sha1', signingKey).update(sigBase).digest('base64');

  return 'OAuth ' + Object.keys(oauthParams)
    .sort()
    .map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(', ');
}

async function postTweet(text: string): Promise<{ success: boolean; tweetId?: string; response?: string }> {
  return new Promise((resolve) => {
    const body = JSON.stringify({ text });
    const url = `https://${API_BASE}${POST_PATH}`;
    const authHeader = buildOAuthHeader('POST', url, body);

    const req = https.request({
      hostname: API_BASE, path: POST_PATH, method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 201) {
          const parsed = JSON.parse(data);
          resolve({ success: true, tweetId: parsed.data?.id, response: data });
        } else {
          resolve({ success: false, response: `HTTP ${res.statusCode}: ${data}` });
        }
      });
    });

    req.on('error', (err) => resolve({ success: false, response: err.message }));
    req.write(body);
    req.end();
  });
}

async function main() {
  const text = process.argv.slice(2).join(' ');

  if (!text) {
    console.error('Usage: npx tsx tools/x-twitter-tool/post-tweet.ts "Your tweet text"');
    process.exit(1);
  }

  if (text.length > 260) {
    console.error(`Error: Tweet is ${text.length} chars (limit 260). Truncate and try again.`);
    process.exit(1);
  }

  if (ACCESS_TOKEN === 'YOUR_ACCESS_TOKEN') {
    console.error('Error: Fill in all credentials at the top of tools/x-twitter-tool/post-tweet.ts');
    process.exit(1);
  }

  console.log(`Posting: "${text}" (${text.length} chars)`);
  const result = await postTweet(text);

  if (result.success) {
    console.log(`✅ Posted! Tweet ID: ${result.tweetId}`);
  } else {
    console.error(`❌ Failed: ${result.response}`);
    process.exit(1);
  }
}

main();
