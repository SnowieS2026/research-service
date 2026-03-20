import { VehicleCollector } from './dist/src/osint/collectors/VehicleCollector.js';

const collector = new VehicleCollector();
const result = await collector.collect({ type: 'vehicle', target: 'KY05YTJ', flags: [] });

const text = result.rawData?.CarCheck?.raw_text ?? '';
console.log('raw_text length:', text.length);
console.log('Last 200 chars:', JSON.stringify(text.slice(-200)));

// What does the collector get for make/model/year/fuelType?
const vcData = result.rawData?.VehicleCollector;
console.log('\n--- VehicleCollector rawData ---');
console.log('make:', vcData?.make);
console.log('model:', vcData?.model);
console.log('year:', vcData?.year);
console.log('fuel_type:', vcData?.fuel_type);
console.log('engine_capacity:', vcData?.engine_capacity);
console.log('vehicle_valuation:', JSON.stringify(vcData?.vehicle_valuation));
