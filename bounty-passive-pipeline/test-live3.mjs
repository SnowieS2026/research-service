import { VehicleCollector } from './dist/src/osint/collectors/VehicleCollector.js';

const collector = new VehicleCollector();
const result = await collector.collect({ type: 'vehicle', target: 'KY05YTJ', flags: [] });

console.log('=== FINDINGS ===');
for (const f of result.findings) {
    if (f.source === 'VehicleValuation' || f.field === 'advisory_cost_total') {
        console.log(`[${f.source}] ${f.field}: ${f.value}`);
    }
}

console.log('\n=== RAW DATA KEYS ===');
// rawData is a Map — check it directly
const raw = result.rawData;
console.log('rawData type:', raw.constructor.name);
console.log('rawData size:', raw.size);
for (const [k, v] of raw) {
    if (k === 'vehicle_valuation') {
        console.log('vehicle_valuation:', JSON.stringify(v));
    }
    if (k === 'advisory_costs') {
        console.log('advisory_costs:', JSON.stringify(v));
    }
    if (typeof v === 'string' && v.length < 80) {
        console.log(`  ${k}: ${v}`);
    }
}
