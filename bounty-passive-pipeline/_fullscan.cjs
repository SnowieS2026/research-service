#!/usr/bin/env node
/**
 * Robust end-to-end OSINT scan for bug bounty targets.
 * Uses execFile (not spawn+shell) for reliable Windows operation.
 * Runs: subfinder → httpx (Go) → nuclei (via PowerShell), reports findings.
 *
 * Key Windows fixes:
 * - execFile (shell:false) for subfinder/httpx
 * - PowerShell redirect for nuclei (avoids stdout capture hang)
 * - Correct nuclei v3.7 flags (-jsonl not -json-export)
 * - httpx uses full path to Go binary (avoids Python httpx conflict)
 */
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileP = promisify(execFile);
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const HTTPX = 'C:\\Users\\bryan\\go\\bin\\httpx.exe';
const SUBFINDER = 'subfinder';
const NUCLEI = 'nuclei';
const TEMPLATES_BASE = path.join(os.homedir(), '.nuclei-templates');
const TMP = os.tmpdir();
const OUT_DIR = 'C:\\Users\\bryan\\.openclaw\\workspace\\bounty-passive-pipeline\\reports';

function rand(ext) {
  return path.join(TMP, `scan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`);
}
const log = (...a) => process.stdout.write('[>] ' + a.join(' ') + '\n');
const err = (...a) => process.stderr.write('[!] ' + a.join(' ') + '\n');

/** Run a command with execFile (shell:false equivalent), return {code, stdout, stderr}. */
async function runCmd(cmd, args, timeoutMs) {
  try {
    const { code, stdout, stderr } = await execFileP(cmd, args, {
      timeout: timeoutMs,
      windowsHide: true,
      shell: true,
      maxBuffer: 10 * 1024 * 1024
    });
    return { code, stdout: stdout || '', stderr: stderr || '', timedOut: false };
  } catch(e) {
    if (e.killed || e.code === 'ETIMEDOUT') {
      return { code: -1, stdout: e.stdout || '', stderr: e.stderr || '', timedOut: true };
    }
    return { code: e.code || -1, stdout: e.stdout || '', stderr: e.stderr || '', timedOut: false };
  }
}

/** Run nuclei as a subprocess (no shell) — stdout flows to console, JSONL goes to file. */
async function runNucleiPs(targets, timeoutMs) {
  if (!targets.length) return { findings: [], stderr: '' };

  const targetFile = rand('txt');
  const outFile = rand('jsonl');
  const stderrFile = rand('err');
  fs.writeFileSync(targetFile, targets.join('\n'), 'utf8');

  const tplDirs = [
    'http/vulnerabilities/',
    'http/exposed-panels/',
    'http/exposures/',
    'http/misconfiguration/'
  ];

  const tplArgs = [];
  for (const tpl of tplDirs) {
    const fullTpl = path.join(TEMPLATES_BASE, tpl);
    if (fs.existsSync(fullTpl)) {
      tplArgs.push('-t', fullTpl);
    }
  }

  const nucleiArgs = [
    '-l', targetFile,
    '-rl', '20', '-timeout', '8', '-retries', '0', '-nc',
    '-jsonl', '-o', outFile,
    ...tplArgs
  ];

  return new Promise((resolve) => {
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try { spawn('taskkill', ['/f', '/pid', String(process.pid)], { shell: true }); } catch {}
    }, timeoutMs);

    // Use spawn (no shell) — stdin ignore, stdout unbuffered to console, stderr to file
    const p = spawn(NUCLEI, nucleiArgs, {
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'inherit', 'pipe']  // inherit = stdout to console
    });

    let stderrData = '';
    p.stderr.on('data', d => { if (stderrData.length < 50000) stderrData += d.toString(); });
    p.on('close', (code) => {
      clearTimeout(timer);
      try { fs.unlinkSync(targetFile); } catch {}

      let stderrText = '';
      try { stderrText = fs.readFileSync(stderrFile, 'utf8').substring(0, 500); } catch {}
      try { fs.unlinkSync(stderrFile); } catch {}

      if (!fs.existsSync(outFile)) {
        try { fs.unlinkSync(outFile); } catch {}
        resolve({ findings: [], stderr: stderrText, code: code || 0, timedOut });
        return;
      }

      let findings = [];
      try {
        const content = fs.readFileSync(outFile, 'utf8');
        for (const line of content.split('\n').filter(l => l.trim())) {
          try { findings.push(JSON.parse(line)); } catch {}
        }
      } catch {}

      try { fs.unlinkSync(outFile); } catch {}
      resolve({ findings, stderr: stderrText, code: code || 0, timedOut });
    });

    p.on('error', () => {
      clearTimeout(timer);
      try { fs.unlinkSync(targetFile); } catch {}
      resolve({ findings: [], stderr: 'process error', code: -1, timedOut: false });
    });
  });
}

