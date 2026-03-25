const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'logs', 'bounty.db');
const db = new Database(dbPath);

console.log('Tables:', db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name).join(', '));

const runs = db.prepare('SELECT id, platform, programs_found, changes_found, created_at FROM runs ORDER BY id DESC LIMIT 20').all();
console.log('\nRecent runs:');
runs.forEach(r => console.log(`  [${r.id}] ${r.platform} - ${r.programs_found} programs, ${r.changes_found} changes, ${r.created_at}`));

// Check snapshots for program names
const fs = require('fs');
const snapDir = path.join(__dirname, 'logs', 'snapshots');
if (fs.existsSync(snapDir)) {
    const snaps = fs.readdirSync(snapDir).filter(f => f.endsWith('.json')).sort().reverse().slice(0, 10);
    console.log('\nRecent snapshots:');
    snaps.forEach(s => {
        try {
            const data = JSON.parse(fs.readFileSync(path.join(snapDir, s), 'utf8'));
            const name = data.program?.name || data.name || 'unknown';
            const platform = data.platform || 'unknown';
            console.log(`  ${s}: ${platform}/${name}`);
        } catch(e) {
            console.log(`  ${s}: (parse error)`);
        }
    });
}
