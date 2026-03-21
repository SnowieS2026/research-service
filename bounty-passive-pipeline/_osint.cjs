#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const TMP = os.tmpdir();
const HTTPX = 'C:\\Users\\bryan\\go\\bin\\httpx.exe';

function rand(suffix) {
  return path.join(TMP, `bounty-${Date.now()}-${Math.random().toString(36).slice(2,6)}.${suffix}`);
}

function log() {
  process.stdout.write('[>] ' + Array.from(arguments).join(' ') + '\n');
}

function run(cmd, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    let timedOut = false;
    const t = setTimeout(() => { timedOut = true; p.kill(); }, timeoutMs);
    const p = spawn(cmd, args, { shell: true, windowsHide: true });
    let out = '', err = '';
    p.stdout.on('data', d => out += d);
    p.stderr.on('data', d => err += d);
    p.on('close', code => { clearTimeout(t); resolve({ code, out, err, timedOut }); });
    p.on('error', e => { clearTimeout(t); reject(e); });
  });
}

async function main() {
  const results = [];

  // 1. subfinder okta.com
  log('=== Step 1: subfinder okta.com ===');
  const sf = await run('subfinder', ['-d', 'okta.com', '-silent'], 90000);
  const allSubs = sf.out.split('\n').filter(s => s.trim());
  const prodSubs = allSubs.filter(s =>
    !s.includes('dev-') && !s.includes('test-') && !s.includes('qa-') &&
    !s.includes('staging') && !s.includes('demo') && !s.includes('tmp-') &&
    !s.includes('customdomains') && !s.includes('trial-') && !s.includes('drapp.')
  );
  log(`${allSubs.length} total subs, ${prodSubs.length} prod-quality`);

  // 2. httpx probe
  log('\n=== Step 2: httpx probing ===');
  const subFile = rand('txt');
  fs.writeFileSync(subFile, prodSubs.slice(0, 200).join('\n'));
  const hpx = await run(HTTPX, ['-list', subFile, '-silent', '-sc', '-nc', '-timeout', '5000'], 60000);
  fs.unlinkSync(subFile);
  const aliveLines = hpx.out.split('\n').filter(l => l.includes('[200]'));
  log(`${aliveLines.length} alive (200 OK) from top 200 prod subs`);
  for (const l of aliveLines.slice(0, 10)) log('  ' + l);

  // Extract URLs
  const aliveUrls = [];
  for (const l of aliveLines) {
    const m = l.match(/https?:\/\/[^\s\[\]]+/);
    if (m) aliveUrls.push(m[0]);
  }
  log(`Extracted ${aliveUrls.length} URLs`);

  // 3. nuclei on alive
  if (aliveUrls.length > 0) {
    log('\n=== Step 3: nuclei scan ===');
    const targetFile = rand('txt');
    fs.writeFileSync(targetFile, aliveUrls.join('\n'));
    const nucleiOut = rand('txt');

    // Try with default templates
    const r = await run('nuclei', [
      '-l', targetFile,
      '-rate-limit', '30', '-timeout', '8', '-retries', '0', '-nc',
      '-json-export', nucleiOut
    ], 300000);

    log('nuclei exit: ' + r.code + (r.timedOut ? ' (TIMEOUT)' : ''));
    fs.unlinkSync(targetFile);

    if (fs.existsSync(nucleiOut)) {
      const content = fs.readFileSync(nucleiOut, 'utf8');
      const lines = content.split('\n').filter(l => l.trim());
      log('nuclei output: ' + lines.length + ' lines');
      const findings = [];
      for (const line of lines) {
        try { findings.push(JSON.parse(line)); } catch {}
      }
      log('Parsed ' + findings.length + ' JSON findings');

      const bySev = {};
      for (const f of findings) {
        const sev = f.severity || 'unknown';
        bySev[sev] = (bySev[sev] || 0) + 1;
      }
      log('By severity: ' + JSON.stringify(bySev));

      // Show non-info
      for (const f of findings.filter(f => f.severity !== 'info')) {
        log('  [' + f.severity + '] ' + (f.host || f.matched_at) + ' -- ' + (f.info ? f.info.name : f.template || '?'));
      }

      results.push({ domain: 'okta.com', tool: 'nuclei', alive: aliveUrls.length, findings: findings.length, bySev });
      fs.unlinkSync(nucleiOut);
    } else {
      log('No nuclei output file (exit code ' + r.code + ' = no matches, normal)');
    }
  }

  // 4. Also probe webmd and carsdirect
  for (const domain of ['webmd.com', 'carsdirect.com', 'mdedge.com']) {
    log('\n=== [' + domain + '] subfinder ===');
    const sf2 = await run('subfinder', ['-d', domain, '-silent'], 60000);
    const subs2 = sf2.out.split('\n').filter(s => s.trim());
    log(domain + ': ' + subs2.length + ' subdomains');

    if (subs2.length > 0) {
      const subFile2 = rand('txt');
      fs.writeFileSync(subFile2, subs2.join('\n'));
      const hpx2 = await run(HTTPX, ['-list', subFile2, '-silent', '-sc', '-nc', '-timeout', '5000'], 60000);
      fs.unlinkSync(subFile2);
      const alive2 = hpx2.out.split('\n').filter(l => l.includes('[200]'));
      log('httpx alive: ' + alive2.length);
      for (const l of alive2.slice(0, 5)) log('  ' + l);
      results.push({ domain, tool: 'subfinder+httpx', subs: subs2.length, alive: alive2.length, sample: alive2.slice(0, 3) });
    }
  }

  log('\n=== DONE ===');
  process.exit(0);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
