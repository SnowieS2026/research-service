#!/usr/bin/env node
/** Fast scan using CLI tools with correct template paths */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const NUCLEI_TEMPLATES = 'C:\\Users\\bryan\\.nuclei-templates';
const GO_HTTPX = 'C:\\Users\\bryan\\go\\bin\\httpx.exe';
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

async function runNuclei(targets, tags, timeoutMs) {
  const urlsFile = path.join(tmpDir, 'nu-' + Date.now() + '.txt');
  const outFile = path.join(tmpDir, 'nu-out-' + Date.now() + '.txt');
  fs.writeFileSync(urlsFile, targets.join('\n'));
  const tagArgs = tags.flatMap(t => ['-it', t]);
  const args = ['-l', urlsFile, '-t', NUCLEI_TEMPLATES, ...tagArgs, '-rl', '150', '-timeout', '10', '-retries', '0', '-nc', '-j', '-o', outFile];
  const r = await run('nuclei', args, timeoutMs);
  const findings = [];
  if (fs.existsSync(outFile) && !r.killed) {
    const c = fs.readFileSync(outFile, 'utf8');
    for (const l of c.split('\n').filter(Boolean)) {
      try { findings.push(JSON.parse(l)); } catch {}
    }
    try { fs.unlinkSync(outFile); } catch {}
  }
  if (!r.killed) try { fs.unlinkSync(urlsFile); } catch {}
  return findings;
}

async function runHttpx(targets, timeoutMs) {
  const urlsFile = path.join(tmpDir, 'hx-' + Date.now() + '.txt');
  const outFile = path.join(tmpDir, 'hx-out-' + Date.now() + '.txt');
  fs.writeFileSync(urlsFile, targets.join('\n'));
  const r = await run(GO_HTTPX, ['-l', urlsFile, '-silent', '-status-code', '-content-length', '-o', outFile], timeoutMs);
  const alive = [];
  if (fs.existsSync(outFile)) {
    const c = fs.readFileSync(outFile, 'utf8');
    for (const l of c.split('\n').filter(Boolean)) {
      const parts = l.split(' ');
      if (parts[1] && parseInt(parts[1]) < 500) alive.push({ url: parts[0], status: parseInt(parts[1]) });
    }
    try { fs.unlinkSync(outFile); } catch {}
  }
  try { fs.unlinkSync(urlsFile); } catch {}
  return alive;
}

async function main() {
  const allFindings = [];

  // Subfinder domains to enumerate
  const DOMAINS = [
    { name: 'okta.com', targets: ['https://login.okta.com', 'https://accounts.okta.com', 'https://www.okta.com'] },
    { name: 'webmd.com', targets: ['https://www.webmd.com', 'https://pets.webmd.com', 'https://member.webmd.com', 'https://www.mdedge.com', 'https://accounts.webmd.com'] },
    { name: 'carsdirect.com', targets: ['https://www.carsdirect.com'] }
  ];

  for (const { name, targets } of DOMAINS) {
    process.stdout.write('\n=== SUBDOMAIN ENUM: ' + name + ' ===\n');
    const sfOut = path.join(tmpDir, 'sf-' + name + '.txt');
    const r = await run('subfinder', ['-d', name, '-silent', '-o', sfOut], 60000);
    let subdomains = [];
    if (fs.existsSync(sfOut)) {
      const content = fs.readFileSync(sfOut, 'utf8');
      subdomains = content.split('\n').filter(Boolean);
      fs.unlinkSync(sfOut);
    }
    process.stdout.write('subfinder: ' + subdomains.length + ' subdomains\n');

    if (subdomains.length === 0) continue;

    // Filter to https and take top 30
    const httpsSubs = subdomains.slice(0, 200).filter(s => s && !s.includes('://')).map(s => 'https://' + s);

    // Run httpx to find alive hosts
    process.stdout.write('httpx alive check on ' + httpsSubs.length + ' subs...\n');
    const alive = await runHttpx(httpsSubs, 120000);
    process.stdout.write('httpx: ' + alive.length + ' alive hosts\n');
    for (const h of alive.slice(0, 5)) process.stdout.write('  [' + h.status + '] ' + h.url + '\n');

    if (alive.length === 0) continue;

    // Run nuclei on alive hosts with focused templates
    process.stdout.write('nuclei scan on ' + alive.length + ' hosts...\n');
    const nuFindings = await runNuclei(
      alive.map(h => h.url),
      ['exposed-panels', 'security-headers', 'vulnerabilities/cves'],
      180000
    );
    process.stdout.write('nuclei: ' + nuFindings.length + ' findings\n');
    for (const f of nuFindings.slice(0, 20)) {
      const sev = f.info?.severity || 'info';
      const host = f.host || '';
      const desc = f.info?.description || '';
      process.stdout.write('  [' + sev + '] ' + host + ' | ' + desc.substring(0, 80) + '\n');
      allFindings.push({ tool: 'nuclei', ...f });
    }
  }

  // Save
  const outFile = 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/scan-findings.json';
  fs.writeFileSync(outFile, JSON.stringify(allFindings, null, 2));

  const summary = {};
  for (const f of allFindings) {
    const sev = f.info?.severity || f.severity || 'unknown';
    summary[sev] = (summary[sev] || 0) + 1;
  }
  process.stdout.write('\n=== TOTAL: ' + allFindings.length + ' findings ===\n');
  process.stdout.write(JSON.stringify(summary) + '\n');
  process.stdout.write('Saved: ' + outFile + '\n');
  process.exit(0);
}

main().catch(e => { process.stderr.write(e.message + '\n'); process.exit(1); });
