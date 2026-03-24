const { VehicleCollector } = require('./dist/src/osint/collectors/VehicleCollector.js');

async function main() {
  const collector = new VehicleCollector();
  const result = await collector.collect({ target: 'KY05YTJ' });

  const fs = require('fs');
  fs.writeFileSync('vehicle-test-out.json', JSON.stringify(result, null, 2));

  const advisoryTotal = result.findings.find(f => f.field === 'advisory_total_min');
  console.log('advisory_total_min:', advisoryTotal ? advisoryTotal.value : 'NOT FOUND');

  const advisoryCosts = result.findings.filter(f => f.field.startsWith('cost__'));
  console.log('Individual advisory costs:', advisoryCosts.length);
  advisoryCosts.forEach(ac => console.log(' ', ac.field, '=', ac.value));
}

main().catch(e => { console.error(e); process.exit(1); });
