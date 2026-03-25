const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, 'reports');
if (!fs.existsSync(base)) { console.log('No reports dir'); process.exit(0); }

const dates = fs.readdirSync(base).filter(f => {
    try { return fs.statSync(path.join(base, f)).isDirectory(); } catch { return false; }
}).sort().reverse().slice(0, 7);

dates.forEach(d => {
    const dir = path.join(base, d);
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    const bugcrowd = files.filter(f => f.startsWith('bugcrowd-') && !f.includes('okta') && !f.includes('bugcrowd_com'));
    console.log(`${d}: ${files.length} reports total, ${bugcrowd.length} bugcrowd`);
    if (bugcrowd.length > 0) {
        bugcrowd.slice(0, 3).forEach(f => {
            const content = fs.readFileSync(path.join(dir, f), 'utf8');
            const urls = content.match(/[-*]\s+(https?:\/\/[^\s\n]+)/g) || [];
            console.log(`  ${f} — ${urls.length} URLs`);
        });
    }
});
