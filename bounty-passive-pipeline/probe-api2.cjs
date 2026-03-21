#!/usr/bin/env node
const https = require('https');
const http = require('http');

// Try to find the API endpoint by fetching the page and looking for API URLs
async function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function main() {
  const slug = 'pt_ngfw';

  // Try common API patterns
  const patterns = [
    `https://bugbounty.standoff365.com/api/v1/programs/${slug}`,
    `https://bugbounty.standoff365.com/api/programs/${slug}`,
    `https://bugbounty.standoff365.com/api/v1/programs/${slug}/scope`,
    `https://bugbounty.standoff365.com/api/v2/programs/${slug}`,
    `https://bugbounty.standoff365.com/api/program/${slug}`,
  ];

  for (const url of patterns) {
    try {
      const { status, body } = await fetchUrl(url);
      if (status === 200 && (body.includes('"scope"') || body.includes('"targets"') || body.includes('"assets"'))) {
        process.stdout.write('HIT [' + status + ']: ' + url + '\n' + body.substring(0, 1000) + '\n---\n');
      } else {
        process.stdout.write('[' + status + '] ' + url + ' — ' + body.substring(0, 80) + '\n');
      }
    } catch(e) {
      process.stdout.write('[ERR] ' + url + ': ' + e.message + '\n');
    }
  }

  // Also try the page to extract any API base URL from the JS
  const { body } = await fetchUrl('https://bugbounty.standoff365.com/en-US/programs/' + slug);
  const apiMatches = body.match(/["'](https?:\/\/[^"']*api[^"']*)["']/g);
  if (apiMatches) process.stdout.write('\nAPI URLs in page: ' + apiMatches.slice(0, 10).join(', ') + '\n');

  const baseUrlMatches = body.match(/baseURL[:\s]*["'](https?:\/\/[^"']+)["']/);
  if (baseUrlMatches) process.stdout.write('baseURL: ' + baseUrlMatches[1] + '\n');

  process.exit(0);
}

main().catch(e => { process.stderr.write(e.message + '\n'); process.exit(1); });
