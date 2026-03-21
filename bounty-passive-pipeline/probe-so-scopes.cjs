#!/usr/bin/env node
const https = require('https');

async function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    }).on('error', reject).setTimeout(15000, function() { this.destroy(); reject(new Error('timeout')); });
  });
}

async function main() {
  // Try pt_ai which is 'public' visibility
  const programs = [
    { slug: 'pt_ai', id: null },
    { slug: 'pt_sandbox', id: null },
    { slug: 'gov-do', id: null },
    { slug: 'k2cloud', id: null },
  ];

  // First get IDs from page HTML
  for (const prog of programs) {
    try {
      const { body } = await fetch('https://bugbounty.standoff365.com/en-US/programs/' + prog.slug);
      const match = body.match(/__NEXT_DATA__[^>]*>([^<]+)<\/script>/);
      if (match) {
        const json = JSON.parse(match[1]);
        const id = json.props.pageProps.program.id;
        prog.id = id;
        process.stdout.write(prog.slug + ' -> ID:' + id + '\n');

        // Now fetch scope
        const scopeUrl = 'https://api.standoff365.com/api/bug-bounty/program/scope?program_id=' + id + '&sort=severity';
        const { body: scopeBody } = await fetch(scopeUrl);
        const scopes = JSON.parse(scopeBody);
        process.stdout.write('  Scope entries: ' + scopes.length + '\n');
        for (const s of scopes.slice(0, 5)) {
          process.stdout.write('  [' + s.severity + '] ' + s.appTypeName + ' | ' + s.scope + '\n');
        }
      }
    } catch (e) {
      process.stdout.write(prog.slug + ' ERR: ' + e.message + '\n');
    }
  }
  process.exit(0);
}

main().catch(e => { process.stderr.write(e.message + '\n'); process.exit(1); });
