const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const TMP = os.tmpdir();
const subFile = path.join(TMP, 'nuclei-test-subs.txt');
const nucleiOut = path.join(TMP, 'nuclei-test-out.txt');

// Clean up old files
[subFile, nucleiOut].forEach(f => { try { fs.unlinkSync(f); } catch {} });

// Write test targets (okta customer login portals)
const targets = [
    'https://accounts.okta.com',
    'https://accessemr.okta.com',
    'https://agent-login.okta.com',
    'https://2fdcg.okta.com',
    'https://acmeinc.okta.com',
];
fs.writeFileSync(subFile, targets.join('\n'));

console.log('Targets:', targets.length);
console.log('subFile:', subFile);

// Test nuclei with -stats
const p = spawn('nuclei', [
  '-l', subFile,
  '-rate-limit', '30',
  '-timeout', '8',
  '-retries', '0',
  '-nc',
  '-json',
  '-o', nucleiOut
], { shell: true, windowsHide: true });

let out = '', err = '';
p.stdout.on('data', d => { process.stdout.write('[stdout] ' + d.toString()); out += d; });
p.stderr.on('data', d => { process.stderr.write('[stderr] ' + d.toString()); err += d; });
p.on('close', code => {
  console.log('\n=== nuclei exited:', code, '===');
  console.log('stdout:', out.substring(0, 500));
  console.log('stderr:', err.substring(0, 500));
  console.log('Output file exists:', fs.existsSync(nucleiOut));
  if (fs.existsSync(nucleiOut)) {
    const content = fs.readFileSync(nucleiOut, 'utf8');
    console.log('Output content:\n' + content.substring(0, 1000));
  }
  try { fs.unlinkSync(subFile); } catch {}
  try { fs.unlinkSync(nucleiOut); } catch {}
});
