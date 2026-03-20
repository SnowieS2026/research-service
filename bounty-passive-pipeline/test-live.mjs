import { VehicleCollector } from './dist/src/osint/collectors/VehicleCollector.js';

const collector = new VehicleCollector();
const result = await collector.collect({ type: 'vehicle', target: 'KY05YTJ', flags: [] });

console.log('Errors:', result.errors);
console.log('advisory_costs count:', (result.rawData?.advisory_costs ?? []).length);
const valuation = result.rawData?.vehicle_valuation;
console.log('Valuation currentValue:', valuation?.currentValueMin, '-', valuation?.currentValueMax);
console.log('Valuation advisoryTotal:', valuation?.totalAdvisoryCostMin, '-', valuation?.totalAdvisoryCostMax);
console.log('Valuation expectedMonths:', valuation?.expectedMonthsRemaining);

const text = result.rawData?.CarCheck?.raw_text ?? '';
console.log('\nraw_text length:', text.length);

const motBlocks = text.split(/(?=MOT #\d+)/gi);
console.log('MOT blocks:', motBlocks.length);
for (let i = 0; i < motBlocks.length; i++) {
    const hasPass = /\bResult:\s*\n?\s*Pass\b/i.test(motBlocks[i]);
    const hasAdvice = /(?:Advice|Advisory)/i.test(motBlocks[i]);
    if (motBlocks[i].length > 5) {
        console.log(`Block ${i}: Pass=${hasPass} Advice=${hasAdvice} Len=${motBlocks[i].length}`);
    }
}

let recentPassBlock = '';
for (let i = motBlocks.length - 1; i >= 1; i--) {
    if (/\bResult:\s*\n?\s*Pass\b/i.test(motBlocks[i])) {
        recentPassBlock = motBlocks[i];
        console.log('\nMost recent pass block: index', i);
        break;
    }
}

if (!recentPassBlock) {
    console.log('ERROR: No recent pass block found');
} else {
    const items = [...recentPassBlock.matchAll(/(?:Advice|Advisory)\s+([^.]{10,150})/gi)];
    console.log('Items in most recent pass block:', items.length);
    for (const m of items) console.log('-', m[1].trim().substring(0, 80));
}
