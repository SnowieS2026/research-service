#!/usr/bin/env node
/** Fast targeted scan of known-accessible domains */
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

async function main() {
  const start = Date.now();
  const allFindings = [];

  const TARGETS = [
    // okta.com - 20 well-known domains
    { name: 'okta', domain: 'okta.com', subs: [
      'login.okta.com', 'www.okta.com', 'accounts.okta.com',
      'acmeinc.okta.com', 'partners.okta.com', 'portalconnect-com.customdomains.okta.com',
      'ins.okta.com', 'www.credentials.okta.com', 'mypath.okta.com',
      'logstream.demo.okta.com', 'grafana.agents.okta.com', 'api.demo.okta.com',
      'www.support.okta.com', 'dev-4438042.okta.com', 'dev-991030.okta.com',
      'dropbox.okta.com', 'learn.workflows.okta.com', 'technologyone.okta.com',
      'lyrahealth.okta.com', 'dolby.okta.com'
    ]},
    // webmd.com - main portals
    { name: 'webmd', domain: 'webmd.com', subs: [
      'www.webmd.com', 'pets.webmd.com', 'member.webmd.com',
      'www.mdedge.com', 'accounts.webmd.com', 'www.carsdirect.com',
      'www06-web.con.ma1.webmd.com', 'connect.dev02.webmd.com', 'psychologytoday.webmd.com'
    ]}
  ];

  for (const target of TARGETS) {
    console.log(`\n=== ${target.name.toUpperCase()} ===`);
    const httpsSubs = target.subs.map(s => 'https://' + s);

    // Step 1: httpx alive check
    console.log(`[httpx] checking ${httpsSubs.length} hosts...`);
    const { results } = await run(GO_HTTPX, ['-list', '-silent', '-status-code', '-o', 'CON'], 30000);
    // Write to temp file instead
    const inFile = path.join(TMP, `hx-${target.name}.txt`);
    fs.writeFileSync(inFile, httpsSubs.join('\n'));
    const outFile = path.join(TMP, `hx-out-${target.name}.txt`);
    const r = await run(GO_HTTPX, ['-list', inFile, '-silent', '-status-code', '-o', outFile], 60000);
    let alive = [];
    if (fs.existsSync(outFile)) {
      const content = fs.readFileSync(outFile, 'utf8');
      alive = parseHttpxOut(content).filter(x => x.status < 500);
      try { fs.unlinkSync(outFile); } catch {}
    }
    try { fs.unlinkSync(inFile); } catch {}
    console.log(`[httpx] ${alive.length} alive`);
    for (const h of alive.slice(0, 5)) console.log(`  [${h.status}] ${h.url}`);

    if (alive.length === 0) continue;

    // Step 2: Nuclei scan on alive hosts
    console.log(`[nuclei] scanning ${alive.length} hosts...`);
    const nuInFile = path.join(TMP, `nu-${target.name}.txt`);
    const nuOutFile = path.join(TMP, `nu-out-${target.name}.txt`);
    fs.writeFileSync(nuInFile, alive.map(h => h.url).join('\n'));
    const tagArgs = ['-it', 'exposed-panels', '-it', 'security-headers', '-it', 'vulnerabilities/cves'];
    const nuR = await run('nuclei', [
      '-l', nuInFile, '-t', NUCLEI_TEMPLATES,
      ...tagArgs,
      '-rl', '150', '-timeout', '10', '-retries', '0', '-nc', '-j', '-o', nuOutFile
    ], 300000);
    let findings = [];
    if (fs.existsSync(nuOutFile) && !nuR.killed) {
      const content = fs.readFileSync(nuOutFile, 'utf8');
      for (const line of content.split('\n').filter(Boolean)) {
        try {
          const j = JSON.parse(line);
          const sev = (j.info?.severity || 'info').toUpperCase();
          findings.push({ host: j.host, severity: sev, description: j.info?.description || '', tool: 'nuclei' });
          console.log(`  [${sev}] ${j.host} | ${(j.info?.description || '').substring(0, 80)}`);
        } catch {}
      }
      try { fs.unlinkSync(nuOutFile); } catch {}
    } else if (nuR.killed) {
      console.log(`  [nuclei] TIMEOUT (partial scan)`);
    }
    try { fs.unlinkSync(nuInFile); } catch {}

    allFindings.push(...findings);
    console.log(`[nuclei] ${findings.length} findings`);
    await sleep(1000);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const outPath = path.join(LOGS, `targeted-scan-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ findings: allFindings, elapsed }, null, 2));

  const bySev = {};
  for (const f of allFindings) bySev[f.severity] = (bySev[f.severity] || 0) + 1;

  console.log(`\n=== DONE in ${elapsed}s | Total: ${allFindings.length} | ${JSON.stringify(bySev)} ===`);
  console.log(`Results: ${outPath}`);
  process.exit(0);
}

main().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
