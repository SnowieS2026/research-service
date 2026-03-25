const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'reports', '2026-03-25');
if (!fs.existsSync(dir)) { console.log('No reports dir'); process.exit(0); }

const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
for (const f of files.slice(0, 10)) {
    const content = fs.readFileSync(path.join(dir, f), 'utf8');
    const titleMatch = content.match(/^#\s+(.+)/m);
    const urlMatches = content.match(/[-*]\s+(https?:\/\/[^\s]+)/g) || [];
    const program = titleMatch ? titleMatch[1] : 'no title';
    console.log(`${f} | ${program} | ${urlMatches.length} URLs`);
}
