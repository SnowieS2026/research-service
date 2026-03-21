const {spawn} = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Test: write URL list to file
const tmpDir = os.tmpdir();
const urlsFile = path.join(tmpDir, 'httpx-test-urls.txt');
const outFile = path.join(tmpDir, 'httpx-test-out.txt');
fs.writeFileSync(urlsFile, 'https://login.okta.com\nhttps://accounts.webmd.com\nhttps://member.webmd.com\n');

const child = spawn('C:\\Users\\bryan\\go\\bin\\httpx.exe', ['-list', urlsFile, '-silent', '-status-code', '-o', outFile], {shell: true, windowsHide: true});
let out = '', err = '';
child.stdout && child.stdout.on('data', d => { out += d; process.stdout.write('STDOUT: ' + d); });
child.stderr && child.stderr.on('data', d => { err += d; process.stderr.write('STDERR: ' + d); });
child.on('close', code => {
  console.log('code:', code);
  console.log('out file exists:', fs.existsSync(outFile));
  if (fs.existsSync(outFile)) {
    const c = fs.readFileSync(outFile, 'utf8');
    console.log('out content: [' + c.length + '] ' + JSON.stringify(c.substring(0, 200)));
    const lines = c.split('\n').filter(Boolean);
    console.log('lines:', lines.length);
    for (const l of lines) console.log('  LINE:', JSON.stringify(l));
    fs.unlinkSync(outFile);
  }
  fs.unlinkSync(urlsFile);
});
setTimeout(() => child.kill(), 15000);
