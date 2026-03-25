const fs = require('fs');
const csv = fs.readFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/superhuman-scope.csv', 'utf8');
const lines = csv.split('\n');
const header = lines[0].split(',');
console.log('Total lines: ' + lines.length);
console.log('Headers: ' + header.join(' | '));

// Parse CSV properly
const assets = [];
let currentLine = '';
for (let i = 1; i < lines.length; i++) {
  currentLine += lines[i];
  const quoteCount = (currentLine.match(/"/g) || []).length;
  if (quoteCount % 2 === 0) {
    const fields = [];
    let inQuote = false;
    let field = '';
    for (let c of currentLine) {
      if (c === '"') inQuote = !inQuote;
      else if (c === ',' && !inQuote) { fields.push(field); field = ''; }
      else field += c;
    }
    fields.push(field);
    if (fields.length >= 4) {
      assets.push({ identifier: fields[0], type: fields[1], instruction: fields[2], eligible: fields[3] });
    }
    currentLine = '';
  } else {
    currentLine += '\n';
  }
}

console.log('\n=== SUPERHUMAN SCOPE (' + assets.length + ' assets) ===');
assets.forEach(a => {
  console.log(a.type.padEnd(25) + ' | ' + a.identifier);
});

// Save parsed scope
fs.writeFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/superhuman-scope-parsed.json', JSON.stringify(assets, null, 2));
