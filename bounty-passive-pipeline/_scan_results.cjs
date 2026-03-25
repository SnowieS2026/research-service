const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'logs', 'scan-results');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

files.forEach(f => {
    const content = fs.readFileSync(path.join(dir, f), 'utf8');
    const lines = content.trim().split('\n').filter(l => l.trim());
    const tool = f.replace('-result.json', '');
    console.log(`${tool}: ${lines.length} lines`);
    if (lines.length > 0) {
        try {
            const first = JSON.parse(lines[0]);
            if (first.findings !== undefined) {
                console.log(`  -> ${first.findings.length} findings`);
            } else if (Array.isArray(first)) {
                console.log(`  -> ${first.length} findings`);
            }
        } catch(e) {}
    }
});
