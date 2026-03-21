#!/usr/bin/env node
/** Direct OSINT scan using CLI tools (bypasses scanner wrappers) */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const TMP = os.tmpdir();
const log = (...a) => process.stdout.write('[scan] ' + a.join(' ') + '\n');

function randFile(ext) {
  return path.join(TMP, `scan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`);
}

async function runCmd(cmd, args, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('TIMEOUT: ' + cmd + ' ' + args.join(' '))), timeout);
    const proc = spawn(cmd, args, { windowsHide: true });
    let out = '', err = '';
    proc.stdout.on('data', d => out += d);
    proc.stderr.on('data', d => err += d);
    proc.on('close', code => { clearTimeout(timer); resolve({ code, out, err }); });
    proc.on('error', e => { clearTimeout(timer); reject(e); });
  });
}

async function main() {
  const TARGETS = [
    { domain: 'okta.com', program: 'HackerOne/Okta' },
    { domain: 'webmd.com', program: 'Bugcrowd/InternetBrands' },
    { domain: 'carsdirect.com', program: 'Bugcrowd/InternetBrands' },
    { domain: 'mdedge.com', program: 'Bugcrowd/InternetBrands' },
  ];

  const results = [];

  for (const { domain, program } of TARGETS) {
    log(`\n=== ${domain} (${program}) ===`);

    // 1. subfinder - get subdomains
    try {
      const r = await runCmd('subfinder', ['-d', domain, '-silent'], 90000);
      const subs = (r.out || '').split('\n').filter(Boolean);
      const important = subs.filter(s =>
        !s.includes('dev-') && !s.includes('test-') && !s.includes('qa-') &&
        !s.includes('staging') && !s.includes('demo') && !s.includes('tmp-')
      );
      log(`subfinder: ${subs.length} total, ${important.length} prod-quality`);
      for (const s of important.slice(0, 5)) log(`  -> ${s}`);
      results.push({ domain, tool: 'subfinder', total: subs.length, prod: important.length, sample: important.slice(0, 5) });

      // 2. httpx probe top subs
      if (important.length > 0) {
        const probeFile = randFile('txt');
        fs.writeFileSync(probeFile, important.slice(0, 30).join('\n'));
        try {
          const r2 = await runCmd('httpx', ['-l', probeFile, '-silent', '-sc', '-title', '-timeout', '5000'], 60000);
          const alive = (r2.out || '').split('\n').filter(l => l.includes('[') && l.includes('200'));
          log(`httpx: ${alive.length}/${Math.min(important.length, 30)} alive (200 OK)`);
          for (const l of alive.slice(0, 3)) log(`  ${l}`);
          results.push({ domain, tool: 'httpx', probed: Math.min(important.length, 30), alive: alive.length, sample: alive.slice(0, 3) });
        } finally { fs.unlinkSync(probeFile); }
      }

      // 3. gau - URL archive
      try {
        const r3 = await runCmd('gau', ['--domain', domain], 60000);
        const urls = (r3.out || '').split('\n').filter(Boolean);
        const interesting = urls.filter(u =>
          (u.includes('?') || u.includes('/api/') || u.includes('json') || u.includes('ajax')) &&
          !u.match(/\.(css|js|png|jpg|gif|svg|ico|woff)/i)
        );
        log(`gau: ${urls.length} total URLs, ${interesting.length} with params/API`);
        for (const u of interesting.slice(0, 3)) log(`  -> ${u.substring(0, 120)}`);
        results.push({ domain, tool: 'gau', total: urls.length, interesting: interesting.length, sample: interesting.slice(0, 3) });
      } catch(e) { log(`gau ERROR: ${e.message}`); }

    } catch(e) { log(`subfinder ERROR ${domain}: ${e.message}`); }
  }

  // 4. nuclei on okta.com subdomains (most valuable target)
  log('\n=== nuclei on okta.com subdomains ===');
  try {
    const r = await runCmd('subfinder', ['-d', 'okta.com', '-silent'], 60000);
    const subs = (r.out || '').split('\n').filter(Boolean).slice(0, 100);
    if (subs.length > 0) {
      const targetFile = randFile('txt');
      fs.writeFileSync(targetFile, subs.join('\n'));
      const nucleiOut = randFile('txt');
      try {
        const r2 = await runCmd('nuclei', [
          '-l', targetFile,
          '-t', 'vulnerabilities/', '-t', 'exposed-panels/',
          '-tags', 'rce,sql-injection,xss,csrf,ssrf,xxe,exposure',
          '-rate-limit', '30',
          '-timeout', '8',
          '-retries', '0',
          '-nc',
          '-json',
          '-o', nucleiOut
        ], 180000);

        if (fs.existsSync(nucleiOut)) {
          const content = fs.readFileSync(nucleiOut, 'utf8');
          const lines = content.split('\n').filter(Boolean);
          const findings = [];
          for (const l of lines) {
            try { findings.push(JSON.parse(l)); } catch {}
          }
          log(`nuclei: ${findings.length} findings from ${subs.length} okta.com targets`);
          const bySev = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, info: 0 };
          for (const f of findings) {
            const sev = (f.severity || 'info').toUpperCase();
            bySev[sev] = (bySev[sev] || 0) + 1;
            if (f.severity !== 'info') {
              log(`  [${f.severity}] ${f.host} -- ${f.info ? f.info.name : f.template}`);
            }
          }
          log(`By severity: CRITICAL=${bySev.CRITICAL} HIGH=${bySev.HIGH} MEDIUM=${bySev.MEDIUM} LOW=${bySev.LOW}`);
          results.push({ domain: 'okta.com', tool: 'nuclei', scanned: subs.length, findings: findings.length, bySev });
        } else {
          log(`nuclei: no output file (exit ${r2.code})`);
        }
      } finally { fs.existsSync(targetFile) && fs.unlinkSync(targetFile); fs.existsSync(nucleiOut) && fs.unlinkSync(nucleiOut); }
    }
  } catch(e) { log(`nuclei ERROR: ${e.message}`); }

  // Summary
  log('\n=== RESULTS SUMMARY ===');
  for (const r of results) {
    const count = r.findings || r.prod || r.alive || r.interesting || r.total || 0;
    process.stdout.write(`[${r.domain}] ${r.tool}: ${count}\n`);
  }

  const outPath = path.join(TMP, 'bounty-direct-scan.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  log('Full results: ' + outPath);
  process.exit(0);
}

main().catch(e => { log('FATAL: ' + e.message); process.exit(1); });
