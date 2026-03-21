#!/usr/bin/env node
/** Direct scan of a public program by platform+slug */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LOGS = path.join(ROOT, 'logs');
const TMP = os.tmpdir();
const GO_HTTPX = 'C:\\Users\\bryan\\go\\bin\\httpx.exe';
const NUCLEI_TEMPLATES = 'C:\\Users\\bryan\\.nuclei-templates';

if (!fs.existsSync(LOGS)) fs.mkdirSync(LOGS, { recursive: true });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function run(cmd, args, timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { shell: true, windowsHide: true });
    let out = '', err = '';
    child.stdout?.on('data', d => out += d);
    child.stderr?.on('data', d => err += d);
    const timer = setTimeout(() => { child.kill(); resolve({ code: null, stdout: out, stderr: err, killed: true }); }, timeoutMs);
    child.on('close', (code) => { clearTimeout(timer); resolve({ code, stdout: out, stderr: err }); });
    child.on('error', (e) => { clearTimeout(timer); resolve({ code: -1, stdout: out, stderr: String(e) }); });
  });
}

function parseHttpxOut(content) {
  const lines = content.split('\n').filter(Boolean);
  return lines.map(l => {
    const clean = l.replace(/\x1b\[[0-9;]*m/g, '');
    const m = clean.match(/^(https?:\/\/[^\s]+)\s+\[(\d+)\]/);
    if (m) return { url: m[1], status: parseInt(m[2]) };
    return null;
  }).filter(Boolean);
}

async function runSubfinder(domain, timeoutMs = 90000) {
  const outFile = path.join(TMP, `sf-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`);
  const r = await run('subfinder', ['-d', domain, '-silent', '-o', outFile], timeoutMs);
  let subdomains = [];
  if (fs.existsSync(outFile)) {
    const content = fs.readFileSync(outFile, 'utf8');
    subdomains = content.split('\n').map(s => s.trim()).filter(s => s && !s.includes('://'));
    try { fs.unlinkSync(outFile); } catch {}
  }
  return { code: r.code, subdomains };
}

async function runHttpx(targets, timeoutMs = 120000) {
  const inFile = path.join(TMP, `hx-in-${Date.now()}.txt`);
  const outFile = path.join(TMP, `hx-out-${Date.now()}.txt`);
  fs.writeFileSync(inFile, targets.join('\n'), 'utf8');
  const r = await run(GO_HTTPX, ['-list', inFile, '-silent', '-status-code', '-o', outFile], timeoutMs);
  let results = [];
  if (fs.existsSync(outFile)) {
    const content = fs.readFileSync(outFile, 'utf8');
    results = parseHttpxOut(content);
    try { fs.unlinkSync(outFile); } catch {}
  }
  try { fs.unlinkSync(inFile); } catch {}
  return { code: r.code, results };
}

async function runNuclei(targets, includeTags, timeoutMs = 300000) {
  const inFile = path.join(TMP, `nu-in-${Date.now()}.txt`);
  const outFile = path.join(TMP, `nu-out-${Date.now()}.txt`);
  fs.writeFileSync(inFile, targets.join('\n'), 'utf8');
  const tagArgs = includeTags.flatMap(t => ['-it', t]);
  const args = ['-l', inFile, '-t', NUCLEI_TEMPLATES, ...tagArgs, '-rl', '150', '-timeout', '10', '-retries', '0', '-nc', '-j', '-o', outFile];
  const r = await run('nuclei', args, timeoutMs);
  const findings = [];
  if (fs.existsSync(outFile) && !r.killed) {
    const content = fs.readFileSync(outFile, 'utf8');
    for (const line of content.split('\n').filter(Boolean)) {
      try {
        const j = JSON.parse(line);
        findings.push({
          host: j.host,
          severity: j.info?.severity || 'info',
          description: j.info?.description || '',
          template: j.template_id || j.template || ''
        });
      } catch {}
    }
    try { fs.unlinkSync(outFile); } catch {}
  }
  try { fs.unlinkSync(inFile); } catch {}
  return { code: r.code, findings, killed: r.killed };
}

// --- Program definitions ---
const PROGRAMS = [
  {
    name: 'K2 Cloud',
    baseDomains: ['k2.cloud'],
    targets: [
      'https://console.k2.cloud',
      'https://www.k2.cloud'
    ]
  },
  {
    name: 'Gov DO (Russian Government)',
    baseDomains: ['do.gosuslugi.ru'],
    targets: [
      'https://www.gosuslugi.ru'
    ]
  }
];

async function main() {
  const start = Date.now();
  const allFindings = [];

  for (const prog of PROGRAMS) {
    console.log(`\n=== ${prog.name} ===`);
    const allSubs = [];

    // Subfinder on base domains
    for (const domain of prog.baseDomains) {
      process.stdout.write(`  [subfinder] ${domain}... `);
      const { subdomains } = await runSubfinder(domain);
      process.stdout.write(`${subdomains.length} subs\n`);
      allSubs.push(...subdomains);
      await sleep(500);
    }

    if (allSubs.length === 0) { console.log('  No subs found'); continue; }

    // Deduplicate and filter
    const uniqueSubs = [...new Set(allSubs)].slice(0, 500);
    const httpsSubs = uniqueSubs.map(s => 'https://' + s);

    // Httpx alive check
    console.log(`  [httpx] checking ${httpsSubs.length} hosts...`);
    const aliveResults = [];
    for (let i = 0; i < httpsSubs.length; i += 100) {
      const batch = httpsSubs.slice(i, i + 100);
      const { results } = await runHttpx(batch, 90000);
      aliveResults.push(...results);
      await sleep(500);
    }
    const alive = aliveResults.filter(r => r.status < 500);
    console.log(`  [httpx] ${alive.length} alive / ${httpsSubs.length} checked`);

    if (alive.length === 0) { console.log('  No alive hosts'); continue; }

    // Log some alive hosts
    for (const h of alive.slice(0, 5)) {
      console.log(`    [${h.status}] ${h.url}`);
    }

    // Nuclei scan
    console.log(`  [nuclei] scanning ${alive.length} hosts...`);
    const { findings, killed } = await runNuclei(
      alive.map(h => h.url),
      ['exposed-panels', 'security-headers', 'vulnerabilities/cves'],
      300000
    );
    console.log(`  [nuclei] ${findings.length} findings${killed ? ' (timeout - partial)' : ''}`);
    for (const f of findings.slice(0, 30)) {
      console.log(`    [${f.severity.toUpperCase()}] ${f.host} | ${f.description.substring(0, 80)}`);
      allFindings.push({ program: prog.name, ...f });
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const outPath = path.join(LOGS, `direct-scan-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ findings: allFindings, elapsedSeconds: elapsed }, null, 2));

  const bySev = {};
  for (const f of allFindings) {
    const s = f.severity || 'unknown';
    bySev[s] = (bySev[s] || 0) + 1;
  }
  console.log(`\n=== DONE in ${elapsed}s ===`);
  console.log(`Total: ${allFindings.length} | ${JSON.stringify(bySev)}`);
  console.log(`Results: ${outPath}`);
  process.exit(0);
}

main().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
