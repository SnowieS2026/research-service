import fs from 'fs';

const reportDir = 'reports/osint/2026-03-20';
const files = fs.readdirSync(reportDir).filter(f => f.includes('KY05YTJ'));
const latest = files.sort().at(-1);
console.log('Reading:', latest);

const content = fs.readFileSync(`${reportDir}/${latest}`, 'utf-8');
const jsonMatch = content.match(/```json\n([\s\S]+?)\n```/);
if (!jsonMatch) { console.log('No JSON found'); process.exit(1); }
const report = JSON.parse(jsonMatch[1]);

// Check what's in rawData
const vc = report?.rawData?.VehicleCollector;
console.log('VehicleCollector keys:', Object.keys(vc ?? {}));
console.log('CarCheck keys:', Object.keys(vc?.CarCheck ?? {}));
console.log('raw_text length:', (vc?.CarCheck?.raw_text ?? '').length);
console.log('raw_text first 100:', JSON.stringify((vc?.CarCheck?.raw_text ?? '').substring(0, 100)));
console.log('advisory_costs length:', (vc?.CarCheck?.advisory_costs ?? []).length);
