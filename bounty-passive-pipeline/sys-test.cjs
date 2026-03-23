/**
 * sys-test.cjs — systematic tool test using PowerShell for process management.
 * Wraps all tool calls through PowerShell to avoid Node spawn hangs on Windows.
 */
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const HTTPX_BIN = 'C:\\Users\\bryan\\go\\bin\\httpx.exe';

function psWrap(scriptBlock, opts = {}) {
  return new Promise((resolve) => {
    const outFile = path.join(os.tmpdir(), `pswrap-${Date.now()}.json`);
    const doneFile = path.join(os.tmpdir(), `pswrap-done-${Date.now()}.txt`);
    const errFile = path.join(os.tmpdir(), `pswrap-err-${Date.now()}.txt`);

    // Write result to JSON file
    const ps = spawn('powershell', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command',
      `try {
        $ErrorActionPreference = 'Stop'
        $result = ${scriptBlock}
        $result | ConvertTo-Json -Depth 5 | Out-File -Encoding UTF8 -FilePath '${outFile}'
        'DONE' | Out-File -Encoding ASCII -FilePath '${doneFile}'
      } catch {
        'ERROR:' + $_.Exception.Message | Out-File -Encoding ASCII -FilePath '${errFile}'
        'DONE' | Out-File -Encoding ASCII -FilePath '${doneFile}'
      }`
    ], { windowsHide: true });

    const timer = setTimeout(() => {
      ps.kill();
      resolve({ timedOut: true, exit: -1, stdout: '', stderr: '' });
    }, opts.timeout || 120000);

    ps.on('close', (code) => {
      clearTimeout(timer);
      let result = { exit: code ?? 0, stdout: '', stderr: '' };
      if (fs.existsSync(doneFile)) {
        try { result = JSON.parse(fs.readFileSync(outFile, 'utf8')); } catch(e) { /* use defaults */ }
        fs.unlinkSync(doneFile);
      }
      if (fs.existsSync(errFile)) { result.stderr = fs.readFileSync(errFile, 'utf8'); fs.unlinkSync(errFile); }
      try { fs.unlinkSync(outFile); } catch(e) {}
      resolve(result);
    });
    ps.on('error', (e) => { clearTimeout(timer); resolve({ exit: -1, error: e.message }); });
  });
}

async function testSubfinder() {
  console.log('\n[TEST] subfinder');
  const outFile = path.join(os.tmpdir(), `sf-${Date.now()}.txt`);
  const result = await psWrap(`
    $r = & subfinder -d okta.com -silent -o '${outFile}' 2>&1
    $exit = $LASTEXITCODE
    $lines = if (Test-Path '${outFile}') { (Get-Content '${outFile}' | Where-Object { $_.Trim() }) } else { @() }
    @{ exit = $exit; count = $lines.Count; sample = $lines[0]; file = '${outFile}' }
  `, { timeout: 60000 });

  if (result.timedOut) { console.log('  TIMEOUT'); return { ok: false, timedOut: true }; }
  console.log(`  exit ${result.exit}, ${result.count || 0} subdomains found`);
  if (result.sample) console.log(`  sample: ${result.sample}`);
  try { fs.unlinkSync(outFile); } catch(e) {}
  return { ok: result.count > 0, count: result.count || 0 };
}

async function testGau() {
  console.log('\n[TEST] gau');
  const result = await psWrap(`
    $r = & gau --subs okta.com 2>&1
    $exit = $LASTEXITCODE
    $lines = $r | Where-Object { $_.Trim() -and $_ -notmatch '^__' -and $_ -notmatch 'projectdiscovery' }
    @{ exit = $exit; count = $lines.Count; sample = $lines[0] }
  `, { timeout: 60000 });

  if (result.timedOut) { console.log('  TIMEOUT'); return { ok: false, timedOut: true }; }
  console.log(`  exit ${result.exit}, ${result.count || 0} URLs`);
  if (result.sample) console.log(`  sample: ${result.sample}`);
  return { ok: result.count > 0, count: result.count || 0 };
}

async function testHttpx() {
  console.log('\n[TEST] httpx (Go binary)');
  const outFile = path.join(os.tmpdir(), `hx-${Date.now()}.txt`);
  const result = await psWrap(`
    $r = & '${HTTPX_BIN}' -u https://okta.com -silent -sc -nc 2>&1 | Out-File -Encoding UTF8 -FilePath '${outFile}' -Append
    $exit = $LASTEXITCODE
    $lines = if (Test-Path '${outFile}') { (Get-Content '${outFile}' | Where-Object { $_.Trim() }) } else { @() }
    @{ exit = $exit; output = $lines -join '; '; count = $lines.Count }
  `, { timeout: 20000 });

  if (result.timedOut) { console.log('  TIMEOUT'); return { ok: false, timedOut: true }; }
  console.log(`  exit ${result.exit}, ${result.count || 0} lines`);
  console.log(`  output: "${result.output || ''}"`);
  try { fs.unlinkSync(outFile); } catch(e) {}
  return { ok: result.exit === 0 && result.count > 0 };
}

