#!/usr/bin/env node
/** Fast focused scan using CLI tools */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const tmpDir = os.tmpdir();

function run(cmd, args, timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { shell: true, windowsHide: true });
    let out = '', err = '';
    child.stdout && child.stdout.on('data', d => out += d);
    child.stderr && child.stderr.on('data', d => err += d);
    const timer = setTimeout(() => { child.kill(); resolve({ code: null, stdout: out, stderr: err, killed: true }); }, timeoutMs);
    child.on('close', (code) => { clearTimeout(timer); resolve({ code, stdout: out, stderr: err }); });
    child.on('error', (e) => { clearTimeout(timer); resolve({ code: -1, stdout: out, stderr: String(e) }); });
  });
}

async function main() {
  const allFindings = [];

  // 1. Run nuclei on login.okta.com with just a few exposed-panel templates
  process.stdout.write('=== NUCLEI on login.okta.com ===\n');
  const outFile = path.join(tmpDir, 'nuclei-out.txt');
  fs.writeFileSync(outFile, ''); // clear
  const nu = await run('nuclei', [
    '-u', 'https://login.okta.com',
    '-t', 'exposed-panels/okta-admin-panel.yaml',
    '-t', 'exposed-panels/oauth2-panel.yaml',
    '-j', '-o', outFile,
    '-rl', '100', '-timeout', '10', '-retries', '0', '-nc', '-silent'
  ], 30000);
  process.stdout.write('exit: ' + nu.code + ', killed: ' + (nu.killed || false) + '\n');
  if (fs.existsSync(outFile) && !nu.killed) {
    const c = fs.readFileSync(outFile, 'utf8');
    const lines = c.split('\n').filter(Boolean);
    process.stdout.write('nuclei findings: ' + lines.length + '\n');
    for (const l of lines.slice(0, 10)) {
      try {
        const j = JSON.parse(l);
        process.stdout.write('  [' + j.info.severity + '] ' + j.host + ' | ' + (j.info.description || '').substring(0, 80) + '\n');
        allFindings.push(j);
      } catch { if (l.trim()) process.stdout.write('  RAW: ' + l.substring(0, 100) + '\n'); }
    }
    if (!nu.killed) fs.unlinkSync(outFile);
  }

  // 2. Run nuclei on the 10 target URLs with CVE templates (fast)
  process.stdout.write('\n=== NUCLEI CVE scan ===\n');
  const targets = [
    'https://login.okta.com', 'https://accounts.webmd.com',
    'https://member.webmd.com', 'https://www.carsdirect.com',
    'https://www.mdedge.com', 'https://pets.webmd.com'
  ];
  const urlsFile = path.join(tmpDir, 'nu-urls.txt');
  fs.writeFileSync(urlsFile, targets.join('\n'));
  const nuOut = path.join(tmpDir, 'nu-cve-out.txt');
  const nu2 = await run('nuclei', [
    '-l', urlsFile,
    '-t', 'vulnerabilities/cves/2024/',
    '-j', '-o', nuOut,
    '-rl', '100', '-timeout', '15', '-retries', '0', '-nc', '-silent'
  ], 120000);
  process.stdout.write('exit: ' + nu2.code + ', killed: ' + (nu2.killed || false) + '\n');
  if (fs.existsSync(nuOut) && !nu2.killed) {
    const c = fs.readFileSync(nuOut, 'utf8');
    const lines = c.split('\n').filter(Boolean);
    process.stdout.write('CVE findings: ' + lines.length + '\n');
    for (const l of lines.slice(0, 10)) {
      try {
        const j = JSON.parse(l);
        process.stdout.write('  [' + j.info.severity + '] ' + j.host + ' | ' + (j.info.description || '').substring(0, 80) + '\n');
        allFindings.push(j);
      } catch { if (l.trim()) process.stdout.write('  RAW: ' + l.substring(0, 100) + '\n'); }
    }
    fs.unlinkSync(nuOut);
  }
  fs.unlinkSync(urlsFile);

  // 3. Run httpx on discovered subdomains to check what's alive
  process.stdout.write('\n=== HTTPX (top 20 okta subdomains) ===\n');
  const aliveSubs = [
    'login.okta.com', 'www.okta.com', 'acmeinc.okta.com', 'partners.okta.com',
    'portalconnect-com.customdomains.okta.com', 'ins.okta.com',
    'www.credentials.okta.com', 'mypath.okta.com', 'logstream.demo.okta.com',
    'grafana.agents.okta.com', 'api.demo.okta.com', 'www.support.okta.com'
  ];
  const hxFile = path.join(tmpDir, 'hx-urls.txt');
  fs.writeFileSync(hxFile, aliveSubs.map(s => 'https://' + s).join('\n'));
  const hxOut = path.join(tmpDir, 'hx-out.txt');
  const hx = await run('httpx', ['-l', hxFile, '-silent', '-status-code', '-content-length', '-o', hxOut], 60000);
  process.stdout.write('httpx exit: ' + hx.code + '\n');
  if (fs.existsSync(hxOut)) {
    const c = fs.readFileSync(hxOut, 'utf8');
    const lines = c.split('\n').filter(Boolean);
    process.stdout.write('httpx alive: ' + lines.length + '\n');
    for (const l of lines.slice(0, 10)) {
      process.stdout.write('  ' + l.substring(0, 120) + '\n');
    }
    fs.unlinkSync(hxOut);
  }
  fs.unlinkSync(hxFile);

  // Save findings
  const findingsFile = 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/cli-findings.json';
  fs.writeFileSync(findingsFile, JSON.stringify(allFindings, null, 2));
  process.stdout.write('\nTotal findings: ' + allFindings.length + ' -> ' + findingsFile + '\n');
  process.exit(0);
}

main().catch(e => { process.stderr.write(e.message + '\n'); process.exit(1); });
