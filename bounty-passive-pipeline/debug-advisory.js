const text = ` Advice Brake pipe corroded, covered in grease or other material  Both front to rear (1.1.11 (c)) Advice Nearside Rear Brake hose has slight corrosion to ferrule (1.1.12 (f) (i)) Advice Offside Rear Brake hose has slight corrosion to ferrule (1.1.12 (f) (i)) Advice Nearside Brake cable damaged but not to excess (1.1.15 (a)) Advice Offside Brake cable damaged but not to excess (1.1.15 (a)) Advice Front Sub-frame corroded but not seriously weakened (5.3.3 (b) (i)) Advice Rear Sub-frame corroded but not seriously weakened (5.3.3 (b) (i)) Advice Nearside Headlamp lens slightly defective (4.1.1 (b) (i)) Advice Offside Headlamp lens slightly defective (4.1.1 (b) (i)) Advice Various areas of corrosion to underside of vehicle and suspension components`;

const items = [];
for (const m of text.matchAll(/(?:Advice|Advisory)\s+([^.]{10,150})/gi)) {
  items.push(m[1].trim());
}
console.log('Extracted advisory items:');
items.forEach((item, i) => console.log(`${i}: "${item}"`));

// Now simulate cleaning
const cleaned = items.join(' ')
  .replace(/\bMOT\s*#?\d*\b/gi, ' ')
  .replace(/\bMOT test\b/gi, ' ')
  .replace(/\b\d+\.\d+\.\d+\s*\([a-z]\)\s*\([i]+\)/gi, ' ')
  .replace(/\b\d+\.\d+\.\d+\s*\([a-z]\)/gi, ' ')
  .replace(/\b\d+\.\d+\s*\([a-z]\s*\([i]+\)\)/gi, ' ')
  .replace(/\b(nearside|offside|both|front|rear|ns|os)\b/gi, ' ')
  .replace(/\b\d+(?:\.\d+)?\s*(?:mm|cm|mph|bhp|cc|rpm|mpg|km|l|kg)\b/gi, ' ')
  .replace(/\b\d{3}\/\d{2}[R\-]\d{2}\b/g, ' ')
  .replace(/[,.;:]+$/g, '')
  .replace(/\s+/g, ' ')
  .trim();

console.log('\nCleaned text:');
console.log(cleaned);

// Test matchAdvisories
const ADVISORY_DATABASE = [
  { keywords: ['brake pipe corroded', 'brake pipe severely corroded', 'brake pipes corroded', 'corroded brake pipe'], item: 'Brake pipe corroded', severity: 'high', urgency: 'soon', costMin: 100, costMax: 250, labourHours: 1.5, notes: '', partsIncluded: false },
  { keywords: ['brake hose'], item: 'Brake hose corrosion', severity: 'medium', urgency: 'soon', costMin: 50, costMax: 150, labourHours: 0.5, notes: '', partsIncluded: false },
  { keywords: ['brake cable'], item: 'Brake cable damage', severity: 'medium', urgency: 'when_due', costMin: 30, costMax: 100, labourHours: 0.5, notes: '', partsIncluded: false },
  { keywords: ['sub-frame corroded', 'subframe corroded'], item: 'Sub-frame corrosion', severity: 'medium', urgency: 'when_due', costMin: 150, costMax: 600, labourHours: 3.0, notes: '', partsIncluded: false },
  { keywords: ['headlamp lens', 'headlight lens'], item: 'Headlamp lens defective', severity: 'low', urgency: 'when_due', costMin: 30, costMax: 100, labourHours: 0.5, notes: '', partsIncluded: false },
  { keywords: ['tyre worn close to legal limit', 'tyres worn close to limit', 'worn close to legal limit'], item: 'Tyre near legal limit', severity: 'high', urgency: 'immediate', costMin: 60, costMax: 140, labourHours: 0.5, notes: '', partsIncluded: true },
  { keywords: ['coil spring fractured', 'coil spring broken'], item: 'Coil spring fractured', severity: 'critical', urgency: 'immediate', costMin: 100, costMax: 300, labourHours: 1.5, notes: '', partsIncluded: true },
  { keywords: ['anti-roll bar linkage', 'drop link'], item: 'Anti-roll bar linkage worn', severity: 'high', urgency: 'soon', costMin: 40, costMax: 120, labourHours: 0.75, notes: '', partsIncluded: false },
  { keywords: ['various areas of corrosion', 'areas of corrosion'], item: 'General corrosion', severity: 'medium', urgency: 'when_due', costMin: 100, costMax: 500, labourHours: 0, notes: '', partsIncluded: false },
];

const lower = cleaned.toLowerCase();
const matched = [];
for (const entry of ADVISORY_DATABASE) {
  for (const kw of entry.keywords) {
    if (lower.includes(kw)) {
      matched.push({ item: entry.item, costMin: entry.costMin, costMax: entry.costMax });
      break;
    }
  }
}

console.log('\nMatched advisories:');
matched.forEach(m => console.log(`  ${m.item}: £${m.costMin}-£${m.costMax}`));

const totalMin = matched.reduce((s, m) => s + m.costMin, 0);
const totalMax = matched.reduce((s, m) => s + m.costMax, 0);
console.log(`\nTotal: £${totalMin} - £${totalMax}`);
