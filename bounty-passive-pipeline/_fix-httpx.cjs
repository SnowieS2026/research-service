const fs = require('fs');
let content = fs.readFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/src/scanner/HttpxScanner.ts', 'utf8');
// Fix: use full path for Go httpx binary
content = content.replace(
  "const hasHttpx = await isToolAvailable('httpx');",
  "const HTTPX_BIN = 'C:\\\\Users\\\\bryan\\\\go\\\\bin\\\\httpx.exe';\n  const hasHttpx = await isToolAvailable(HTTPX_BIN);"
);
content = content.replace(
  "await execFileP('httpx', args, { signal: AbortSignal.timeout(timeoutMs) });",
  "await execFileP(HTTPX_BIN, args, { signal: AbortSignal.timeout(timeoutMs) });"
);
fs.writeFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/src/scanner/HttpxScanner.ts', content);
console.log('Fixed HttpxScanner');
