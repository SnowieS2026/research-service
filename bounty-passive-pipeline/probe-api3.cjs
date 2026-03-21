#!/usr/bin/env node
const https = require('https');

async function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    }).on('error', reject).setTimeout(10000, function() { this.destroy(); reject(new Error('timeout')); });
  });
}

async function main() {
  const slug = 'pt_ngfw';
  const base = 'https://api.standoff365.com';

  // Try different API patterns
  const paths = [
    `/v1/programs/${slug}`,
    `/v1/programs/${slug}/scope`,
    `/v1/targets?program=${slug}`,
    `/v1/bounties/${slug}`,
    `/programs/${slug}`,
    `/api/programs/${slug}`,
    `/v2/programs/${slug}`,
  ];

  for (const p of paths) {
    try {
      const { status, body } = await fetch(base + p);
      const snippet = body.substring(0, 200).replace(/\n/g, ' ');
      process.stdout.write('[' + status + '] ' + base + p + '\n  ' + snippet + '\n');
    } catch(e) {
      process.stdout.write('[ERR] ' + base + p + ': ' + e.message + '\n');
    }
  }

  // Also check what the page JS makes of the program URL
  const { body: pageBody } = await fetch('https://bugbounty.standoff365.com/en-US/programs/' + slug);
  // Look for program ID or slug references in JS
  const idMatches = pageBody.match(/programId[:\s]*["']?([a-zA-Z0-9_-]+)/g);
  if (idMatches) process.stdout.write('\nProgram IDs: ' + idMatches.slice(0, 5).join(', ') + '\n');
  const slugMatches = pageBody.match(/programs\/([a-zA-Z0-9_-]+)/g);
  if (slugMatches) process.stdout.write('Program paths: ' + [...new Set(slugMatches)].slice(0, 5).join(', ') + '\n');

  process.exit(0);
}

main().catch(e => { process.stderr.write(e.message + '\n'); process.exit(1); });
