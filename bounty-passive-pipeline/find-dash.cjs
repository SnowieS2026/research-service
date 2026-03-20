// Script to find and patch the advisory block in VehicleCollector.ts
const fs = require('fs');

const file = 'src/osint/collectors/VehicleCollector.ts';
const content = fs.readFileSync(file, 'utf8');

// Search for 'empty final MOT' to find the em-dash region
const idx = content.indexOf('empty final MOT');
console.log('Found "empty final MOT" at:', idx);
const slice = content.slice(idx+20, idx+40);
console.log('After:', slice.toString('hex'), JSON.stringify(slice.toString('utf8')));
