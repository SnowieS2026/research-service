import { estimateAdvisories, generateVehicleValuation } from './dist/src/osint/collectors/VehicleValuation.js';

// Test with MOT #6 items from the live run
const advisoryLines = [
    'Nearside Front Tyre worn close to legal limit/worn on edge 185/55-15 (5.2.3 (e))',
    'Offside Rear Tyre slightly damaged/cracking or perishing (5.2.3 (d) (ii))',
    'Nearside Rear Tyre slightly damaged/cracking or perishing (5.2.3 (d) (ii))',
    'Nearside Brake cable damaged but not to excess (1.1.15 (a))',
    'Offside Brake cable damaged but not to excess (1.1.15 (a))',
    'Brake pipe corroded, covered in grease or other material Both front to rear (1.1.11 (c))',
    'Nearside Rear Brake hose has slight corrosion to ferrule (1.1.12 (f) (i))',
    'Offside Rear Brake hose has slight corrosion to ferrule (1.1.12 (f) (i))',
    'Front Headlamp lens slightly defective Both (4.1.1 (b) (i))',
    'Various areas of surface corrosion to underside of vehicle and suspension components'
];

console.log('Testing estimateAdvisories with MOT #6 items:');
const costs = estimateAdvisories(advisoryLines, 6, 24, 2005, 1248, 'DIESEL');
console.log('Returned:', costs.length, 'items');
for (const c of costs) {
    console.log(`  [${c.severity}] ${c.item}: £${c.estimatedCostMin}-£${c.estimatedCostMax}`);
}

console.log('\nTotal min:', costs.reduce((s, c) => s + c.estimatedCostMin, 0));
console.log('Total max:', costs.reduce((s, c) => s + c.estimatedCostMax, 0));

console.log('\nTesting generateVehicleValuation:');
const val = generateVehicleValuation('VAUXHALL', 'CORSA SXI CDTI', 2005, 84000, 'DIESEL', costs, 6, 24);
console.log('currentValueMin:', val.currentValueMin, 'currentValueMax:', val.currentValueMax);
console.log('totalAdvisoryCostMin:', val.totalAdvisoryCostMin, 'totalAdvisoryCostMax:', val.totalAdvisoryCostMax);
console.log('expectedMonthsRemaining:', val.expectedMonthsRemaining);
console.log('recommendation:', val.recommendation);
