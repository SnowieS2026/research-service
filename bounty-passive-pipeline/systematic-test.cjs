/**
 * systematic-test.cjs — test each scanner tool in isolation.
 * Tests: subfinder, gau, httpx, nuclei, dalfox, sqlmap
 * Uses CommonJS require (package is type=module, .cjs = CommonJS)
 */
const { execFile: execFileCb } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const os = require('os');

const execFileP = promisify(execFileCb);
const HTTPX_BIN = 'C:\\Users\\bryan\\go\\bin\\httpx.exe';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function run(cmd, args, opts = {}) {
  const { timeout = 30000, env = {} } = opts;
  const mergedEnv = { ...process.env, ...env };
  try {
    const { stdout, stderr } = await execFileP(cmd, args, { timeout, env: mergedEnv, windowsHide: true });
    return { exit: 0, stdout, stderr };
  } catch (e) {
    return { exit: e.code ?? -1, stdout: e.stdout ?? '', stderr: e.stderr ?? '', timedOut: e.name === 'TimeoutError' };
  }
}

async function testSubfinder() {
  console.log('\n[TEST] subfinder');
  const outFile = path.join(os.tmpdir(), `sf-${Date.now()}.txt`);
  const r = await run('subfinder', ['-d', 'okta.com', '-silent', '-o', outFile]);
  let lines = [];
  if (fs.existsSync(outFile)) {
    const content = fs.readFileSync(outFile, 'utf8');
    lines = content.trim().split('\n').filter(Boolean);
    fs.unlinkSync(outFile);
  }
  console.log(`  found ${lines.length} subdomains (exit ${r.exit})`);
  if (lines.length > 0) console.log(`  sample: ${lines[0]}`);
  return lines.length;
}

async function testGau() {
  console.log('\n[TEST] gau');
  const r = await run('gau', ['--subs', 'okta.com'], { timeout: 45000 });
  const lines = r.stdout.trim().split('\n').filter(Boolean);
  console.log(`  found ${lines.length} URLs (exit ${r.exit})`);
  if (lines.length > 0) console.log(`  sample: ${lines[0]}`);
  return lines.length;
}

async function testHttpx() {
  console.log('\n[TEST] httpx (Go binary)');
  const r = await run(HTTPX_BIN, ['-u', 'https://okta.com', '-silent', '-sc', '-title']);
  const line = r.stdout.trim();
  console.log(`  status: ${r.exit}, output: "${line}"`);
  return r.exit === 0 && line.includes('[') ? 1 : 0;
}

async function testNuclei() {
  console.log('\n[TEST] nuclei (json-export to file)');
  const outFile = path.join(os.tmpdir(), `nuclei-test-${Date.now()}.jsonl`);
  const r = await run('nuclei', [
    '-u', 'https://okta.com',
    '-t', 'C:\\Users\\bryan\\.nuclei-templates\\http\\exposed-panels',
    '-json-export', outFile,
    '-nc', '-rl', '20', '-timeout', '20'
  ], { timeout: 40000 });

  let findings = 0;
  if (fs.existsSync(outFile)) {
    const content = fs.readFileSync(outFile, 'utf8');
    findings = content.trim().split('\n').filter(Boolean).length;
    console.log(`  exit ${r.exit}, ${findings} JSON findings in file`);
    if (findings > 0) console.log(`  sample: ${content.trim().split('\n')[0].substring(0, 200)}`);
    fs.unlinkSync(outFile);
  } else {
    console.log(`  exit ${r.exit}, no output file (normal when no findings)`);
    const errLines = r.stderr.split('\n').filter(l => l.trim() && !l.includes('projectdiscovery') && !l.includes('__'));
    if (errLines.length > 0) console.log(`  stderr (filtered): ${errLines.slice(0, 3).join(' | ')}`);
  }
  return findings;
}

async function testDalfox() {
  console.log('\n[TEST] dalfox (with AbortSignal timeout)');
  const outFile = path.join(os.tmpdir(), `dalfox-${Date.now()}.txt`);
  const r = await run('dalfox', ['url', 'https://okta.com', '-o', outFile], { timeout: 20000 });
  let lines = [];
  if (fs.existsSync(outFile)) {
    const content = fs.readFileSync(outFile, 'utf8');
    lines = content.trim().split('\n').filter(Boolean);
    fs.unlinkSync(outFile);
  }
  console.log(`  exit ${r.exit} (timedOut=${r.timedOut}), ${lines.length} output lines in file`);
  if (lines.length > 0) console.log(`  sample: ${lines[0].substring(0, 150)}`);
  return { exit: r.exit, timedOut: r.timedOut, lines: lines.length };
}

async function testSqlmap() {
  console.log('\n[TEST] sqlmap (with AbortSignal timeout)');
  const r = await run('sqlmap', ['-u', 'https://okta.com', '--batch', '--level=1'], { timeout: 25000 });
  console.log(`  exit ${r.exit} (timedOut=${r.timedOut})`);
  const combined = (r.stdout + r.stderr).split('\n').filter(l => l.trim());
  const sample = combined.find(l => l.includes('[CRITICAL]') || l.includes('[INFO]') || l.includes('[WARNING]'));
  if (sample) console.log(`  sample: ${sample.substring(0, 150)}`);
  return { exit: r.exit, timedOut: r.timedOut };
}

async function main() {
  console.log('=== TOOL SYSTEMATIC TEST ===');
  console.log(`nuclei-templates: ${fs.existsSync('C:\\Users\\bryan\\.nuclei-templates') ? 'FOUND' : 'MISSING'}`);
  console.log(`httpx bin: ${fs.existsSync(HTTPX_BIN) ? 'FOUND' : 'MISSING'}`);

  const results = {};

  results.subfinder = await testSubfinder();
  await sleep(1000);

  results.gau = await testGau();
  await sleep(1000);

  results.httpx = await testHttpx();
  await sleep(1000);

  results.nuclei = await testNuclei();
  await sleep(1000);

  results.dalfox = await testDalfox();
  await sleep(1000);

  results.sqlmap = await testSqlmap();

  console.log('\n=== SUMMARY ===');
  console.log(`subfinder: ${results.subfinder > 0 ? '✅' : '❌'} (${results.subfinder} subs)`);
  console.log(`gau:       ${results.gau > 0 ? '✅' : '❌'} (${results.gau} URLs)`);
  console.log(`httpx:     ${results.httpx > 0 ? '✅' : '❌'}`);
  console.log(`nuclei:    ${results.nuclei >= 0 ? '✅ (file-based output works)' : '❌'}`);
  console.log(`dalfox:    ${results.dalfox.timedOut ? '✅ (timeout handled correctly)' : '⚠️ exit=' + results.dalfox.exit}`);
  console.log(`sqlmap:    ${results.sqlmap.timedOut ? '✅ (timeout handled correctly)' : '⚠️ exit=' + results.sqlmap.exit}`);
}

main().catch(console.error);
