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
  // Get the programs list page
  const body = await fetch('https://bugbounty.standoff365.com/en-US/programs');
  const match = body.match(/__NEXT_DATA__[^>]*>([^<]+)<\/script>/);
  if (!match) { process.stdout.write('No data\n'); process.exit(0); return; }
  const json = JSON.parse(match[1]);

  // Navigate to the pageProps to find program list
  const pageProps = json.props.pageProps;
  const allKeys = Object.keys(pageProps);
  process.stdout.write('pageProps keys: ' + allKeys.join(', ') + '\n');

  // Look for programs array in pageProps
  for (const key of allKeys) {
    const val = pageProps[key];
    if (Array.isArray(val) && val.length > 0) {
      process.stdout.write(key + ' (' + val.length + ' items): ' + JSON.stringify(val[0]).substring(0, 200) + '\n');
    }
  }

  // Check __NEXT_DATA__ for program listings
  const jsonStr = JSON.stringify(json);
  const programMatches = jsonStr.match(/"slug":"[^"]+"/g);
  if (programMatches) {
    process.stdout.write('\nSlugs found: ' + [...new Set(programMatches)].slice(0, 20).join(', ') + '\n');
  }

  process.exit(0);
}

main().catch(e => { process.stderr.write(e.message + '\n'); process.exit(1); });