/** Run a PowerShell command, return {stdout, code}. */
function runPs(cmdStr, timeoutMs) {
  return new Promise((resolve) => {
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try { spawn('taskkill', ['/f', '/pid', String(process.pid)], { shell: true }); } catch {}
    }, timeoutMs);
    const p = spawn('powershell', ['-Command', cmdStr], { shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    p.stdout.on('data', d => { if (stdout.length < 10_000_000) stdout += d; });
    p.stderr.on('data', d => { if (stderr.length < 100_000) stderr += d; });
    p.on('close', (code) => { clearTimeout(timer); resolve({ stdout, stderr, code: code || 0, timedOut }); });
    p.on('error', () => { clearTimeout(timer); resolve({ stdout: '', stderr: 'error', code: -1, timedOut: false }); });
  });
}

/** Probe subdomains with httpx (Go binary) via PowerShell. */
async function probeSubs(subs) {
  if (!subs.length) return [];
  const inFile = rand('txt');
  const outFile = rand('jsonl');
  fs.writeFileSync(inFile, subs.join('\n'), 'utf8');
  try {
    const psCmd = `& '${HTTPX}' -list '${inFile}' -title -status-code -silent -json -o '${outFile}' -timeout 5000; exit 0`;
    const { code } = await runPs(psCmd, 60000);
    if (!fs.existsSync(outFile)) return [];
    const content = fs.readFileSync(outFile, 'utf8');
    if (!content.trim()) return [];
    const alive = [];
    for (const line of content.split('\n').filter(l => l.trim())) {
      try {
        const j = JSON.parse(line);
        if ((j.status_code || 0) === 200) alive.push(j.url || j.input);
      } catch {}
    }
    return alive;
  } catch { return []; }
  finally {
    try { fs.unlinkSync(inFile); } catch {}
    try { fs.unlinkSync(outFile); } catch {}
  }
}

/** Scan a single domain. */
async function scanDomain(domain) {
  log('\n=== ' + domain + ' ===');

  // 1. subfinder
  const sf = await runCmd(SUBFINDER, ['-d', domain, '-silent'], 90000);
  const allSubs = sf.stdout.split('\n').filter(s => s.trim());
  const prodSubs = allSubs.filter(s =>
    !s.match(/dev[-/]|test[-/]|qa[-/]|staging|demo|tmp[-/]|customdomains|trial-|drapp\./)
    && !s.match(/^[\d.]+$/)
  );
  log('subfinder: ' + allSubs.length + ' total, ' + prodSubs.length + ' prod-quality');

  // 2. httpx alive check
  const aliveSubs = await probeSubs(prodSubs.slice(0, 200));
  log('httpx alive: ' + aliveSubs.length + ' / ' + Math.min(prodSubs.length, 200));

  const result = { domain, totalSubs: allSubs.length, prodSubs: prodSubs.length, alive: aliveSubs.length, aliveSample: aliveSubs.slice(0, 5), nucleiFindings: 0, nucleiBySev: {} };

  // 3. nuclei on alive subs
  if (aliveSubs.length > 0) {
    log('Running nuclei on ' + aliveSubs.length + ' alive targets...');
    const { findings, stderr, code } = await runNucleiPs(aliveSubs, 300000);

    if (stderr && stderr.trim()) {
      const clean = stderr.replace(/\x1b\[[0-9;]*m/g, '').replace(/\n/g, ' ').substring(0, 150).trim();
      if (clean) log('  nuclei: ' + clean);
    }

    result.nucleiFindings = findings.length;
    const bySev = {};
    for (const f of findings) {
      const info = f.info || {};
      const sev = (info.severity || f.severity || 'unknown').toString().toLowerCase();
      bySev[sev] = (bySev[sev] || 0) + 1;
      if (!['info', 'unknown', 'low'].includes(sev)) {
        const host = f.host || f.matched_at || '?';
        const name = (info.name || info.description || f.template || '?').toString().substring(0, 80);
        log('  [' + sev.toUpperCase() + '] ' + host + ' -- ' + name);
      }
    }
    result.nucleiBySev = bySev;
    log('nuclei: ' + findings.length + ' findings | exit=' + code + ' -- ' + JSON.stringify(bySev));
  }

  return result;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outFile = path.join(OUT_DIR, `scan-${timestamp}.json`);

  const domains = ['okta.com', 'webmd.com', 'carsdirect.com', 'mdedge.com'];

  const allResults = [];
  for (const domain of domains) {
    try {
      const r = await scanDomain(domain);
      allResults.push(r);
    } catch(e) {
      err('ERROR: ' + domain + ': ' + e.message);
      allResults.push({ domain, error: e.message });
    }
  }

  log('\n========== SUMMARY ==========');
  let totalNuclei = 0;
  for (const r of allResults) {
    totalNuclei += r.nucleiFindings || 0;
    const sevStr = r.nucleiBySev ? JSON.stringify(r.nucleiBySev) : '{}';
    process.stdout.write(r.domain + ': ' + (r.nucleiFindings || 0) + ' nuclei findings | ' + r.alive + ' alive subs | ' + sevStr + '\n');
  }
  log('Total nuclei findings: ' + totalNuclei);

  fs.writeFileSync(outFile, JSON.stringify({ timestamp: new Date().toISOString(), results: allResults }, null, 2));
  log('Results saved: ' + outFile);
  process.exit(0);
}

main().catch(e => { err('FATAL: ' + e.message); process.exit(1); });
