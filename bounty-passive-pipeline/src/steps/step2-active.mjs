#!/usr/bin/env node
/**
 * Step 2: Active reconnaissance scan
 * Uses CLI tools directly (subfinder, httpx, nuclei) against discovered domains.
 * Works on Windows with correct path handling.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const LOGS = path.join(ROOT, 'logs');
const SNAPSHOTS = path.join(LOGS, 'snapshots');
const TMP = os.tmpdir();

// Tool paths (Windows)
const GO_HTTPX = 'C:\\Users\\bryan\\go\\bin\\httpx.exe';
const NUCLEI_TEMPLATES = 'C:\\Users\\bryan\\.nuclei-templates';

// Ensure logs dir
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
  // Format: "https://host [STATUS]" - ANSI color codes in stderr, plain in stdout-file
  const lines = content.split('\n').filter(Boolean);
  return lines.map(l => {
    // Remove ANSI color codes
    const clean = l.replace(/\x1b\[[0-9;]*m/g, '');
    // Format: "https://host [STATUS]"
    const m = clean.match(/^(https?:\/\/[^\s]+)\s+\[(\d+)\]/);
    if (m) return { url: m[1], status: parseInt(m[2]) };
    // Try: "https://host STATUS"
    const m2 = clean.match(/^(https?:\/\/[^\s]+)\s+(\d{3})/);
    if (m2) return { url: m2[1], status: parseInt(m2[2]) };
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
  return { code: r.code, subdomains, stderr: r.stderr };
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
  const args = [
    '-l', inFile,
    '-t', NUCLEI_TEMPLATES,
    ...tagArgs,
    '-rl', '150',
    '-timeout', '10',
    '-retries', '0',
    '-nc',
    '-j',
    '-o', outFile
  ];

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
          template: j.template_id || j.template || '',
          matched_at: j.matched_at || new Date().toISOString()
        });
      } catch {}
    }
    try { fs.unlinkSync(outFile); } catch {}
  }
  try { fs.unlinkSync(inFile); } catch {}
  return { code: r.code, findings, killed: r.killed };
}

async function main() {
  const allFindings = [];
  const start = Date.now();
  const snapshots = fs.readdirSync(SNAPSHOTS).filter(f => f.endsWith('.json'));

  if (snapshots.length === 0) {
    console.log('No snapshots found. Run discovery first.');
    process.exit(1);
  }

  // Load latest snapshot
  // Load latest snapshot (most recently modified .json with program property)
  const snapFiles = snapshots
    .map(f => ({ f, mtime: fs.statSync(path.join(SNAPSHOTS, f)).mtime }))
    .sort((a, b) => b.mtime - a.mtime);
  const snapFile = snapFiles.find(s => {
    try { return JSON.parse(fs.readFileSync(path.join(SNAPSHOTS, s.f), 'utf8')).program != null; } catch { return false; }
  }) || snapFiles[0];
  if (!snapFile) { console.log('No snapshots found. Run discovery first.'); process.exit(1); }
  const latest = snapFile.f;
  const snap = JSON.parse(fs.readFileSync(path.join(SNAPSHOTS, latest), 'utf8'));
  const programName = snap.program?.name || latest.replace('snapshot-', '').replace('.json', '');

  console.log(`\n=== ACTIVE SCAN: ${programName} ===`);
  console.log(`Targets: ${snap.scope_assets?.length || 0} scope assets`);

  // Get base domains from scope
  const baseDomains = new Set();
  for (const asset of (snap.scope_assets || [])) {
    if (!asset.startsWith('http')) continue;
    try {
      const u = new URL(asset);
      let base = u.hostname.replace(/^www\./, '');
      if (base.startsWith('*.')) base = base.slice(2);
      if (base.includes('.')) baseDomains.add(base);
    } catch {}
  }

  console.log(`Base domains: ${[...baseDomains].join(', ')}`);

  // Step 1: Subfinder on each base domain
  console.log('\n[1] Subdomain enumeration (subfinder)...');
  const allSubs = [];
  for (const domain of baseDomains) {
    process.stdout.write(`  ${domain}... `);
    const { subdomains } = await runSubfinder(domain, 90000);
    process.stdout.write(`${subdomains.length} subs\n`);
    allSubs.push(...subdomains);
    await sleep(500);
  }
  console.log(`  Total: ${allSubs.length} subdomains`);
  fs.writeFileSync(path.join(LOGS, 'subdomains.json'), JSON.stringify([...new Set(allSubs)], null, 2));

  if (allSubs.length === 0) {
    console.log('No subdomains found. Exiting.');
    process.exit(0);
  }

  // Step 2: Httpx to find alive hosts
  console.log('\n[2] Alive host detection (httpx)...');
  const httpsSubs = [...new Set(allSubs)].filter(s => s).slice(0, 500).map(s => 'https://' + s);
  const aliveResults = [];
  // Batch in groups of 100
  for (let i = 0; i < httpsSubs.length; i += 100) {
    const batch = httpsSubs.slice(i, i + 100);
    process.stdout.write(`  Batch ${i / 100 + 1}... `);
    const { results } = await runHttpx(batch, 90000);
    process.stdout.write(`${results.length} alive\n`);
    aliveResults.push(...results);
    await sleep(1000);
  }
  const alive = aliveResults.filter(r => r.status < 500);
  console.log(`  Alive hosts: ${alive.length} / ${httpsSubs.length}`);
  fs.writeFileSync(path.join(LOGS, 'alive-hosts.json'), JSON.stringify(alive, null, 2));

  if (alive.length === 0) {
    console.log('No alive hosts found. Exiting.');
    process.exit(0);
  }

  // Step 3: Nuclei scan on alive hosts
  console.log('\n[3] Nuclei vulnerability scan...');
  process.stdout.write('  Template tags: exposed-panels, security-headers, cves\n');
  const { findings, killed } = await runNuclei(
    alive.map(r => r.url),
    ['exposed-panels', 'security-headers', 'vulnerabilities/cves'],
    300000
  );
  console.log(`  Nuclei: ${findings.length} findings${killed ? ' (TIMEOUT - partial)' : ''}`);
  for (const f of findings.slice(0, 20)) {
    console.log(`  [${f.severity.toUpperCase()}] ${f.host} | ${f.description.substring(0, 80)}`);
    allFindings.push({ tool: 'nuclei', ...f });
  }

  // Step 4: Save results
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const summary = { programName, domains: [...baseDomains], subdomains: allSubs.length, aliveHosts: alive.length, nucleiFindings: findings.length, elapsedSeconds: elapsed, findings: allFindings };
  const outPath = path.join(LOGS, `scan-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(`\n=== DONE in ${elapsed}s ===`);
  console.log(`Subdomains: ${allSubs.length} | Alive: ${alive.length} | Nuclei: ${findings.length}`);
  console.log(`Results: ${outPath}`);
  process.exit(0);
}

main().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
