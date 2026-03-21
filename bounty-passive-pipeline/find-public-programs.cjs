#!/usr/bin/env node
/** Find accessible programs via direct reconnaissance + known public VDPs */
const { MetadataBrowser } = require('./dist/src/browser/MetadataBrowser.js');
const { Standoff365Parser } = require('./dist/src/browser/parsers/Standoff365Parser.js');
const { Logger } = require('./dist/src/Logger.js');
const https = require('https');
const log = new Logger('pub-progs');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : require('http');
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d, headers: res.headers }));
    }).on('error', reject).setTimeout(15000, function() { this.destroy(); reject(new Error('timeout')); });
  });
}

async function probeStandoff365(browser, slug) {
  const url = 'https://bugbounty.standoff365.com/en-US/programs/' + slug;
  try {
    const page = await browser.navigate(url, { waitUntil: 'networkidle2', timeout: 20000 });
    const result = await new Standoff365Parser(log).parse(page, url);
    const webTargets = result.scope_assets.filter(a => a.startsWith('http'));
    return { name: result.program_name, url, webTargets, total: result.scope_assets.length };
  } catch(e) { return null; }
}

async function main() {
  const browser = new MetadataBrowser();
  await browser.init();

  const results = [];

  // Standoff365 - all public programs
  const soSlugs = [
    'k2cloud', 'gov-do', 'pt_ai', 'pt_sandbox', 'pt_af', 'pt_ds',
    'renaissance_life', 'mybox', 'jet_ue', 'pt_cs'
  ];

  process.stdout.write('=== STOFFUND365 PROGRAMS ===\n');
  for (const slug of soSlugs) {
    const r = await probeStandoff365(browser, slug);
    if (r) {
      process.stdout.write('[' + r.name + '] ' + r.webTargets.length + ' web targets\n');
      if (r.webTargets.length > 0) results.push(r);
    } else {
      process.stdout.write('[ERR] ' + slug + '\n');
    }
  }

  // CISA known vulns - US government VDP list
  process.stdout.write('\n=== CISA KNOWN VDPs (us-cert.gov) ===\n');
  try {
    const { body } = await httpGet('https://www.cisa.gov/sites/default/files/known_vulnerabilities.json');
    const vulns = JSON.parse(body);
    process.stdout.write('Found ' + vulns.length + ' known vulnerabilities\n');
    // Group by vendor
    const vendors = {};
    for (const v of vulns) {
      const vendor = v.vendor || 'unknown';
      if (!vendors[vendor]) vendors[vendor] = [];
      vendors[vendor].push(v);
    }
    const topVendors = Object.entries(vendors).sort((a, b) => b[1].length - a[1].length).slice(0, 10);
    process.stdout.write('Top vendors: ' + topVendors.map(([v, arr]) => v + '(' + arr.length + ')').join(', ') + '\n');
  } catch(e) { process.stdout.write('CISA ERR: ' + e.message + '\n'); }

  // Try Bugcrowd VDP page directly
  process.stdout.write('\n=== BUGCROWD VDPS ===\n');
  try {
    const { status, body } = await httpGet('https://bugcrowd.com/vulnerability-disclosure-programs');
    process.stdout.write('Bugcrowd VDP page status: ' + status + ', body len: ' + body.length + '\n');
    if (body.length > 1000) {
      const vdpLinks = body.match(/\/engagements\/([a-z0-9_-]+)/gi) || [];
      process.stdout.write('VDP links: ' + [...new Set(vdpLinks)].slice(0, 10).join(', ') + '\n');
    }
  } catch(e) { process.stdout.write('Bugcrowd VDP ERR: ' + e.message + '\n'); }

  // Try navigating to a Bugcrowd VDP directly
  const bcVdps = [
    'us-cert', 'cisa-gov', 'dhs-vdp', 'dod-vdp',
    'internet-brands-public', 'internetbrands-public'
  ];
  for (const vdp of bcVdps) {
    try {
      const url = 'https://bugcrowd.com/engagements/' + vdp;
      const page = await browser.navigate(url, { waitUntil: 'networkidle2', timeout: 15000 });
      await page.waitForTimeout(3000);
      const html = await page.content();
      process.stdout.write('[' + vdp + '] HTML len: ' + html.length + '\n');
    } catch(e) { process.stdout.write('[ERR] ' + vdp + ': ' + e.message.substring(0, 80) + '\n'); }
  }

  await browser.close();

  // Summary
  process.stdout.write('\n=== PROGRAMS WITH WEB TARGETS ===\n');
  for (const r of results) {
    process.stdout.write('[' + r.name + '] ' + r.url + '\n');
    for (const t of r.webTargets.slice(0, 5)) process.stdout.write('  -> ' + t + '\n');
  }

  process.exit(0);
}

main().catch(e => { process.stderr.write('[FATAL] ' + e.message + '\n'); process.exit(1); });
