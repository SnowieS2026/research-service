// Test script - runs each collector via subprocess and reports findings/errors
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

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

const reportDir = './osint-reports';

function runTest(type, target) {
  return new Promise((resolve) => {
    const reportsBefore = fs.existsSync(reportDir) 
      ? new Set(fs.readdirSync(reportDir)) 
      : new Set();
    
    const child = spawn('node', ['dist/src/index.js', '--osint', type, target], {
      cwd: '.',
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      // Find the newest report
      let newReports = [];
      if (fs.existsSync(reportDir)) {
        const reportsAfter = fs.readdirSync(reportDir);
        newReports = reportsAfter.filter(r => !reportsBefore.has(r));
      }
      
      resolve({
        exitCode: code,
        stdout,
        stderr,
        newReports
      });
    });
  });
}

const results = [];
for (const { type, target } of tests) {
  process.stdout.write(`Testing ${type} (${target})... `);
  const result = await runTest(type, target);
  
  // Check for report file
  let findings = 0;
  let errors = [];
  
  if (result.newReports.length > 0) {
    const latestReport = result.newReports[result.newReports.length - 1];
    const reportPath = path.join(reportDir, latestReport);
    try {
      const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      findings = reportData.findings?.length || 0;
      errors = reportData.errors || [];
    } catch (e) {
      errors.push('Could not read report: ' + e.message);
    }
  } else if (result.stdout.includes('Error') || result.stderr.includes('Error')) {
    errors.push('Process error - check stdout/stderr');
  }
  
  // Also check for errors in output
  if (result.stderr && !result.stderr.includes('Error')) {
    const errorLines = result.stderr.split('\n').filter(l => l.includes('Error') || l.includes('error'));
    errors.push(...errorLines);
  }
  
  const pass = findings >= 3 && errors.length === 0 && result.exitCode === 0;
  const status = pass ? 'PASS' : 'FAIL';
  console.log(`${status} - ${findings} findings, ${errors.length} errors, exit ${result.exitCode}`);
  
  if (!pass) {
    if (errors.length > 0) console.log('  Errors:', errors.slice(0, 2));
    if (result.stderr) console.log('  stderr:', result.stderr.substring(0, 200));
  }
  
  results.push({ type, target, pass, findings, errors });
}

console.log('\n=== SUMMARY ===');
const allPass = results.every(r => r.pass);
for (const r of results) {
  console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.type}: ${r.findings} findings, ${r.errors.length} errors`);
}
console.log(allPass ? '\nALL TESTS PASSED - 9/9' : '\nSOME TESTS FAILED');
process.exit(allPass ? 0 : 1);
