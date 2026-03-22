import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const child = spawn('node', ['dist/src/osint/index.js', '--osint', 'vehicle', 'KY05YTJ'], {
  cwd: __dirname,
  stdio: ['ignore', 'pipe', 'pipe']
});

let stdout = '';
let stderr = '';

child.stdout.on('data', (d) => { stdout += d.toString(); });
child.stderr.on('data', (d) => { stderr += d.toString(); });

child.on('close', (code) => {
  writeFileSync('vehicle-output.json', stdout);
  writeFileSync('vehicle-error.txt', stderr);
  console.log(`Exit: ${code}, stdout bytes: ${stdout.length}, stderr bytes: ${stderr.length}`);
});
