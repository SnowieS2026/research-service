// Test which vehicle data sources are accessible
const sources = [
  ['Parkers', 'https://www.parkers.co.uk/car-valuation/'],
  ['Parkers-Focus', 'https://www.parkers.co.uk/cars/ford/focus/2018/'],
  ['ValueMyCar', 'https://www.valuemycar.co.uk/'],
  ['AutoTrader', 'https://www.autotrader.co.uk/cars/valuation'],
  ['Motors', 'https://www.motors.co.uk/'],
  ['Motors-Focus', 'https://www.motors.co.uk/ford/focus/'],
  ['ExchangeData', 'https://www.exchange-data.io/'],
  ['AskCheck', 'https://mobile.app.askcheck.com/'],
  ['MotCheckEU', 'https://www.motcheck.eu/'],
  ['Check4Less', 'https://www.check4less.com/'],
  ['FreeCarCheck', 'https://www.freecarcheck.co.uk/'],
  ['VehicleCheck', 'https://www.vehiclecheck.co.uk/'],
  ['CarVansen', 'https://www.carvansen.com/'],
  ['Motorway', 'https://www.motorway.io/'],
  ['Carmax', 'https://www.carmax.uk.com/'],
];

async function testSource(name, url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    clearTimeout(timer);
    const ok = resp.ok || resp.status === 403 || resp.status === 429;
    console.log(`[${name}] HTTP ${resp.status} — ${ok ? 'ACCESSIBLE' : 'BLOCKED'}`);
    return { name, status: resp.status, accessible: ok };
  } catch (err) {
    console.log(`[${name}] ERROR: ${err.message}`);
    return { name, error: err.message, accessible: false };
  }
}

const plate = process.argv[2] || 'KY05YTJ';
console.log(`Testing vehicle data sources for plate: ${plate}\n`);

for (const [name, url] of sources) {
  await testSource(name, url);
}
