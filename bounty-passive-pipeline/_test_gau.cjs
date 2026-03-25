const { spawn } = require('child_process');
const out = [], err = [];

console.log('Starting gau test...');
const p = spawn('C:\\Users\\bryan\\go\\bin\\gau.exe', ['--providers', 'wayback,commoncrawl', 'blockchain.com'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
});

p.stdout.on('data', d => { out.push(d); });
p.stderr.on('data', d => { err.push(d); });

p.on('close', (code) => {
    const stdout = Buffer.concat(out).toString('utf8');
    const lines = stdout.split('\n').filter(l => l.trim()).length;
    console.log('Exit code:', code);
    console.log('URLs found:', lines);
    if (lines > 0) {
        const sample = stdout.split('\n').filter(l => l.trim()).slice(0, 3);
        console.log('Sample URLs:', sample);
    }
    const stderr = Buffer.concat(err).toString();
    if (stderr.trim()) console.log('Stderr:', stderr.substring(0, 300));
    process.exit(0);
});

p.on('error', e => {
    console.log('Spawn error:', e.message);
    process.exit(1);
});

setTimeout(() => {
    console.log('TIMEOUT - killing');
    p.kill();
    process.exit(1);
}, 90000);
