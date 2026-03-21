#!/usr/bin/env node
/** Direct scan using CLI tools on known-working subdomain data */
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileP = promisify(execFile);
const fs = require('fs');
const path = require('path');
const os = require('os');

const SUBS = [
  'ins.okta.com', 'portalconnect-com.customdomains.okta.com', 'adobe.okta.com',
  'partners.okta.com', 'www.credentials.okta.com', 'logstream.demo.okta.com',
  'grafana.agents.okta.com', 'api.demo.okta.com', 'www.support.okta.com',
  'mypath.okta.com', 'dropbox.okta.com', 'learn.workflows.okta.com',
  'login.okta.com', 'acmeinc.okta.com', 'kohls.okta.com', 'remax.okta.com',
  'lyrahealth.okta.com', 'dolby.okta.com', 'genesys.okta.com', 'articulate.okta.com',
  'netjets.okta.com', 'rescare.okta.com', 'technologyone.okta.com',
  'www.okta.com', 'dev-4438042.okta.com', 'dev-991030.okta.com'
];

async function runCmd(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const child = require('child_process').spawn(cmd, args, {
      ...opts,
      shell: true,
      windowsHide: true
    });
    let stdout = '', stderr = '';
    child.stdout && child.stdout.on('data', d => stdout += d);
    child.stderr && child.stderr.on('data', d => stderr += d);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
    child.on('error', (e) => resolve({ code: -1, stdout: '', stderr: String(e) }));
  });
}

async function main() {
  const tmpDir = os.tmpdir();
  const allFindings = [];

  // Write subdomain list to temp file for nuclei
  const urlsFile = path.join(tmpDir, 'nuclei-urls.txt');
  const urls = SUBS.map(s => 'https://' + s);
  fs.writeFileSync(urlsFile, urls.join('\n'), 'utf8');

  process.stdout.write('=== NUCLEI (26 okta subdomains, generic templates) ===\n');

  // Run nuclei with generic templates + jarmi
  const outFile = path.join(tmpDir, 'nuclei-out-' + Date.now() + '.txt');
  const { code, stdout, stderr } = await runCmd('nuclei', [
    '-l', urlsFile,
    '-t', 'vulnerabilities,exposed-panels,security-headers,misc',
    '-json', '-o', outFile,
    '-rl', '100', '-timeout', '15', '-retries', '0', '-nc'
  ], { timeout: 180000 });

  // Also capture stderr (nuclei outputs findings to stdout as JSON)
  process.stdout.write('Exit: ' + code + '\n');
  if (stderr.includes('[')) process.stdout.write('Stderr: ' + stderr.substring(0, 200) + '\n');

  if (fs.existsSync(outFile)) {
    const content = fs.readFileSync(outFile, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    process.stdout.write('Nuclei raw output lines: ' + lines.length + '\n');
    for (const line of lines.slice(0, 20)) {
      try {
        const j = JSON.parse(line);
        process.stdout.write('  [' + j.severity + '] ' + j.host + ' | ' + (j.description || '').substring(0, 80) + '\n');
        allFindings.push(j);
      } catch {
        if (line.trim()) process.stdout.write('  RAW: ' + line.substring(0, 120) + '\n');
      }
    }
    fs.unlinkSync(outFile);
  }

  // Now run subfinder directly on a few domains
  process.stdout.write('\n=== SUBFINDER ===\n');
  for (const domain of ['okta.com', 'webmd.com', 'carsdirect.com']) {
    const sfOut = path.join(tmpDir, 'sf-' + Date.now() + '.txt');
    const { code: sfCode } = await runCmd('subfinder', ['-d', domain, '-silent', '-o', sfOut], { timeout: 60000 });
    if (fs.existsSync(sfOut)) {
      const content = fs.readFileSync(sfOut, 'utf8');
      const subs = content.split('\n').filter(Boolean);
      process.stdout.write(domain + ': ' + subs.length + ' subdomains found\n');
      for (const s of subs.slice(0, 5)) process.stdout.write('  ' + s + '\n');
      if (subs.length > 5) process.stdout.write('  ... (' + (subs.length - 5) + ' more)\n');
      fs.unlinkSync(sfOut);
    } else {
      process.stdout.write(domain + ': no output file (exit ' + sfCode + ')\n');
    }
  }

  // Run gau on okta.com
  process.stdout.write('\n=== GAU ===\n');
  const gauOut = path.join(tmpDir, 'gau-' + Date.now() + '.txt');
  const { code: gauCode } = await runCmd('gau', ['--subs', 'okta.com'], { timeout: 60000 });
  if (fs.existsSync(gauOut)) {
    const content = fs.readFileSync(gauOut, 'utf8');
    const urls = content.split('\n').filter(Boolean);
    process.stdout.write('gau okta.com: ' + urls.length + ' URLs\n');
    for (const u of urls.slice(0, 5)) process.stdout.write('  ' + u + '\n');
    fs.unlinkSync(gauOut);
  } else {
    process.stdout.write('gau: no output file (exit ' + gauCode + ')\n');
  }

  process.stdout.write('\nTotal nuclei findings: ' + allFindings.length + '\n');
  fs.unlinkSync(urlsFile);
  process.exit(0);
}

main().catch(e => { process.stderr.write(e.message + '\n'); process.exit(1); });
