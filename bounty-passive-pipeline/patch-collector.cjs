// Script to find and patch the advisory block in VehicleCollector.ts
const fs = require('fs');

const file = 'src/osint/collectors/VehicleCollector.ts';
const content = fs.readFileSync(file, 'utf8');

// Find the start of the comment block - look for "Pull advisory notes from the MOST RECENT MOT"
const commentStart = content.indexOf('// Pull advisory notes from the MOST RECENT MOT');
console.log('commentStart:', commentStart);

if (commentStart < 0) {
  console.error('Could not find comment start');
  process.exit(1);
}

// Find advisoryLines line
const advisoryIdx = content.indexOf('const advisoryLines: string[] = [];');
console.log('advisoryLines at:', advisoryIdx);

// Find closing brace of the for loop that follows advisoryLines
// The structure is: advisoryLines[], then motBlocks split, then for loop, then adviceMatches
// The block we want to replace ends at the closing } of the if (adviceMatches) block
// Let's find the first { after advisoryIdx (the for loop)
const firstBrace = content.indexOf('{', advisoryIdx);
console.log('First brace after advisoryIdx:', firstBrace);

// We need to find the } that closes the if (adviceMatches) block
// Count braces from advisoryIdx
let depth = 0;
let blockEnd = advisoryIdx;
for (let i = advisoryIdx; i < content.length; i++) {
  if (content[i] === '{') depth++;
  if (content[i] === '}') {
    depth--;
    if (depth === 0) { blockEnd = i + 1; break; }
  }
}
console.log('Block end (brace close):', blockEnd, JSON.stringify(content.substring(blockEnd - 20, blockEnd + 10)));

const before = content.substring(0, commentStart);
const after = content.substring(blockEnd);

const newBlock = `// Pull advisory notes from the MOST RECENT PASSED MOT block only.
        // Blocks start at each "MOT #N" marker (using lookahead split).
        // Each block: starts with "MOT #N\\n...Result:\\nPass\\nAdvice..."
        // We want the highest-numbered block whose Result is "Pass" (most recent passed test).
        const advisoryLines: string[] = [];
        const motBlocks = text.split(/(?=MOT #\\d+)/gi);
        let recentPassBlock = '';
        for (let i = 1; i < motBlocks.length; i++) {
          // Check if this block has a Pass result (skip iframe junk at index 0)
          if (/\\bResult:\\s*\\n?\\s*Pass\\b/i.test(motBlocks[i])) {
            recentPassBlock = motBlocks[i]; // last such block = highest MOT number
          }
        }
        const adviceMatches = recentPassBlock.match(/(?:Advice|Advisory) (.{10,200})/gi);
        if (adviceMatches) {
          for (const m of adviceMatches) {
            const item = m.replace(/^(?:Advice|Advisory)\\s+/i, '').trim();
            if (item.length > 10 && item.length < 200) {
              advisoryLines.push(item);
            }
          }
        }
`;

const newContent = before + newBlock + after;
fs.writeFileSync(file, newContent, 'utf8');
console.log('Patched successfully!');
console.log('Verification - new content at that position:');
console.log(newContent.substring(commentStart, commentStart + 200));
