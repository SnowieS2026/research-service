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
  const program = json.props.pageProps.program;

  // Check vendor
  process.stdout.write('Vendor: ' + JSON.stringify(program.vendor).substring(0, 500) + '\n');

  // Check specialRules
  process.stdout.write('specialRules: ' + JSON.stringify(program.specialRules).substring(0, 1000) + '\n');

  // Check statistics  
  process.stdout.write('statistics: ' + JSON.stringify(program.statistics).substring(0, 500) + '\n');

  // Try fetching scope via potential API
  const id = program.id;
  const slug = program.slug;
  const vendorId = program.vendorId;

  const apiPaths = [
    `https://bugbounty.standoff365.com/api/program/${id}`,
    `https://bugbounty.standoff365.com/api/programs/${id}/targets`,
    `https://bugbounty.standoff365.com/api/v1/program/${id}/scope`,
    `https://api.standoff365.com/v1/programs/${id}/scope`,
    `https://bugbounty.standoff365.com/api/targets?programId=${id}`,
    `https://bugbounty.standoff365.com/api/information/${id}`,
  ];

  for (const p of apiPaths) {
    try {
      const b = await fetch(p);
      if (!b.startsWith('<!DOCTYPE') && !b.startsWith('<html')) {
        process.stdout.write('HIT [' + p + ']: ' + b.substring(0, 300) + '\n');
      } else {
        process.stdout.write('[404] ' + p + '\n');
      }
    } catch(e) {
      process.stdout.write('[ERR] ' + p + ': ' + e.message + '\n');
    }
  }

  // Check what keys are in pageProps besides 'program'
  process.stdout.write('\npageProps keys: ' + Object.keys(json.props.pageProps).join(', ') + '\n');
  // Try to find any other JSON data embedded
  process.stdout.write('\nFull JSON length: ' + JSON.stringify(json).length + '\n');

  process.exit(0);
}

main().catch(e => { process.stderr.write(e.message + '\n'); process.exit(1); });
