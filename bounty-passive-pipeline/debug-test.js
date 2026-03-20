// Direct test of the compiled estimateAdvisories function
import { estimateAdvisories } from './dist/src/osint/collectors/VehicleValuation.js';

const advisoryLines = [
  "Brake pipe corroded, covered in grease or other material  Both front to rear (1.1.11 (c))",
  "Nearside Rear Brake hose has slight corrosion to ferrule (1.1.12 (f) (i))",
  "Offside Rear Brake hose has slight corrosion to ferrule (1.1.12 (f) (i))",
  "Nearside Brake cable damaged but not to excess (1.1.15 (a))",
  "Offside Brake cable damaged but not to excess (1.1.15 (a))",
  "Front Sub-frame corroded but not seriously weakened (5.3.3 (b) (i))",
  "Rear Sub-frame corroded but not seriously weakened (5.3.3 (b) (i))",
  "Nearside Headlamp lens slightly defective (4.1.1 (b) (i))",
  "Offside Headlamp lens slightly defective (4.1.1 (b) (i))",
  "Various areas of corrosion to underside of vehicle and suspension components"
];

const result = estimateAdvisories(advisoryLines, 6, 24, 2005, 1248, 'DIESEL');
console.log('estimateAdvisories returned', result.length, 'items');
result.forEach((a, i) => {
  console.log(`  ${i+1}. ${a.item}: £${a.estimatedCostMin}-£${a.estimatedCostMax} (${a.severity})`);
});

const totalMin = result.reduce((s, a) => s + a.estimatedCostMin, 0);
const totalMax = result.reduce((s, a) => s + a.estimatedCostMax, 0);
console.log(`\nTotal: £${totalMin} - £${totalMax}`);
