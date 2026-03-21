#!/usr/bin/env node
const https = require('https');
async function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve(d));
    }).on('error',reject).setTimeout(20000, function() { this.destroy(); reject(new Error('timeout')); });
  });
}
async function main() {
  const jsUrl = '/_next/static/chunks/pages/programs/%5Bid%5D-aa751eabc552ed40.js';
  const bundle = await fetch('https://bugbounty.standoff365.com' + jsUrl);
  const fetchCalls = bundle.match(/fetch\(["']([^"']+)["']/g) || [];
  process.stdout.write('Fetch calls:\n' + fetchCalls.slice(0, 10).join('\n') + '\n');
  const httpUrls = bundle.match(/https?:\/\/api[^"'\s]{5,100}/g) || [];
  process.stdout.write('\nHTTP URLs:\n' + httpUrls.slice(0, 10).join('\n') + '\n');
  const progPatterns = bundle.match(/["']([/a-zA-Z0-9_-]{3,50}(?:program|scope|target|asset)[a-zA-Z0-9_/-]{0,50})["']/g) || [];
  const unique = [...new Set(progPatterns)];
  process.stdout.write('\nProgram patterns:\n' + unique.slice(0, 10).join('\n') + '\n');
}
main().catch(e => process.stderr.write(e.message + '\n'));
