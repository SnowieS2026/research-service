const db = require('better-sqlite3')('logs/bounty.db');
const findingsSchema = db.prepare("PRAGMA table_info(findings)").all();
console.log('Findings schema:', JSON.stringify(findingsSchema, null, 2));
const findingsSample = db.prepare("SELECT * FROM findings LIMIT 3").all();
console.log('Findings sample:', JSON.stringify(findingsSample, null, 2));
db.close();
