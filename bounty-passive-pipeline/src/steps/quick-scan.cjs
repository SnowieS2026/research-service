#!/usr/bin/env node
/** Quick targeted scan with inline system() for Windows reliability */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = 'C:\\Users\\bryan\\.openclaw\\workspace\\bounty-passive-pipeline';
const LOGS = path.join(ROOT, 'logs');
const TMP = os.tmpdir();
const GO_HTTPX = 'C:\\Users\\bryan\\go\\bin\\httpx.exe';
const NUCLEI_TEMPLATES = 'C:\\Users\\bryan\\.nuclei-templates';

function sys(cmd, timeoutMs) {
  try {
    const out = execSync(cmd, { timeout: timeoutMs, shell: true, windowsHide: true });
    return { code: 0, stdout: out.toString(), stderr: '' };
  } catch (e) {
    return { code: e.status ?? -1, stdout: e.stdout?.toString() ?? '', stderr: e.stderr?.toString() ?? '', killed: e.killed };
  }
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

  // Known working targets
  const httpsSubs = [
    'https://login.okta.com',
    'https://accounts.okta.com',
    'https://www.okta.com',
    'https://acmeinc.okta.com',
    'https://partners.okta.com',
    'https://www.credentials.okta.com',
    'https://accounts.webmd.com',
    'https://member.webmd.com',
    'https://www.webmd.com',
    'https://pets.webmd.com',
    'https://www.carsdirect.com',
    'https://www.mdedge.com'
  ];

  // Step 1: httpx alive check
  process.stdout.write('[httpx] checking ' + httpsSubs.length + ' hosts...\n');
  const inFile = path.join(TMP, 'httpx-targets-' + Date.now() + '.txt');
  const outFile = path.join(TMP, 'httpx-alive-' + Date.now() + '.txt');
  fs.writeFileSync(inFile, httpsSubs.join('\n'));
  const r = sys('"' + GO_HTTPX + '" -list "' + inFile + '" -silent -status-code -o "' + outFile + '"', 60000);
  process.stdout.write('httpx code: ' + r.code + ', stderr: ' + r.stderr.substring(0, 100) + '\n');
  let alive = [];
  if (fs.existsSync(outFile)) {
    const content = fs.readFileSync(outFile, 'utf8');
    process.stdout.write('httpx output: [' + content.length + '] ' + content.substring(0, 300) + '\n');
    alive = parseHttpxOut(content).filter(x => x.status < 500);
    fs.unlinkSync(outFile);
  } else {
    process.stdout.write('httpx output file NOT FOUND\n');
  }
  fs.unlinkSync(inFile);
  process.stdout.write('[httpx] ' + alive.length + ' alive\n');
  for (const h of alive.slice(0, 5)) process.stdout.write('  [' + h.status + '] ' + h.url + '\n');

  if (alive.length === 0) {
    process.stdout.write('No alive hosts. Exiting.\n');
    process.exit(0);
  }

  // Step 2: nuclei scan
  process.stdout.write('[nuclei] scanning ' + alive.length + ' hosts...\n');
  const nuInFile = path.join(TMP, 'nu-targets-' + Date.now() + '.txt');
  const nuOutFile = path.join(TMP, 'nu-out-' + Date.now() + '.txt');
  fs.writeFileSync(nuInFile, alive.map(h => h.url).join('\n'));
  const nuR = sys('nuclei -l "' + nuInFile + '" -t "' + NUCLEI_TEMPLATES + '" -it exposed-panels -it security-headers -it vulnerabilities/cves -rl 150 -timeout 10 -retries 0 -nc -j -o "' + nuOutFile + '"', 300000);
  process.stdout.write('nuclei code: ' + nuR.code + '\n');
  let findings = [];
  if (fs.existsSync(nuOutFile)) {
    const content = fs.readFileSync(nuOutFile, 'utf8');
    for (const line of content.split('\n').filter(Boolean)) {
      try {
        const j = JSON.parse(line);
        const sev = (j.info?.severity || 'info').toUpperCase();
        findings.push({ host: j.host, severity: sev, description: j.info?.description || '' });
        process.stdout.write('  [' + sev + '] ' + j.host + ' | ' + (j.info?.description || '').substring(0, 80) + '\n');
      } catch {}
    }
    try { fs.unlinkSync(nuOutFile); } catch {}
  }
  try { fs.unlinkSync(nuInFile); } catch {}
  process.stdout.write('[nuclei] ' + findings.length + ' findings\n');

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const outPath = path.join(LOGS, 'targeted-final-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify({ findings, elapsed }, null, 2));
  process.stdout.write('\n=== DONE in ' + elapsed + 's | ' + findings.length + ' findings ===\n');
  process.stdout.write('Results: ' + outPath + '\n');
  process.exit(0);
}

main();
