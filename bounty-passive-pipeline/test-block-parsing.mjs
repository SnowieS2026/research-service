import fs from 'fs';

const reportDir = 'reports/osint/2026-03-20';
const files = fs.readdirSync(reportDir).filter(f => f.includes('KY05YTJ'));
const latest = files.sort().at(-1);
console.log('Reading:', latest);

const content = fs.readFileSync(`${reportDir}/${latest}`, 'utf-8');

// Extract JSON from markdown code block
const jsonMatch = content.match(/```json\n([\s\S]+?)\n```/);
if (!jsonMatch) { console.log('No JSON found'); process.exit(1); }
const report = JSON.parse(jsonMatch[1]);

const rawText = report?.rawData?.VehicleCollector?.CarCheck?.raw_text ?? '';
console.log('raw_text length:', rawText.length);

// Split like the collector does
const motBlocks = rawText.split(/(?=MOT #\d+)/gi);
console.log('Total motBlocks:', motBlocks.length);
for (let i = 0; i < motBlocks.length; i++) {
    const firstLine = motBlocks[i].split('\n')[0].substring(0, 60);
    const hasPass = /\bResult:\s*\n?\s*Pass\b/i.test(motBlocks[i]);
    const hasAdvice = /(?:Advice|Advisory)/i.test(motBlocks[i]);
    console.log(`Block ${i}: "${firstLine}" | Pass:${hasPass} | Advice:${hasAdvice} | Len:${motBlocks[i].length}`);
}

console.log('\n--- Looking for recent pass block ---');
let recentPassBlock = '';
for (let i = motBlocks.length - 1; i >= 1; i--) {
    const block = motBlocks[i];
    const passTest = /\bResult:\s*\n?\s*Pass\b/i.test(block);
    console.log(`Block ${i}: Pass=${passTest}, Len=${block.length}`);
    if (passTest) {
        recentPassBlock = block;
        console.log('Found recent pass at block', i);
        break;
    }
}

if (!recentPassBlock) {
    console.log('ERROR: No recent pass block found!');
} else {
    const items = [...recentPassBlock.matchAll(/(?:Advice|Advisory)\s+([^.]{10,150})/gi)];
    console.log('Items in recent pass block:', items.length);
    for (const m of items) console.log('-', m[1].trim().substring(0, 80));
}