async function testNuclei() {
  console.log('\n[TEST] nuclei (json-export to file)');
  const outFile = path.join(os.tmpdir(), `nuclei-${Date.now()}.jsonl`);
  const result = await psWrap(`
    $env:GOOGLE_API_KEY = ''
    $r = & nuclei -u https://okta.com -t 'C:\Users\bryan\.nuclei-templates\http\exposed-panels' -json-export '${outFile}' -nc -rl 20 -timeout 20 2>&1
    $exit = $LASTEXITCODE
    $hasFile = Test-Path '${outFile}'
    $sz = if ($hasFile) { (Get-Item '${outFile}').Length } else { 0 }
    $sample = if ($hasFile -and $sz -gt 0) { (Get-Content '${outFile}' -Raw).Substring(0, [Math]::Min(300, $sz)) } else { '' }
    @{ exit = $exit; hasFile = $hasFile; size = $sz; sample = $sample }
  `, { timeout: 40000 });

  if (result.timedOut) { console.log('  TIMEOUT'); return { ok: false, timedOut: true }; }
  console.log(`  exit ${result.exit}, file: ${result.hasFile ? 'YES (' + result.size + ' bytes)' : 'NO'}`);
  if (result.sample) console.log(`  sample: ${result.sample.substring(0, 200)}`);
  try { fs.unlinkSync(outFile); } catch(e) {}
  return { ok: result.hasFile !== false };
}

async function testDalfox() {
  console.log('\n[TEST] dalfox (AbortSignal.timeout=20s)');
  const outFile = path.join(os.tmpdir(), `df-${Date.now()}.txt`);
  const result = await psWrap(`
    $ErrorActionPreference = 'Continue'
    $start = Get-Date
    $r = & dalfox url https://okta.com -o '${outFile}' 2>&1
    $exit = $LASTEXITCODE
    $elapsed = (Get-Date) - $start
    $lines = if (Test-Path '${outFile}') { (Get-Content '${outFile}' | Where-Object { $_.Trim() }) } else { @() }
    @{ exit = $exit; elapsedSec = [Math]::Round($elapsed.TotalSeconds, 1); count = $lines.Count; sample = $lines[0] }
  `, { timeout: 30000 });

  if (result.timedOut) { console.log('  TIMEOUT after 30s'); return { ok: false, timedOut: true }; }
  console.log(`  exit ${result.exit}, elapsed ${result.elapsedSec || 0}s, ${result.count || 0} lines`);
  if (result.sample) console.log(`  sample: ${result.sample.substring(0, 150)}`);
  try { fs.unlinkSync(outFile); } catch(e) {}
  return { ok: true, timedOut: false, exit: result.exit, elapsed: result.elapsedSec };
}

async function testSqlmap() {
  console.log('\n[TEST] sqlmap (AbortSignal.timeout=25s)');
  const result = await psWrap(`
    $ErrorActionPreference = 'Continue'
    $start = Get-Date
    $r = & sqlmap -u https://okta.com --batch --level=1 2>&1 | Select-Object -First 20
    $exit = $LASTEXITCODE
    $elapsed = (Get-Date) - $start
    $info = $r | Where-Object { $_ -match 'INFO|CRITICAL|WARNING' } | Select-Object -First 3
    @{ exit = $exit; elapsedSec = [Math]::Round($elapsed.TotalSeconds, 1); info = $info -join ' | ' }
  `, { timeout: 35000 });

  if (result.timedOut) { console.log('  TIMEOUT after 35s'); return { ok: false, timedOut: true }; }
  console.log(`  exit ${result.exit}, elapsed ${result.elapsedSec || 0}s`);
  console.log(`  sample: ${result.info || '(none)'}`);
  return { ok: true, timedOut: false, exit: result.exit, elapsed: result.elapsedSec };
}

async function main() {
  console.log('=== TOOL SYSTEMATIC TEST ===');

  const results = {};
  results.subfinder = await testSubfinder();
  results.gau = await testGau();
  results.httpx = await testHttpx();
  results.nuclei = await testNuclei();
  results.dalfox = await testDalfox();
  results.sqlmap = await testSqlmap();

  console.log('\n=== SUMMARY ===');
  console.log(`subfinder: ${results.subfinder.ok ? '✅' : '❌'} (${results.subfinder.count} subs)`);
  console.log(`gau:       ${results.gau.ok ? '✅' : '❌'} (${results.gau.count} URLs)`);
  console.log(`httpx:     ${results.httpx.ok ? '✅' : '❌'}`);
  console.log(`nuclei:    ${results.nuclei.ok ? '✅' : '❌'} (file-based output)`);
  console.log(`dalfox:    ${results.dalfox.ok ? '✅' : '⚠️'} (exit=${results.dalfox.exit}, elapsed=${results.dalfox.elapsed}s)`);
  console.log(`sqlmap:    ${results.sqlmap.ok ? '✅' : '⚠️'} (exit=${results.sqlmap.exit}, elapsed=${results.sqlmap.elapsed}s)`);
}

main().catch(console.error);
