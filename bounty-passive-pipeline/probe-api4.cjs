#!/usr/bin/env node
const https = require('https');

async function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    }).on('error', reject).setTimeout(15000, function() { this.destroy(); reject(new Error('timeout')); });
  });
}

async function main() {
  // Fetch the program page and extract script/src tags
  const { body } = await fetch('https://bugbounty.standoff365.com/en-US/programs/pt_ngfw');
  const scriptMatches = body.match(/src=["']([^"']+\.js[^"']*)["']/g);
  process.stdout.write('Scripts: ' + (scriptMatches || []).slice(0, 10).join('\n  ') + '\n');

  // Extract any API base from the page
  const apiBases = body.match(/api[Bb]ase[URL]*\s*[:=]\s*["'](https?:\/\/[^"']+)["']/g);
  if (apiBases) process.stdout.write('API bases: ' + apiBases.slice(0, 5).join(', ') + '\n');

  // Find next.js data URL patterns
  const nextData = body.match(/(__NEXT_DATA__|__数据分析__)[^<]*/g);
  if (nextData) process.stdout.write('NEXT_DATA: ' + nextData[0].substring(0, 500) + '\n');

  // Look for standoff365 API in the page
  const soApi = body.match(/standoff365\.com[^"'\s]{0,100}/g);
  if (soApi) process.stdout.write('SO API refs: ' + [...new Set(soApi)].slice(0, 5).join(', ') + '\n');

  // Check the main JS bundle for API paths
  const mainJs = body.match(/src=["']([^"']*main[^"']*\.js[^"']*)["']/);
  if (mainJs) {
    process.stdout.write('\nFetching main bundle: ' + mainJs[1] + '\n');
    try {
      const bundle = await fetch('https://bugbounty.standoff365.com' + mainJs[1]);
      const apiInBundle = bundle.body.match(/["'](https?:\/\/api[^"']{10,150})["']/g);
      if (apiInBundle) {
        const unique = [...new Set(apiInBundle)].slice(0, 20);
        process.stdout.write('API URLs in bundle:\n  ' + unique.join('\n  ') + '\n');
      }
      // Also look for endpoint patterns
      const endpoints = bundle.body.match(/["'/][a-zA-Z0-9_/-]{5,50}\.(php|asp|aspx|do|jsp|cgi)["']/g);
      if (endpoints) process.stdout.write('Endpoints: ' + [...new Set(endpoints)].slice(0, 10).join(', ') + '\n');
    } catch(e) {
      process.stdout.write('Bundle fetch failed: ' + e.message + '\n');
    }
  }

  process.exit(0);
}

main().catch(e => { process.stderr.write(e.message + '\n'); process.exit(1); });
