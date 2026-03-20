const { estimateAdvisories } = require('./dist/src/osint/collectors/VehicleValuation.js');

// Simulate the MOT #6 block from the actual raw text (simplified)
const text = `Advice Nearside Front Tyre worn close to legal limit/worn on edge 185/55-15 (5.2.3 (e)) Advice Offside Rear Tyre slightly damaged/cracking or perishing (5.2.3 (d) (ii)) Advice Nearside Rear Tyre slightly damaged/cracking or perishing (5.2.3 (d) (ii)) Advice Nearside Brake cable damaged but not to excess (1.1.15 (a)) Advice Offside Brake cable damaged but not to excess (1.1.15 (a)) Advice Brake pipe corroded covered in grease or other material Both front to rear (1.1.11 (c)) Advice Nearside Rear Brake hose has slight corrosion to ferrule (1.1.12 (f) (i)) Advice Offside Rear Brake hose has slight corrosion to ferrule (1.1.12 (f) (i)) Advice Front Headlamp lens slightly defective Both (4.1.1 (b) (i)) Advice Various areas of surface corrosion to underside of vehicle and suspension components`;

const advisoryLines = text.split(/(?:Advice|Advisory)\s+/gi).filter(s => s.trim().length > 5);
console.log('advisoryLines count:', advisoryLines.length);
for (const l of advisoryLines) console.log('-', l.trim().substring(0, 80));

const result = estimateAdvisories(advisoryLines, 6, 24, 2005, 1248, 'DIESEL');
console.log('\nestimateAdvisories returned:', result.length, 'items');
for (const a of result) {
  console.log(`  [${a.severity}] ${a.item} — £${a.estimatedCostMin}-£${a.estimatedCostMax}`);
}
