import { runOsint } from './dist/src/osint/index.js';

const tests = [
  { type: 'vehicle', target: 'KY05YTJ' },
  { type: 'domain', target: 'example.com' },
  { type: 'ip', target: '8.8.8.8' },
  { type: 'phone', target: '+447700900000' },
  { type: 'email', target: 'test@example.com' },
  { type: 'general', target: 'Edinburgh' },
  { type: 'business', target: 'Tesco' },
  { type: 'person', target: 'John Smith' },
  { type: 'username', target: 'testuser123' },
];

for (const { type, target } of tests) {
  process.stdout.write(`Testing ${type} (${target})... `);
  const result = await runOsint({ type, target });
  const status = result.findings.length >= 3 && result.errors.length === 0 ? 'PASS' : 'FAIL';
  console.log(`${status} - ${result.findings.length} findings, ${result.errors.length} errors`);
  if (result.errors.length > 0) {
    console.log('  Errors:', result.errors.slice(0, 3));
  }
}
console.log('Done');
