#!/usr/bin/env node
const { MetadataBrowser } = require('./dist/src/browser/MetadataBrowser.js');
const { Standoff365Parser } = require('./dist/src/browser/parsers/Standoff365Parser.js');
const https = require('https');

async function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    }).on('error', reject).setTimeout(10000, function() { this.destroy(); reject(new Error('timeout')); });
  });
}

(async () => {
  const browser = new MetadataBrowser();
  await browser.init();

  // Standoff365 programs with actual scope
  const soPrograms = [
    'https://bugbounty.standoff365.com/en-US/programs/k2cloud',
    'https://bugbounty.standoff365.com/en-US/programs/gov-do',
    'https://bugbounty.standoff365.com/en-US/programs/pt_ai',
  ];

  // Try to find programs via Standoff365 API directly
  process.stdout.write('=== STOFFUND365 PROGRAMS ===\n');
  for (const url of soPrograms) {
    try {
      const page = await browser.navigate(url, { waitUntil: 'networkidle2', timeout: 20000 });
      const result = await new Standoff365Parser(new (require('./dist/src/Logger.js'))('log')).parse(page, url);
      const webTargets = result.scope_assets.filter(a => a.startsWith('http'));
      process.stdout.write('[' + result.program_name + '] ' + webTargets.length + ' targets\n');
      for (const t of webTargets.slice(0, 3)) process.stdout.write('  -> ' + t + '\n');
    } catch(e) { process.stdout.write('[ERR] ' + url + ': ' + e.message.substring(0, 80) + '\n'); }
  }

  // Probe Intigriti via HTTP to find programs
  process.stdout.write('\n=== INTIGRITI PROGRAMS ===\n');
  const { body: intHtml } = await httpGet('https://www.intigriti.com/programs');
  const intMatches = intHtml.match(/\/programs\/([^\/]+)\/([^\s"'<]+)/g) || [];
  const intSlugs = [...new Set(intMatches)].slice(0, 20);
  process.stdout.write('Found slugs: ' + intSlugs.slice(0, 5).join(', ') + '\n');

  // Try a few Intigriti programs
  const intProbes = [
    'https://www.intigriti.com/programs/uber/uber',
    'https://www.intigriti.com/programs/stripe/stripe',
    'https://www.intigriti.com/programs/port/swagger',
  ];
  for (const url of intProbes) {
    try {
      const page = await browser.navigate(url, { waitUntil: 'networkidle2', timeout: 20000 });
      await page.waitForTimeout(5000);
      const html = await page.content();
      // Look for any URL targets in the HTML
      const urlMatches = html.match(/https?:\/\/[a-zA-Z0-9.-]+\.[a-z]{2,}[^\s"'<>]*/g) || [];
      const unique = [...new Set(urlMatches)].filter(u =>
        !u.includes('intigriti.com') && !u.includes('google.com') &&
        !u.includes('doubleclick') && !u.includes('googleapis') &&
        u.length < 200
      );
      process.stdout.write('[' + url + '] ' + unique.length + ' unique URLs\n');
      for (const u of unique.slice(0, 5)) process.stdout.write('  -> ' + u.substring(0, 100) + '\n');
    } catch(e) { process.stdout.write('[ERR] ' + url + '\n'); }
  }

  await browser.close();

  // Also check HackerOne raw
  process.stdout.write('\n=== HACKERONE ===\n');
  try {
    const { status, body } = await httpGet('https://hackerone.com/directory?filter=program&query=web');
    process.stdout.write('HackerOne status: ' + status + ', body length: ' + body.length + '\n');
  } catch(e) { process.stdout.write('HackerOne ERR: ' + e.message + '\n'); }

  process.exit(0);
})().catch(e => { process.stderr.write(e.message + '\n'); process.exit(1); });
