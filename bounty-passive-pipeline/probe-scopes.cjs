#!/usr/bin/env node
const https = require('https');

async function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(data));
    }).on('error', reject).setTimeout(15000, function() { this.destroy(); reject(new Error('timeout')); });
  });
}

async function main() {
  const body = await fetch('https://bugbounty.standoff365.com/en-US/programs/pt_ngfw');
  const match = body.match(/__NEXT_DATA__[^>]*>([^<]+)<\/script>/);
  if (!match) { process.stdout.write('No data\n'); process.exit(0); return; }
  const json = JSON.parse(match[1]);
  const scopes = json.props.pageProps.scopes;
  process.stdout.write('Scopes: ' + JSON.stringify(scopes, null, 2) + '\n');
  process.exit(0);
}

main().catch(e => { process.stderr.write(e.message + '\n'); process.exit(1); });
