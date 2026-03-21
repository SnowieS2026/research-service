#!/usr/bin/env node
/** Direct OSINT scan using full tool paths */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const TMP = os.tmpdir();
const GO_HTTPX = 'C:\\Users\\bryan\\go\\bin\\httpx.exe';
const log = (...a) => process.stdout.write('[scan] ' + a.join(' ') + '\n');

function randFile(ext) { return path.join(TMP, `s${Date.now()}${Math.random().toString(36).slice(2, 4)}.${ext}`); }

async function runCmd(cmd, args, timeout = 60000) {
  return new Promise((resolve, reject) => {
    let timedOut = false;
    const proc = spawn(cmd, args, { windowsHide: true, shell: true });
    let out = '', err = '';
    proc.stdout.on('data', d => out += d);
    proc.stderr.on('data', d => err += d);
    const timer = setTimeout(() => { timedOut = true; try { proc.kill(); } catch {} }, timeout);
    proc.on('close', code => { clearTimeout(timer); if (timedOut) reject(new Error('TIMEOUT')); else resolve({ code, out, err }); });
    proc.on('error', e => { clearTimeout(timer); reject(e); });
  });
}

async function probeTargets(urls) {
  if (!urls.length) return [];
  const f = randFile('txt');
  fs.writeFileSync(f, urls.join('\n'));
  try {
    const r = await runCmd(GO_HTTPX, ['-l', f, '-silent', '-sc', '-title', '-timeout', '5000'], 30000);
    return (r.out || '').split('\n').filter(Boolean);
  } catch { return []; }
  finally { try { fs.unlinkSync(f); } catch {} }
}

async function main() {
  const results = [];

  // okta.com: subfinder -> httpx -> nuclei
  log('=== [1] subfinder: okta.com ===');
  const sfR = await runCmd('subfinder', ['-d', 'okta.com', '-silent'], 90000);
  const allSubs = (sfR.out || '').split('\n').filter(Boolean);
  // Exclude dev/test/qa/customdomains (all customer subdomains, dead)
  const prodSubs = allSubs.filter(s =>
    !s.includes('dev-') && !s.includes('test-') && !s.includes('qa-') &&
    !s.includes('staging') && !s.includes('demo') && !s.includes('tmp-') &&
    !s.includes('customdomains') && !s.includes('trial-')
  );
  log(`Found: ${allSubs.length} total, ${prodSubs.length} prod-quality`);

  log('\n=== [2] httpx: probing top prod subdomains ===');
  const alive = await probeTargets(prodSubs.slice(0, 100));
  log(`Alive: ${alive.length}/${Math.min(prodSubs.length, 100)}`);
  for (const l of alive.slice(0, 8)) log('  ' + l);

  results.push({ domain: 'okta.com', tool: 'subfinder+httpx', total: allSubs.length, prod: prodSubs.length, alive: alive.length, sample: alive.slice(0, 5) });

  // nuclei on alive targets
  if (alive.length > 0) {
    log('\n=== [3] nuclei: scanning alive targets ===');
    const aliveUrls = alive.map(l => { const m = l.match(/https?:\/\/[^\s,[\]]+/); return m ? m[0] : null; }).filter(Boolean);
    const targetFile = randFile('txt');
    fs.writeFileSync(targetFile, aliveUrls.join('\n'));
    const nucleiOut = randFile('txt');
    try {
      const r = await runCmd('nuclei', [
        '-l', targetFile,
        '-t', 'vulnerabilities/', '-t', 'exposed-panels/', '-t', 'exposures/',
        '-tags', 'rce,sql-injection,xss,csrf,ssrf,xxe,security-headers',
        '-rate-limit', '30', '-timeout', '8', '-retries', '0', '-nc',
        '-json', '-o', nucleiOut
      ], 300000);
      if (fs.existsSync(nucleiOut)) {
        const content = fs.readFileSync(nucleiOut, 'utf8');
        const findings = content.split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
        log(`nuclei: ${findings.length} findings from ${aliveUrls.length} targets`);
        const bySev = {};
        for (const f of findings) {
          const sev = f.severity || 'info';
          bySev[sev] = (bySev[sev] || 0) + 1;
          if (sev !== 'info') log(`  [${sev}] ${f.host} -- ${f.info ? f.info.name : f.template || '?'}`);
        }
        log('Severity: ' + JSON.stringify(bySev));
        results.push({ domain: 'okta.com', tool: 'nuclei', scanned: aliveUrls.length, findings: findings.length, bySev });
        fs.unlinkSync(nucleiOut);
      } else {
        log(`nuclei: no output (exit ${r.code})`);
      }
    } finally { try { fs.unlinkSync(targetFile); } catch {} }
  }

  // webmd, carsdirect, mdedge
  for (const domain of ['webmd.com', 'carsdirect.com', 'mdedge.com']) {
    log(`\n=== [${domain}] subfinder + httpx ===`);
    try {
      const r = await runCmd('subfinder', ['-d', domain, '-silent'], 60000);
      const subs = (r.out || '').split('\n').filter(Boolean);
      const alive2 = await probeTargets(subs.slice(0, 50));
      log(`subfinder: ${subs.length}, httpx alive: ${alive2.length}`);
      for (const l of alive2.slice(0, 5)) log('  ' + l);
      results.push({ domain, tool: 'subfinder+httpx', total: subs.length, alive: alive2.length, sample: alive2.slice(0, 3) });
    } catch(e) { log(`ERROR: ${e.message}`); }
  }

  // Save
  const outPath = path.join(TMP, 'bounty-osint.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  log('\nResults: ' + outPath);
  process.exit(0);
}

main().catch(e => { process.stderr.write('FATAL: ' + e.message + '\n'); process.exit(1); });
