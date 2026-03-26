#!/usr/bin/env node
/**
 * vehicle-osint.js — Standalone Vehicle OSINT CLI
 *
 * Usage: node vehicle-osint.js <REG> [--output ./report.md]
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 1: CLI PARSER
// ═══════════════════════════════════════════════════════════════════════════════

const CLI = (() => {
  const args = process.argv.slice(2);
  const positional = [];
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) { flags[key] = next; i++; }
      else { flags[key] = true; }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      const next = args[i + 1];
      if (next && !next.startsWith('-')) { flags[key] = next; i++; }
      else { flags[key] = true; }
    } else {
      positional.push(arg);
    }
  }
  const plate = positional[0];
  const outputPath = flags.output || null;
  if (!plate) {
    console.error('Usage: node vehicle-osint.js <REG> [--output ./report.md]');
    process.exit(1);
  }
  return { plate, outputPath };
})();

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 2: SPEC EXTRACTOR (zone-based label scanning)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * car-checking.com spec section is one enormous line like:
 *   "Make FORD Model MONDEO LX Colour BLUE Year of manufacture 2005 Top speed 133mph ..."
 *
 * Strategy: find each known label's position in the text, use the next label's
 * position as the end boundary. Value = trimmed text between.
 */
function parseSpecSection(body) {
  const out = {};

  // Spec section (after "Make " up to " MOT history" boundary):
  // "Make FORD Model MONDEO LX Colour BLUE Year of manufacture 2005 Top speed 133mph
  //  0 to 60 MPH 9.9seconds Gearbox MANUAL 5 GEARS Engine & fuel consumption
  //  Power 145 BHP Torque 4500 rpm Engine capacity 1999 cc Cylinders 4
  //  Fuel type PETROL Consumption city 24.6 mpg Consumption extra urban 47.1 mpg
  //  Consumption combined 35.3 mpg CO2 emission 192 g/km CO2 label J"
  //
  // Grab text after "Make " up to " MOT history" boundary.
  const specMatch = body.match(/\bMake\s+([A-Z][^\n]*?)\s+(?=MOT\s+history\s+|$)/i);
  if (!specMatch) return out;
  const spec = specMatch[1];

  // Each field uses its own regex anchored to its label and the next label.
  // co2_gkm is extracted FIRST with a stop-before-"CO2 label" anchor so
  // it doesn't swallow "CO2 label J" as part of the value.
  const patterns = [
    ['make',       /\bMake\s+([A-Z][A-Z0-9 ]+?)(?=\s+Model\s)/i],
    ['model',      /\bModel\s+([A-Z][A-Za-z0-9 ]+?)(?=\s+Colour\s)/i],
    ['colour',     /\bColour\s+([A-Z][A-Za-z ]+?)(?=\s+Year\s+of\s+manufacture\s)/i],
    ['year',       /\bYear\s+of\s+manufacture\s+(\d{4})(?=\s+Top\s+speed\s)/i],
    ['top_speed',  /\bTop\s+speed\s+(\d+(?:\.\d+)?\s*mph)(?=\s+0\s+to\s+60\s)/i],
    ['zero_to_60', /\b0\s+to\s+60\s+(?:MPH\s+)?([\d.]+\s*seconds?)(?=\s+Gearbox\s)/i],
    ['gearbox',    /\bGearbox\s+([^\n]+?)(?=\s+Engine\s+(?:&|\&)\s+fuel\s)/i],
    ['power_bhp',  /\bPower\s+([\d.]+\s*BHP)(?=\s+Torque\s)/i],
    ['torque_rpm', /\bTorque\s+([\d,]+(?:\.\d+)?\s*rpm)(?=\s+Engine\s+capacity\s)/i],
    ['engine_capacity',/\bEngine\s+capacity\s+(\d+)\s*cc(?=\s+Cylinders\s)/i],
    ['cylinders',  /\bCylinders\s+(\d+)(?=\s+Fuel\s+type\s)/i],
    ['fuel_type',  /\bFuel\s+type\s+([A-Za-z/]+?)(?=\s+Consumption\s+city\s)/i],
    ['consumption_city',/\bConsumption\s+city\s+([\d.]+\s*mpg)(?=\s+Consumption\s+extra\s+urban\s)/i],
    ['consumption_extra_urban',/\bConsumption\s+extra\s+urban\s+([\d.]+\s*mpg)(?=\s+Consumption\s+combined\s)/i],
    ['consumption_combined',/\bConsumption\s+combined\s+([\d.]+\s*mpg)(?=\s+CO2\s+emission\s)/i],
    // co2_gkm: stop BEFORE "CO2 label" so it doesn't swallow "192 g/km CO2 label J"
    ['co2_gkm',    /\bCO2\s+emission\s+(\d+\s*g\/km)(?=\s+CO2\s+label\s)/i],
    ['co2_label',  /\bCO2\s+label\s+([A-J])(?=\s|$)/i],
  ];

  for (const [key, regex] of patterns) {
    const m = spec.match(regex);
    if (m && m[1]) {
      let val = m[1].trim();
      // Strip redundant units
      if (key === 'zero_to_60')          val = val.replace(/^MPH\s+/i, '').replace(/\s*seconds?$/i, '').trim();
      if (key === 'top_speed')           val = val.replace(/\s*mph$/i, '').trim();
      if (key === 'consumption_city')    val = val.replace(/\s*mpg$/i, '').trim();
      if (key === 'consumption_extra_urban') val = val.replace(/\s*mpg$/i, '').trim();
      if (key === 'consumption_combined') val = val.replace(/\s*mpg$/i, '').trim();
      if (val.length > 0) out[key] = val;
    }
  }

  return out;



}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 3: MOT HISTORY PARSER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * car-checking.com embeds mileage data in JavaScript:
 *   let dataMileage = [14128,18687,...];     ← newest first (MOT #1 = most recent)
 *   let dataMileageDate = ['12/05/2008',...]; ← only first 5 entries
 *
 * MOT blocks in HTML are:
 *   MOT #1
 *   MOT test number:  Result:
 *                          Pass
 *   Advice Nearside Rear Brake hose slightly deteriorated ...
 */
function extractMotHistory(body) {
  // ── 1. JS mileage arrays ─────────────────────────────────────────────────
  // dataMileage array is ordered: index 0 = oldest MOT (MOT #1), index N = newest
  let jsMileage = [];
  const mileageArrMatch = body.match(/let\s+dataMileage\s*=\s*\[([^\]]+)\]/i);
  if (mileageArrMatch) {
    jsMileage = mileageArrMatch[1].split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
  }

  let jsMileageDates = [];
  const mileageDateMatch = body.match(/let\s+dataMileageDate\s*=\s*\[([^\]]+)\]/i);
  if (mileageDateMatch) {
    const dateStr = mileageDateMatch[1];
    for (const m of dateStr.matchAll(/'([^']+)'/g)) {
      jsMileageDates.push(m[1]);
    }
  }

  // Interpolation: infer dates for entries beyond the 5 we have
  // Use the average interval from the first two dates
  let dateInterval = 365 * 24 * 3600 * 1000; // 1 year default
  if (jsMileageDates.length >= 2) {
    const [d1, d2] = [jsMileageDates[0], jsMileageDates[1]].map(s => {
      const [dd, mm, yy] = s.split('/').map(Number);
      return new Date(yy > 50 ? yy : 2000 + yy, mm - 1, dd);
    });
    dateInterval = d2.getTime() - d1.getTime();
  }

  function interpolateDate(idx) {
    if (idx < jsMileageDates.length) return jsMileageDates[idx];
    // Use d0 + interval * idx
    const [dd, mm, yy] = jsMileageDates[0].split('/').map(Number);
    const d0 = new Date(yy > 50 ? yy : 2000 + yy, mm - 1, dd);
    const target = new Date(d0.getTime() + dateInterval * idx);
    return `${String(target.getDate()).padStart(2,'0')}/${String(target.getMonth()+1).padStart(2,'0')}/${target.getFullYear()}`;
  }

  // ── 2. Parse MOT HTML blocks ─────────────────────────────────────────────
  const entries = [];
  const motBlocks = body.split(/(?=MOT #\d)/i);

  for (const block of motBlocks) {
    if (!/MOT #\d/i.test(block)) continue;

    const numMatch = block.match(/MOT #(\d+)/i);
    if (!numMatch) continue;
    const testNumber = numMatch[1];
    const idx = parseInt(testNumber, 10) - 1;

    // Date: use JS date array (index maps to MOT test number - 1)
    const date = interpolateDate(idx);

    // Result: look for Pass/Fail near "Result:" in this block
    let result = 'Unknown';
    const resultRe = /Result:[^\n]*\n\s*(\w+)/i;
    const resultMatch = block.match(resultRe);
    if (resultMatch) {
      const r = resultMatch[1].trim().toLowerCase();
      result = (r === 'pass' || r === 'passed') ? 'Pass' : (r === 'fail' || r === 'failed') ? 'Fail' : r;
    } else if (/\bPass\b/.test(block) && !/\bFail\b/.test(block)) {
      result = 'Pass';
    } else if (/\bFail\b/.test(block)) {
      result = 'Fail';
    }

    // Mileage: use jsMileage array — index 0 = MOT #1 (oldest), so idx = testNumber-1
    let mileage = '';
    if (idx < jsMileage.length) {
      mileage = jsMileage[idx].toString();
    } else {
      const milRe = /(\d{5,6})\s*miles?/i;
      const milMatch = block.match(milRe);
      if (milMatch) mileage = milMatch[1];
    }

    // Test centre
    let testCentre = '';
    const tcRe = /(?:Test\s+centre|Centre|Location)[\s\:]+([^\n<]{3,50})/i;
    const tcMatch = block.match(tcRe);
    if (tcMatch) testCentre = tcMatch[1].trim();

    // Advisories: split by "Advice" (keep separator), skip empty
    const advisories = [];
    for (const chunk of block.split(/\s*Advice\s+/i)) {
      let txt = chunk.trim();
      if (!txt || txt.length < 4) continue;
      // Stop at next MOT #, Result:, or Failure:
      const stopRe = /MOT #\d|Result:|Failure:/i;
      const stopIdx = txt.search(stopRe);
      if (stopIdx !== -1) txt = txt.slice(0, stopIdx);
      // Strip regulation codes: (5.3.1 (b) (i))
      txt = txt.replace(/\(\d+\.\d+\.\d+\s*\([a-z]\)\s*\([i]+\)\)/gi, '')
               .replace(/\(\d+\.\d+\.\d+\s*\([a-z]\)/gi, '')
               .replace(/\s+/g, ' ')
               .trim();
      if (txt.length > 4) advisories.push(txt.slice(0, 200));
    }

    // Failure items (these also appear in the advisory list with [FAIL] prefix)
    const failures = [];
    for (const chunk of block.split(/\s*Failure\s+/i)) {
      let txt = chunk.trim();
      if (!txt || txt.length < 4) continue;
      const stopIdx = txt.search(/MOT #\d|Result:|Advice:/i);
      if (stopIdx !== -1) txt = txt.slice(0, stopIdx);
      txt = txt.replace(/\s+/g, ' ').trim();
      if (txt.length > 4) failures.push('[FAIL] ' + txt.slice(0, 200));
    }

    const allItems = [...failures, ...advisories];

    entries.push({ testNumber, date, result, mileage, testCentre, advisories: allItems });
  }

  // Sort descending by test number (newest first)
  entries.sort((a, b) => parseInt(b.testNumber) - parseInt(a.testNumber));

  // jsMileage array is index 0 = oldest, so reverse for newest-first timeline
  // dataMileage[0] = oldest MOT, so reversing gives newest-first for display
// dataMileage[0] = oldest MOT; reversing gives newest-first for display
const mileageTimeline = [...jsMileage].reverse();

  return { entries, mileageTimeline, mileageDates: jsMileageDates };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 4: ADVISORY COST ESTIMATOR
// ═══════════════════════════════════════════════════════════════════════════════

const ADVISORY_DB = [
  // Tyres
  { kw: ['tyre worn close to legal limit','tyres worn close to legal limit'], item: 'Tyre(s) worn close to legal limit', severity: 'medium', cost: [90, 155], labour: 0.5, notes: '£80-140 per tyre + £10-15 fitting.' },
  { kw: ['tyre worn on edge','tyres worn on edge','tyres below legal limit','tyre below legal limit','tyres worn below legal','tyre worn below legal'], item: 'Tyre(s) worn below legal limit', severity: 'critical', cost: [90, 200], labour: 0.5, notes: 'ILLEGAL. Do not drive. £80-140 per tyre.' },
  { kw: ['perishing','perished','all 4 tyre','all four tyre','cracks in all 4 tyre','all tyres perishing'], item: 'Tyres perishing / cracking', severity: 'medium', cost: [40, 200], labour: 0.5, notes: 'Monitor — not illegal yet but will fail MOT soon. £80-140 per tyre.' },
  { kw: ['road wheel with a slightly distorted','wheel with a slightly distorted','wheel rim buckled','alloy wheel damaged'], item: 'Wheel rim damaged', severity: 'low', cost: [0, 200], labour: 0.5, notes: 'Tyre change ~£30-80. Alloy repair £80-200.' },
  { kw: ['light cracking o/s/f tyre','light cracking o/s/r tyre','light cracking to o/s tyres','light cracking o/s tyres'], item: 'Tyre slight cracking (advisory)', severity: 'low', cost: [0, 150], labour: 0.25, notes: 'Monitor closely. Advisory item.' },
  // Suspension
  { kw: ['coil spring fractured','coil spring broken','coil spring split'], item: 'Coil spring fractured/broken', severity: 'critical', cost: [250, 600], labour: 2.5, notes: '£150-400 per spring + £100-200 labour + wheel alignment.' },
  { kw: ['coil spring corroded'], item: 'Coil spring corroded', severity: 'medium', cost: [80, 300], labour: 1.5, notes: 'Corrosion — monitor for spread. £50-150 per spring + £80-120 labour.' },
  { kw: ['shock absorber leaking','damper leaking','strut mount deteriorated','top mount failure'], item: 'Shock absorber / strut leaking', severity: 'high', cost: [150, 400], labour: 1.5, notes: '£80-200 per corner + £50-100 labour. Degraded handling.' },
  { kw: ['suspension arm corroded','track control arm corroded','lower arm corroded'], item: 'Suspension arm corroded', severity: 'medium', cost: [100, 300], labour: 1.5, notes: '£50-150 per arm + £80-150 labour.' },
  { kw: ['trailing arm rubber bush deteriorated','sub-frame pin or bush worn','sub frame pin or bush worn'], item: 'Subframe / trailing arm bush worn', severity: 'medium', cost: [100, 350], labour: 1.5, notes: '£50-150 per bush + £80-150 labour. Structural.' },
  { kw: ['anti-roll bar link','drop link worn','sway bar link worn','anti roll bar link worn'], item: 'Anti-roll bar drop link worn', severity: 'high', cost: [50, 150], labour: 1.0, notes: '£25-70 per link + £40-80 labour.' },
  // Brakes
  { kw: ['brake pipe slightly corroded','brake pipe corroded','brake pipes corroded'], item: 'Brake pipe corroded', severity: 'high', cost: [100, 250], labour: 1.5, notes: '£60-150 for pipe + £80-120 labour. Can spread fast.' },
  { kw: ['brake hose slightly deteriorated','brake hose deteriorated','brake hose slightly damaged','brake hose corroded','brake hose perished','flexible brake hose perished'], item: 'Brake hose deteriorated/perished', severity: 'medium', cost: [60, 140], labour: 1.0, notes: '£30-60 per hose + £50-80 labour. Replace in pairs.' },
  { kw: ['brake cable damaged','handbrake cable damaged','parking brake cable damaged'], item: 'Brake cable damaged', severity: 'medium', cost: [60, 140], labour: 1.0, notes: '£30-60 per cable + £50-80 labour.' },
  { kw: ['brake pad worn','brake pads worn','front brake pads worn','rear brake pads worn','brake pad excessive wear'], item: 'Brake pad(s) worn', severity: 'high', cost: [80, 200], labour: 1.0, notes: '£40-80 per pad + £40-60 labour per axle. Replace in pairs.' },
  { kw: ['brake disc worn','brake discs worn','brake disc in poor condition','brake disc scored'], item: 'Brake disc worn / scored', severity: 'high', cost: [100, 250], labour: 1.5, notes: '£60-120 per disc + £40-60 labour. Replace with pads.' },
  { kw: ['abs sensor defective','abs warning light','anti-lock brake system warning'], item: 'ABS sensor defective', severity: 'medium', cost: [100, 250], labour: 1.0, notes: '£60-150 for sensor + £50-100 labour.' },
  // Steering
  { kw: ['steering rack gaiter damaged','steering rack gaiter split','rack gaiter perished'], item: 'Steering rack gaiter split', severity: 'high', cost: [100, 250], labour: 1.5, notes: '£60-150 for gaiter + £80-120 labour. If ignored → rack £400-800.' },
  { kw: ['track rod end worn','steering linkage worn','steering ball joint worn','tie rod end worn'], item: 'Steering ball joint / track rod end worn', severity: 'critical', cost: [100, 250], labour: 1.5, notes: '£50-120 per joint + £80-120 labour. Dangerous.' },
  // Engine / Emissions
  { kw: ['exhaust emitting excessive smoke','exhaust smokes on tickover','engine emitting blue smoke','engine emitting white smoke'], item: 'Engine smoking (blue/white)', severity: 'high', cost: [200, 1200], labour: 4.0, notes: 'Blue=oil burn £400-1200. White=coolant/head gasket £300-800.' },
  { kw: ['catalytic converter defective','cat removed','exhaust catalytic converter below threshold'], item: 'Catalytic converter defective', severity: 'high', cost: [300, 1200], labour: 2.0, notes: '£300-800 for pattern part + £100-200 fitting.' },
  { kw: ['dpf warning','dpf blocked','dpf regeneration required','dpf fault','diesel particulate filter warning'], item: 'DPF warning / blocked', severity: 'high', cost: [200, 1500], labour: 3.0, notes: '£150-400 forced regen + £800-1500 replacement.' },
  { kw: ['emissions exceed limit','lambda sensor defective','lambda sensor malfunction','air fuel ratio sensor defective','o2 sensor defective'], item: 'Emissions sensor / lambda defective', severity: 'medium', cost: [150, 400], labour: 1.5, notes: '£80-250 for sensor + £80-150 labour.' },
  { kw: ['engine oil level low','oil warning light','oil consumption excessive'], item: 'Engine oil level low / consuming', severity: 'high', cost: [50, 300], labour: 0.5, notes: '£30-50 for top-up + diagnosis.' },
  // Body / Structural
  { kw: ['sub-frame corroded','subframe corroded','chassis corroded','floor pan corroded','underbody corroded'], item: 'Sub-frame / chassis corroded', severity: 'high', cost: [200, 1000], labour: 4.0, notes: '£150-600 for welding + £100-400 labour. Structural.' },
  { kw: ['corrosion to underside','surface corrosion','general corrosion','corrosion to suspension','corrosion to body'], item: 'Generalised corrosion / rust', severity: 'medium', cost: [50, 500], labour: 2.0, notes: '£50-300 for treatment + £50-200 for underseal.' },
  { kw: ['exhaust corroded','exhaust leaking','exhaust system leaking'], item: 'Exhaust system corroded/leaking', severity: 'medium', cost: [80, 400], labour: 1.0, notes: '£50-200 for section + £50-100 fitting.' },
  // Lights
  { kw: ['headlamp lens slightly defective','headlamp lens cracked','headlamp lens deteriorated','dipped beam headlamp defective','main beam headlamp defective','headlight not working','headlamp aim'], item: 'Headlamp lens defective / aim', severity: 'low', cost: [0, 100], labour: 0.25, notes: '£0-30 for bulb/connector. £30-60 for lens unit.' },
  { kw: ['rear registration plate lamp defective','number plate lamp not working','license plate lamp defective'], item: 'Number plate lamp defective', severity: 'low', cost: [0, 30], labour: 0.25, notes: '£5-15 bulb. MOT fail item.' },
  { kw: ['stop lamp defective','brake light not working','stop light defective','rear lamp not working'], item: 'Brake / stop lamp defective', severity: 'high', cost: [0, 60], labour: 0.25, notes: '£5-20 bulb/connector. MOT fail + safety hazard.' },
  // Windscreen / Wipers
  { kw: ['windscreen wiper does not clear','windscreen wiper not working','wiper does not clear','windscreen wiper deteriorated','washer inop','washers not working','front washers very weak','rear washer inop'], item: 'Windscreen wiper / washer defect', severity: 'medium', cost: [0, 100], labour: 0.5, notes: 'Wiper blades £10-40. Washer pump £15-30.' },
  { kw: ['windscreen chipped','windscreen cracked','screen cracked'], item: 'Windscreen cracked / chipped', severity: 'medium', cost: [0, 300], labour: 1.0, notes: 'Chip repair £40-60. Full windscreen £200-300.' },
  { kw: ['fuel cap seal deteriorated','fuel cap seal missing','fuel cap not secured'], item: 'Fuel cap seal defective', severity: 'low', cost: [0, 40], labour: 0.1, notes: '£10-30 for cap. Check engine light if not fixed.' },
  // Wheels
  { kw: ['wheel bearing noisy','wheel bearing excessive play','wheel bearing worn'], item: 'Wheel bearing worn / noisy', severity: 'medium', cost: [80, 250], labour: 1.5, notes: '£50-150 per bearing + £80-100 labour.' },
  // Other
  { kw: ['seat belt damaged','seat belt not working correctly','seat belt tensioner defective','seat belt webbing frayed'], item: 'Seat belt defective', severity: 'critical', cost: [100, 500], labour: 2.0, notes: '£100-400 for belt assembly + £100-150 labour.' },
  { kw: ['engine mount deteriorated','engine mount broken','torque mount broken','engine support mount failed'], item: 'Engine mount / torque arm deteriorated', severity: 'medium', cost: [100, 350], labour: 2.0, notes: '£80-200 per mount + £100-150 labour.' },
  { kw: ['clutch slipping','clutch wear','clutch judder','clutch biting point high'], item: 'Clutch slipping / worn', severity: 'high', cost: [400, 900], labour: 4.0, notes: '£350-700 for clutch set + £150-250 labour.' },
  { kw: ['gearbox oil leaking','gearbox leak','transmission housing leak'], item: 'Gearbox / transmission leak', severity: 'medium', cost: [50, 400], labour: 2.0, notes: '£50-150 for gasket/seal + £100-200 labour.' },
  { kw: ['driveshaft gaiter split','cv boot split','constant velocity joint boot split'], item: 'CV / driveshaft boot split', severity: 'high', cost: [80, 300], labour: 2.0, notes: '£60-150 for boot + £80-150 labour.' },
  { kw: ['water pump leaking','coolant leak from water pump','engine cooling system leak'], item: 'Coolant / water pump leak', severity: 'high', cost: [100, 500], labour: 2.5, notes: '£80-250 for pump + £100-200 labour.' },
  { kw: ['radiator leaking','cooling fan not working','thermostat not working'], item: 'Cooling system fault', severity: 'high', cost: [80, 400], labour: 1.5, notes: 'Thermostat £30-80 + £60-100 labour. Radiator £150-300 + £80-120 labour.' },
  { kw: ['steering column lock engaged','steering lock malfunction','steering lock not releasing'], item: 'Steering lock fault', severity: 'critical', cost: [100, 400], labour: 1.0, notes: '£80-300 for column lock unit + £80-150 labour.' },
  { kw: ['inhibitor switch defective','gear selector not working','automatic transmission fault'], item: 'Gear selector / inhibitor switch', severity: 'medium', cost: [80, 300], labour: 1.5, notes: '£60-200 for switch + £80-120 labour.' },
  { kw: ['high mileage indicator','mileage discrepancy','mileage inconsistent','odometer reading unreliable'], item: 'Mileage discrepancy / clock concern', severity: 'critical', cost: [0, 0], labour: 0, notes: 'HPI check strongly recommended. Potential clocking — walk away or heavily discount.' },
  { kw: ['hybrid system warning','high voltage system fault','hybrid battery degraded'], item: 'Hybrid battery / system fault', severity: 'critical', cost: [500, 4000], labour: 4.0, notes: 'Hybrid battery replacement £1500-4000.' },
];

function classifyAdvisory(rawText) {
  const lower = rawText.toLowerCase();
  // Strip regulation codes
  const normalised = lower.replace(/\(\d+\.\d+\.\d+\s*\([a-z]\)\s*\([i]+\)\)/gi, '')
                           .replace(/\(\d+\.\d+\.\d+\s*\([a-z]\)/gi, '')
                           .replace(/\s+/g, ' ')
                           .trim();

  const isFailure = rawText.startsWith('[FAIL]');

  let best = null;
  let bestScore = 0;

  for (const entry of ADVISORY_DB) {
    for (const kw of entry.kw) {
      const idx = normalised.indexOf(kw);
      if (idx === -1) continue;
      // Longer keyword = better match; whole-word = bonus
      let score = kw.length;
      if (idx === 0 || /\s/.test(normalised[idx - 1])) {
        const after = idx + kw.length;
        if (after >= normalised.length || /\s\)\.,]/.test(normalised[after])) score += 5;
      }
      if (score > bestScore) { bestScore = score; best = entry; }
      break;
    }
  }

  if (!best) {
    return {
      item: rawText.slice(0, 120),
      severity: isFailure ? 'critical' : 'low',
      costMin: 0, costMax: 100,
      labourHours: 0,
      notes: 'Unclassified — manual review recommended.',
      isFailure,
    };
  }

  return {
    item: best.item,
    severity: isFailure ? 'critical' : best.severity,
    costMin: best.cost[0],
    costMax: best.cost[1],
    labourHours: best.labour,
    notes: best.notes,
    isFailure,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 5: VALUATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

const MARKET_DB = {
  'ford|mondeo':    { base_min: 700,  base_max: 1400, msrp_min: 18000, msrp_max: 26000, ins_min: 17, ins_max: 28, body: 'Saloon / Estate', fuels: ['Petrol', 'Diesel'] },
  'ford|focus':     { base_min: 800,  base_max: 1800, msrp_min: 14000, msrp_max: 22000, ins_min: 14, ins_max: 24, body: 'Hatchback / Estate', fuels: ['Petrol', 'Diesel'] },
  'ford|fiesta':    { base_min: 400,  base_max: 1100, msrp_min: 9000,  msrp_max: 16000, ins_min: 8,  ins_max: 16, body: 'Hatchback', fuels: ['Petrol'] },
  'ford|kuga':      { base_min: 1500, base_max: 3500, msrp_min: 20000, msrp_max: 32000, ins_min: 18, ins_max: 28, body: 'SUV / Crossover', fuels: ['Petrol', 'Diesel'] },
  'ford|transit':   { base_min: 2000, base_max: 6000, msrp_min: 25000, msrp_max: 40000, ins_min: 20, ins_max: 35, body: 'Van', fuels: ['Diesel'] },
  'ford|puma':      { base_min: 1000, base_max: 2500, msrp_min: 18000, msrp_max: 28000, ins_min: 14, ins_max: 22, body: 'SUV / Crossover', fuels: ['Petrol', 'Hybrid'] },
  'ford|s-max':     { base_min: 1200, base_max: 3000, msrp_min: 22000, msrp_max: 34000, ins_min: 18, ins_max: 28, body: 'MPV', fuels: ['Petrol', 'Diesel'] },
  'vauxhall|corsa': { base_min: 400,  base_max: 1100, msrp_min: 10000, msrp_max: 16000, ins_min: 8,  ins_max: 16, body: 'Hatchback', fuels: ['Petrol', 'Diesel'] },
  'vauxhall|astra': { base_min: 500,  base_max: 1400, msrp_min: 13000, msrp_max: 20000, ins_min: 14, ins_max: 22, body: 'Hatchback / Estate', fuels: ['Petrol', 'Diesel'] },
  'vauxhall|insignia': { base_min: 800, base_max: 2000, msrp_min: 18000, msrp_max: 26000, ins_min: 18, ins_max: 30, body: 'Saloon / Estate', fuels: ['Petrol', 'Diesel'] },
  'vauxhall|crossland': { base_min: 600, base_max: 1600, msrp_min: 16000, msrp_max: 25000, ins_min: 12, ins_max: 20, body: 'SUV / Crossover', fuels: ['Petrol', 'Diesel'] },
  'vw|golf':        { base_min: 1500, base_max: 4000, msrp_min: 16000, msrp_max: 26000, ins_min: 18, ins_max: 30, body: 'Hatchback', fuels: ['Petrol', 'Diesel', 'Hybrid'] },
  'vw|polo':        { base_min: 800,  base_max: 2200, msrp_min: 11000, msrp_max: 18000, ins_min: 12, ins_max: 20, body: 'Hatchback', fuels: ['Petrol'] },
  'vw|passat':      { base_min: 1200, base_max: 3200, msrp_min: 20000, msrp_max: 30000, ins_min: 22, ins_max: 34, body: 'Saloon / Estate', fuels: ['Petrol', 'Diesel'] },
  'vw|tiguan':      { base_min: 2000, base_max: 5000, msrp_min: 24000, msrp_max: 36000, ins_min: 20, ins_max: 32, body: 'SUV', fuels: ['Petrol', 'Diesel'] },
  'vw|t-roc':       { base_min: 1800, base_max: 4500, msrp_min: 20000, msrp_max: 32000, ins_min: 18, ins_max: 28, body: 'SUV / Crossover', fuels: ['Petrol', 'Diesel'] },
  'vw|up':          { base_min: 400,  base_max: 1000, msrp_min: 9000,  msrp_max: 14000, ins_min: 6,  ins_max: 12, body: 'Hatchback', fuels: ['Petrol', 'Electric'] },
  'vw| Arteon':     { base_min: 2000, base_max: 5500, msrp_min: 30000, msrp_max: 45000, ins_min: 24, ins_max: 36, body: 'Saloon / Shooting Brake', fuels: ['Petrol', 'Diesel', 'Hybrid'] },
  'bmw|3 series':   { base_min: 2000, base_max: 6000, msrp_min: 24000, msrp_max: 40000, ins_min: 28, ins_max: 42, body: 'Saloon / Estate', fuels: ['Petrol', 'Diesel'] },
  'bmw|1 series':   { base_min: 1500, base_max: 5000, msrp_min: 18000, msrp_max: 32000, ins_min: 22, ins_max: 34, body: 'Hatchback', fuels: ['Petrol', 'Diesel'] },
  'bmw|5 series':   { base_min: 3000, base_max: 8000, msrp_min: 35000, msrp_max: 55000, ins_min: 32, ins_max: 46, body: 'Saloon', fuels: ['Petrol', 'Diesel'] },
  'audi|a3':        { base_min: 1500, base_max: 4500, msrp_min: 20000, msrp_max: 32000, ins_min: 22, ins_max: 34, body: 'Hatchback / Saloon', fuels: ['Petrol', 'Diesel'] },
  'audi|a4':        { base_min: 1800, base_max: 5000, msrp_min: 24000, msrp_max: 38000, ins_min: 26, ins_max: 38, body: 'Saloon / Avant', fuels: ['Petrol', 'Diesel'] },
  'audi|q3':        { base_min: 2000, base_max: 5500, msrp_min: 28000, msrp_max: 42000, ins_min: 24, ins_max: 36, body: 'SUV', fuels: ['Petrol', 'Diesel'] },
  'audi|q5':        { base_min: 2500, base_max: 7000, msrp_min: 35000, msrp_max: 50000, ins_min: 28, ins_max: 40, body: 'SUV', fuels: ['Petrol', 'Diesel', 'Hybrid'] },
  'toyota|yaris':   { base_min: 800,  base_max: 2200, msrp_min: 12000, msrp_max: 20000, ins_min: 8,  ins_max: 16, body: 'Hatchback', fuels: ['Petrol', 'Hybrid'] },
  'toyota|corolla': { base_min: 1000, base_max: 2800, msrp_min: 16000, msrp_max: 26000, ins_min: 14, ins_max: 22, body: 'Hatchback / Saloon / Estate', fuels: ['Petrol', 'Hybrid'] },
  'toyota|c-hr':    { base_min: 1500, base_max: 4000, msrp_min: 20000, msrp_max: 32000, ins_min: 16, ins_max: 26, body: 'SUV / Crossover', fuels: ['Hybrid', 'Petrol'] },
  'toyota|rav4':    { base_min: 1800, base_max: 5000, msrp_min: 24000, msrp_max: 36000, ins_min: 18, ins_max: 28, body: 'SUV', fuels: ['Petrol', 'Hybrid'] },
  'toyota|prius':   { base_min: 1000, base_max: 3000, msrp_min: 18000, msrp_max: 28000, ins_min: 14, ins_max: 22, body: 'Hatchback / Saloon', fuels: ['Hybrid'] },
  'honda|civic':    { base_min: 800,  base_max: 2200, msrp_min: 15000, msrp_max: 24000, ins_min: 14, ins_max: 24, body: 'Hatchback / Saloon', fuels: ['Petrol', 'Hybrid'] },
  'honda|cr-v':     { base_min: 1500, base_max: 4000, msrp_min: 22000, msrp_max: 34000, ins_min: 18, ins_max: 28, body: 'SUV', fuels: ['Petrol', 'Hybrid'] },
  'honda|hr-v':     { base_min: 1000, base_max: 2800, msrp_min: 18000, msrp_max: 28000, ins_min: 14, ins_max: 22, body: 'SUV / Crossover', fuels: ['Petrol', 'Hybrid'] },
  'nissan|qashqai': { base_min: 1500, base_max: 4000, msrp_min: 18000, msrp_max: 30000, ins_min: 14, ins_max: 24, body: 'SUV / Crossover', fuels: ['Petrol', 'Diesel', 'Hybrid'] },
  'nissan|juke':    { base_min: 800,  base_max: 2200, msrp_min: 14000, msrp_max: 22000, ins_min: 12, ins_max: 20, body: 'SUV / Crossover', fuels: ['Petrol'] },
  'nissan|leaf':    { base_min: 1500, base_max: 4000, msrp_min: 22000, msrp_max: 30000, ins_min: 16, ins_max: 24, body: 'Hatchback', fuels: ['Electric'] },
  'hyundai|tucson': { base_min: 1500, base_max: 4500, msrp_min: 20000, msrp_max: 32000, ins_min: 16, ins_max: 26, body: 'SUV', fuels: ['Petrol', 'Hybrid', 'Diesel'] },
  'hyundai|i30':    { base_min: 1000, base_max: 2800, msrp_min: 15000, msrp_max: 24000, ins_min: 14, ins_max: 22, body: 'Hatchback', fuels: ['Petrol', 'Hybrid'] },
  'hyundai|sonata': { base_min: 1200, base_max: 3000, msrp_min: 22000, msrp_max: 34000, ins_min: 16, ins_max: 26, body: 'Saloon', fuels: ['Petrol', 'Hybrid'] },
  'kia|sportage':   { base_min: 1500, base_max: 4500, msrp_min: 20000, msrp_max: 32000, ins_min: 16, ins_max: 26, body: 'SUV', fuels: ['Petrol', 'Diesel', 'Hybrid'] },
  'kia|niro':       { base_min: 1200, base_max: 3500, msrp_min: 20000, msrp_max: 30000, ins_min: 14, ins_max: 24, body: 'SUV / Crossover', fuels: ['Hybrid', 'Electric'] },
  'kia|ceed':       { base_min: 800,  base_max: 2000, msrp_min: 15000, msrp_max: 24000, ins_min: 14, ins_max: 22, body: 'Hatchback / Estate', fuels: ['Petrol', 'Diesel', 'Hybrid'] },
  'renault|clio':   { base_min: 400,  base_max: 1100, msrp_min: 9000,  msrp_max: 16000, ins_min: 8,  ins_max: 14, body: 'Hatchback', fuels: ['Petrol', 'Hybrid'] },
  'renault|megane': { base_min: 500,  base_max: 1400, msrp_min: 13000, msrp_max: 21000, ins_min: 14, ins_max: 22, body: 'Hatchback / Estate', fuels: ['Petrol', 'Diesel'] },
  'renault|captur': { base_min: 600,  base_max: 1600, msrp_min: 14000, msrp_max: 22000, ins_min: 12, ins_max: 20, body: 'SUV / Crossover', fuels: ['Petrol', 'Hybrid'] },
  'peugeot|208':    { base_min: 400,  base_max: 1100, msrp_min: 11000, msrp_max: 18000, ins_min: 8,  ins_max: 16, body: 'Hatchback', fuels: ['Petrol', 'Electric'] },
  'peugeot|308':    { base_min: 600,  base_max: 1600, msrp_min: 14000, msrp_max: 22000, ins_min: 12, ins_max: 20, body: 'Hatchback / Estate', fuels: ['Petrol', 'Diesel', 'Hybrid'] },
  'peugeot|2008':   { base_min: 600,  base_max: 1600, msrp_min: 14000, msrp_max: 22000, ins_min: 10, ins_max: 18, body: 'SUV / Crossover', fuels: ['Petrol', 'Electric'] },
  'peugeot|3008':   { base_min: 1000, base_max: 3000, msrp_min: 20000, msrp_max: 32000, ins_min: 14, ins_max: 22, body: 'SUV / Crossover', fuels: ['Petrol', 'Diesel', 'Hybrid'] },
  'mercedes|c class': { base_min: 2000, base_max: 6000, msrp_min: 28000, msrp_max: 45000, ins_min: 28, ins_max: 44, body: 'Saloon / Estate', fuels: ['Petrol', 'Diesel', 'Hybrid'] },
  'mercedes|a class': { base_min: 1500, base_max: 5000, msrp_min: 22000, msrp_max: 36000, ins_min: 22, ins_max: 36, body: 'Hatchback / Saloon', fuels: ['Petrol', 'Diesel'] },
  'skoda|octavia':  { base_min: 1000, base_max: 2800, msrp_min: 16000, msrp_max: 26000, ins_min: 16, ins_max: 26, body: 'Hatchback / Estate', fuels: ['Petrol', 'Diesel', 'Hybrid'] },
  'skoda|fabia':    { base_min: 400,  base_max: 1200, msrp_min: 10000, msrp_max: 18000, ins_min: 8,  ins_max: 16, body: 'Hatchback', fuels: ['Petrol'] },
  'skoda|kodiaq':   { base_min: 1800, base_max: 5000, msrp_min: 24000, msrp_max: 36000, ins_min: 20, ins_max: 30, body: 'SUV', fuels: ['Petrol', 'Diesel'] },
  'skoda|karoq':    { base_min: 1500, base_max: 4500, msrp_min: 22000, msrp_max: 34000, ins_min: 18, ins_max: 28, body: 'SUV', fuels: ['Petrol', 'Diesel'] },
  'land rover|range rover': { base_min: 3000, base_max: 12000, msrp_min: 60000, msrp_max: 120000, ins_min: 40, ins_max: 50, body: 'SUV / Luxury', fuels: ['Diesel', 'Hybrid', 'Petrol'] },
  'land rover|discovery':   { base_min: 2500, base_max: 10000, msrp_min: 45000, msrp_max: 80000, ins_min: 36, ins_max: 48, body: 'SUV', fuels: ['Diesel', 'Hybrid', 'Petrol'] },
  'land rover|defender':    { base_min: 3000, base_max: 15000, msrp_min: 40000, msrp_max: 70000, ins_min: 34, ins_max: 50, body: 'SUV / Pickup', fuels: ['Diesel', 'Hybrid', 'Petrol'] },
  'jaguar|xe':      { base_min: 1800, base_max: 5500, msrp_min: 28000, msrp_max: 42000, ins_min: 28, ins_max: 42, body: 'Saloon', fuels: ['Petrol', 'Diesel'] },
  'jaguar|f-pace':  { base_min: 2500, base_max: 8000, msrp_min: 40000, msrp_max: 65000, ins_min: 34, ins_max: 48, body: 'SUV', fuels: ['Petrol', 'Diesel'] },
  'mazda|3':        { base_min: 800,  base_max: 2200, msrp_min: 15000, msrp_max: 24000, ins_min: 14, ins_max: 22, body: 'Hatchback / Saloon', fuels: ['Petrol', 'Hybrid'] },
  'mazda|cx-5':     { base_min: 1500, base_max: 4000, msrp_min: 22000, msrp_max: 34000, ins_min: 16, ins_max: 26, body: 'SUV', fuels: ['Petrol'] },
  'volvo|xc40':     { base_min: 2000, base_max: 5500, msrp_min: 30000, msrp_max: 45000, ins_min: 24, ins_max: 36, body: 'SUV / Crossover', fuels: ['Petrol', 'Hybrid', 'Electric'] },
  'volvo|xc60':     { base_min: 2500, base_max: 7000, msrp_min: 38000, msrp_max: 55000, ins_min: 28, ins_max: 40, body: 'SUV', fuels: ['Petrol', 'Diesel', 'Hybrid'] },
  'volvo|s60':      { base_min: 1500, base_max: 4500, msrp_min: 28000, msrp_max: 42000, ins_min: 24, ins_max: 36, body: 'Saloon', fuels: ['Petrol', 'Hybrid'] },
  'seat|leon':      { base_min: 600,  base_max: 1800, msrp_min: 14000, msrp_max: 22000, ins_min: 14, ins_max: 22, body: 'Hatchback / Estate', fuels: ['Petrol', 'Diesel'] },
  'seat|ateca':     { base_min: 1200, base_max: 3000, msrp_min: 18000, msrp_max: 28000, ins_min: 16, ins_max: 26, body: 'SUV', fuels: ['Petrol', 'Diesel'] },
  'seat|arona':     { base_min: 600,  base_max: 1800, msrp_min: 14000, msrp_max: 22000, ins_min: 12, ins_max: 20, body: 'SUV / Crossover', fuels: ['Petrol'] },
};

function lookupMarketData(make, model) {
  if (!make) return null;
  const ml = make.toLowerCase();
  const mol = model ? model.toLowerCase() : '';
  for (const pattern of Object.keys(MARKET_DB)) {
    const [m, mo] = pattern.split('|');
    if (ml.includes(m) && (!mo || mol.includes(mo))) {
      return { pattern, ...MARKET_DB[pattern] };
    }
  }
  return null;
}

function estimateValue(make, model, year, mileage, fuelType, condition, marketData) {
  const age = new Date().getFullYear() - (year || 2005);
  const md = marketData;
  const baseMin = md?.base_min || 600;
  const baseMax = md?.base_max || 1800;
  const msrpMin = md?.msrp_min || 10000;
  const msrpMax = md?.msrp_max || 20000;

  // Depreciation: aggressive first year, then ~10% per year until 5, ~8% until 10, ~5% after
  let deprRate;
  if (age <= 1) deprRate = 0.82;
  else if (age <= 5) deprRate = 0.82 * Math.pow(0.90, age - 1);
  else if (age <= 10) deprRate = 0.82 * Math.pow(0.90, 4) * Math.pow(0.92, age - 5);
  else deprRate = 0.82 * Math.pow(0.90, 4) * Math.pow(0.92, 5) * Math.pow(0.95, age - 10);
  deprRate = Math.max(0.25, deprRate);

  let valMin = Math.round(baseMin * deprRate);
  let valMax = Math.round(baseMax * deprRate);

  // Mileage adjustment
  if (mileage) {
    const avgMiles = 10000;
    const expected = age * avgMiles;
    const diff = mileage - expected;
    if (diff > 50000)      { valMin = Math.round(valMin * 0.68); valMax = Math.round(valMax * 0.78); }
    else if (diff > 25000) { valMin = Math.round(valMin * 0.78); valMax = Math.round(valMax * 0.88); }
    else if (diff > 10000) { valMin = Math.round(valMin * 0.88); valMax = Math.round(valMax * 0.93); }
    else if (diff < -20000){ valMin = Math.round(valMin * 1.18); valMax = Math.round(valMax * 1.22); }
    else if (diff < 0)     { valMin = Math.round(valMin * 1.08); valMax = Math.round(valMax * 1.12); }
  }

  // Condition multipliers
  if (condition === 'poor')       { valMin = Math.round(valMin * 0.70); valMax = Math.round(valMax * 0.85); }
  else if (condition === 'fair')  { valMin = Math.round(valMin * 0.88); valMax = Math.round(valMax * 0.95); }
  else if (condition === 'good')  { valMin = Math.round(valMin * 1.10); valMax = Math.round(valMax * 1.18); }
  else if (condition === 'excellent') { valMin = Math.round(valMin * 1.20); valMax = Math.round(valMax * 1.28); }

  // Floor
  valMin = Math.max(valMin, age >= 15 ? 700 : age >= 10 ? 500 : 350);
  valMax = Math.max(valMax, valMin + 50);

  const deprPct = Math.min(99, Math.round((1 - valMax / msrpMax) * 100));

  return { min: valMin, max: valMax, deprPct, msrpMin, msrpMax, condition };
}

function estimateLifespan(year, advisoryCount, highCount, fuelType, mileage) {
  const age = new Date().getFullYear() - (year || 2005);
  const isDiesel = /diesel|dci|tdi|cdti/i.test(fuelType || '');
  let months;
  if (highCount >= 2) months = 6;
  else if (highCount >= 1) months = 12;
  else if (advisoryCount >= 8) months = 12;
  else if (isDiesel && age >= 15) months = 18;
  else if (age >= 18) months = 12;
  else if (age >= 12) months = 18;
  else if (age >= 8) months = 24;
  else months = 30;
  return months;
}

function generateValuation(make, model, year, mileage, fuelType, advisories, motFailures, marketData) {
  const hasCritical = advisories.some(a => a.severity === 'critical');
  const hasHigh = advisories.some(a => a.severity === 'high');
  const seriousCount = advisories.filter(a => a.severity === 'critical' || a.severity === 'high').length;
  const condition = hasCritical ? 'poor' : hasHigh ? 'fair' : 'good';
  const baseVal = estimateValue(make, model, year, mileage, fuelType, condition, marketData);

  const totalAdvCostMin = advisories.reduce((s, a) => s + a.costMin, 0);
  const totalAdvCostMax = advisories.reduce((s, a) => s + a.costMax, 0);
  const penaltyMin = Math.round(totalAdvCostMin * 0.75);
  const penaltyMax = Math.round(totalAdvCostMax * 0.75);
  const valWithAdvMin = Math.max(250, baseVal.min - penaltyMax);
  const valWithAdvMax = Math.max(350, baseVal.max - penaltyMin);

  const lifespanMonths = estimateLifespan(year, advisories.length, advisories.filter(a => a.severity === 'high').length, fuelType, mileage);

  let motFailRisk = 'low';
  if (seriousCount >= 3) motFailRisk = 'high';
  else if (seriousCount >= 1 || motFailures >= 2) motFailRisk = 'medium';

  let recommendation;
  if (hasCritical) {
    recommendation = `Critical issues found — do not buy at asking price. Walk away or negotiate minimum £${totalAdvCostMin.toLocaleString()} off. Serious safety concerns.`;
  } else if (totalAdvCostMax > baseVal.max * 0.5) {
    recommendation = `Repair costs (up to £${totalAdvCostMax.toLocaleString()}) exceed 50% of value. Negotiate hard or walk away.`;
  } else if (seriousCount >= 1) {
    recommendation = `High-severity advisories present. Negotiate at least £${totalAdvCostMin.toLocaleString()} off. Budget £${(totalAdvCostMin + 200).toLocaleString()}-£${(totalAdvCostMax + 400).toLocaleString()} total including MOT retest.`;
  } else {
    recommendation = `Advisories are manageable. Price accordingly — aim to save at least £${totalAdvCostMin.toLocaleString()} to cover repairs. Car is worth £${baseVal.min.toLocaleString()}-£${baseVal.max.toLocaleString()} as-is.`;
  }

  return {
    min: baseVal.min, max: baseVal.max,
    deprPct: baseVal.deprPct, msrpMin: baseVal.msrpMin, msrpMax: baseVal.msrpMax,
    valWithAdvMin, valWithAdvMax,
    totalAdvCostMin, totalAdvCostMax,
    lifespanMonths, motFailRisk, condition, recommendation,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 6: PLATE TYPE DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

function detectPlateType(plate) {
  const clean = plate.replace(/[\s\-]/g, '').toUpperCase();
  if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(clean)) return 'VIN';
  if (/^[A-Z]{2}\d{2}[A-Z]{3}$/.test(clean)) return 'UK';
  if (/^[A-Z]\d{1,3}[A-Z]{2,3}$/.test(clean)) return 'UK';
  if (/^[A-Z]{3}\d{1,3}[A-Z]{2}$/.test(clean)) return 'UK';
  if (/^[A-Z]{2}\d{2} [A-Z]{3}$/.test(clean)) return 'UK';
  if (/^[A-Z0-9]{3,8}$/i.test(clean)) return 'US';
  return 'UNKNOWN';
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 7: CAR-CHECKING COLLECTOR
// ═══════════════════════════════════════════════════════════════════════════════

async function collectCarCheck(plate) {
  const result = { findings: [], errors: [], rawData: {} };
  let browser;
  try {
    const { chromium } = await import('@playwright/test');
    browser = await chromium.launch({
      headless: true,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    });
    const ctx = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      extraHTTPHeaders: { 'Accept-Language': 'en-GB,en;q=0.9' },
    });
    const page = await ctx.newPage();
    page.on('dialog', async d => { try { await d.accept(); } catch {} });

    await page.goto('https://www.car-checking.com/', { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await page.waitForTimeout(3000);

    const regInput = page.locator('#subForm1');
    if (await regInput.count() === 0) {
      result.errors.push('car-checking.com: #subForm1 not found');
      return result;
    }

    await regInput.fill(plate);
    await page.waitForTimeout(500);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => {}),
      page.locator('button[type="submit"]').first().click(),
    ]);
    await page.waitForTimeout(8000);

    const bodyText = await page.textContent('body') || '';
    if (bodyText.length < 200) {
      await page.waitForTimeout(5000);
    }
    const finalText = await page.textContent('body') || '';
    result.rawData.raw_text = finalText.substring(0, 25000);

    if (!/your report is ready|car report is ready/i.test(finalText)) {
      result.errors.push('car-checking.com: report not ready');
      return result;
    }

    // ── Spec fields via zone extractor ──────────────────────────────────────
    const spec = parseSpecSection(finalText);
    const n = (s) => s ? s.trim().replace(/\s+/g, ' ') : '';

    const fieldMap = [
      ['make', 'make'], ['model', 'model'], ['colour', 'colour'],
      ['year', 'year'], ['top_speed', 'top_speed'], ['zero_to_60', 'zero_to_60'],
      ['gearbox', 'gearbox'], ['fuel_type', 'fuel_type'],
      ['engine_capacity', 'engine_capacity'], ['cylinders', 'cylinders'],
      ['power_bhp', 'power_bhp'], ['torque_rpm', 'torque_rpm'],
      ['consumption_combined', 'consumption_combined'],
      ['consumption_city', 'consumption_city'],
      ['consumption_extra_urban', 'consumption_extra_urban'],
      ['co2_gkm', 'co2_gkm'], ['co2_label', 'co2_label'],
    ];
    for (const [specKey, fieldName] of fieldMap) {
      if (spec[specKey]) {
        result.rawData[fieldName] = n(spec[specKey]);
        result.findings.push({ source: 'car-checking.com', field: fieldName, value: n(spec[specKey]).slice(0, 80), confidence: 95 });
      }
    }

    // VIN
    const vinMatch = finalText.match(/\b([A-HJ-NPR-Z0-9]{17})\b/i);
    if (vinMatch) {
      result.rawData.vin = vinMatch[1].toUpperCase();
      result.findings.push({ source: 'car-checking.com', field: 'vin', value: vinMatch[1].toUpperCase(), confidence: 95 });
    }

    // MOT summary
    const motExpiryMatch = finalText.match(/MOT expiry date[\s\S]{0,200}?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    if (motExpiryMatch) {
      result.rawData.mot_expiry = motExpiryMatch[1];
      result.findings.push({ source: 'car-checking.com', field: 'mot_expiry', value: motExpiryMatch[1], confidence: 95 });
    }
    const motPassRateMatch = finalText.match(/MOT pass rate[\s\S]{0,100}?(\d+)\s*%/);
    if (motPassRateMatch) {
      result.rawData.mot_pass_rate = motPassRateMatch[1];
      result.findings.push({ source: 'car-checking.com', field: 'mot_pass_rate', value: motPassRateMatch[1] + '%', confidence: 90 });
    }
    const motPassedMatch = finalText.match(/MOT passed\s+(\d+)/i);
    if (motPassedMatch) {
      result.rawData.mot_passed = parseInt(motPassedMatch[1], 10);
      result.findings.push({ source: 'car-checking.com', field: 'mot_passed', value: motPassedMatch[1], confidence: 90 });
    }
    const motFailedMatch = finalText.match(/Failed MOT tests?\s+(\d+)/i);
    if (motFailedMatch) {
      result.rawData.mot_failed = parseInt(motFailedMatch[1], 10);
      result.findings.push({ source: 'car-checking.com', field: 'mot_failed', value: motFailedMatch[1], confidence: 90 });
    }
    const totalAdvMatch = finalText.match(/Total advice items\s+(\d+)/i);
    if (totalAdvMatch) result.rawData.total_advice_items = parseInt(totalAdvMatch[1], 10);

    // Current mileage
    const odometerMatch = finalText.match(/Odometer In miles[\s\S]{0,200}?(\d{5,6})/i);
    if (odometerMatch) {
      result.rawData.current_mileage = parseInt(odometerMatch[1], 10);
      result.findings.push({ source: 'car-checking.com', field: 'current_mileage', value: `${parseInt(odometerMatch[1], 10).toLocaleString()} mi`, confidence: 90 });
    }

    // First registration
    const firstRegMatch = finalText.match(/First registration\s+([\d\-]+)/i);
    if (firstRegMatch) {
      result.rawData.first_registration = firstRegMatch[1];
      result.findings.push({ source: 'car-checking.com', field: 'first_registration', value: firstRegMatch[1], confidence: 90 });
    }

    // Number of keepers
    const keepersMatch = finalText.match(/Number of previous keepers\s+(\d+)/i);
    if (keepersMatch) result.rawData.number_of_keepers = parseInt(keepersMatch[1], 10);

    // Tax status
    const taxStatusMatch = finalText.match(/Tax status\s+([^\n]{3,30})/i);
    if (taxStatusMatch) result.rawData.tax_status = taxStatusMatch[1].trim();

    // Previous VRM
    const prevVrmMatch = finalText.match(/Previous VRM\s+([A-Z0-9]+)/i);
    if (prevVrmMatch) result.rawData.previous_vrm = prevVrmMatch[1];

    // ── MOT history ────────────────────────────────────────────────────────────
    const { entries: motEntries, mileageTimeline, mileageDates } = extractMotHistory(finalText);
    result.rawData.mot_entries = motEntries;
    result.rawData.mileage_timeline = mileageTimeline;
    result.rawData.mileage_dates = mileageDates;
    if (motEntries.length > 0) {
      result.findings.push({ source: 'car-checking.com', field: 'mot_history_count', value: String(motEntries.length), confidence: 95 });
    }

    // Collect unique advisory items
    const allAdvisories = [];
    const seenAdv = new Set();
    for (const entry of motEntries) {
      for (const adv of entry.advisories) {
        const key = adv.toLowerCase().replace(/\s+/g, ' ').slice(0, 80);
        if (!seenAdv.has(key) && key.length > 3) {
          seenAdv.add(key);
          allAdvisories.push(adv);
        }
      }
    }
    result.rawData.all_advisories = allAdvisories;

    // ── Registration timeline (mileage per date) ──────────────────────────────
    const regEntries = [];
    const regRe = /Registration #\d+[\s\S]{0,300}?(?=Registration #\d+|Owner history|Damage|$)/gi;
    for (const regBlock of finalText.matchAll(regRe)) {
      const block = regBlock[0];
      const dateM = block.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
      const milesM = block.match(/(\d{5,6})\s*miles?/i);
      if (dateM || milesM) {
        regEntries.push({ date: dateM ? dateM[1] : '', mileage: milesM ? milesM[1] : '' });
      }
    }
    if (regEntries.length > 0) result.rawData.registration_history = regEntries;

    await ctx.close();
  } catch (err) {
    result.errors.push(`car-checking.com: ${err}`);
  } finally {
    if (browser) await browser.close();
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 8: DVLA COLLECTOR
// ═══════════════════════════════════════════════════════════════════════════════

async function collectDVLA(plate) {
  const result = { findings: [], errors: [], rawData: {} };
  let browser;
  try {
    const { chromium } = await import('@playwright/test');
    browser = await chromium.launch({
      headless: true,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    });
    const page = await browser.newPage();
    await page.goto('https://vehicleenquiry.service.gov.uk/', { waitUntil: 'networkidle', timeout: 20_000 });
    await page.waitForTimeout(1000);

    try {
      const rejectBtn = page.locator('button').filter({ hasText: /reject/i }).first();
      if (await rejectBtn.count() > 0) {
        await rejectBtn.click();
        await page.waitForLoadState('networkidle', { timeout: 10_000 });
      }
    } catch {}

    await page.locator('#wizard_vehicle_enquiry_capture_vrn_vrn').fill(plate);
    await page.locator('button').filter({ hasText: /continue/i }).click();
    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    const bodyText = await page.textContent('body') || '';
    result.rawData.raw_text = bodyText.substring(0, 5000);

    const pairs = [
      ['Colour', 'colour'], ['Vehicle colour', 'colour'],
      ['Tax status', 'tax_status'], ['Vehicle tax status', 'tax_status'],
      ['Date of first registration', 'first_reg'], ['First registered', 'first_reg'],
      ['Make', 'make'], ['Vehicle make', 'make'],
      ['MOT expiry date', 'mot_expiry_dvla'],
      ['Fuel type', 'fuel_type_dvla'],
    ];
    for (const [label, field] of pairs) {
      const idx = bodyText.indexOf(label);
      if (idx === -1) continue;
      const val = bodyText.slice(idx + label.length, idx + label.length + 80)
        .replace(/^[\s:]+/, '').split('\n')[0].trim();
      if (val && val.length > 1) {
        result.rawData[field] = val;
        if (field !== 'make') {
          result.findings.push({ source: 'GovUK-DVLA', field, value: val, confidence: 90 });
        }
      }
    }
    if (Object.keys(result.rawData).length === 0) result.errors.push('DVLA returned empty result');
  } catch (err) {
    result.errors.push(`DVLA lookup failed: ${err}`);
  } finally {
    if (browser) await browser.close();
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 9: GOV.UK MOT
// ═══════════════════════════════════════════════════════════════════════════════

async function collectGovUkMot(plate) {
  const result = { findings: [], errors: [], rawData: {} };
  let browser;
  try {
    const { chromium } = await import('@playwright/test');
    browser = await chromium.launch({
      headless: true,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    });
    const ctx = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    });
    const page = await ctx.newPage();
    await page.goto('https://www.gov.uk/check-mot-history', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(1000);

    const regInput = page.locator('#vrm');
    if (await regInput.count() === 0) {
      result.errors.push('gov.uk MOT: reg input (#vrm) not found');
      return result;
    }

    await regInput.fill(plate);
    await page.locator('button[type="submit"], a').filter({ hasText: /search|find|go/i }).first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 30_000 });
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body') || '';
    result.rawData.raw_text = bodyText.substring(0, 4000);

    const expiryMatch = bodyText.match(/expiry date[\s\n]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (expiryMatch) {
      result.rawData.mot_expiry = expiryMatch[1];
      result.findings.push({ source: 'GovUK-MOT', field: 'mot_expiry', value: expiryMatch[1], confidence: 95 });
    }
    const mileageMatch = bodyText.match(/(\d{4,6})\s*miles?/i);
    if (mileageMatch) {
      result.rawData.last_odometer = mileageMatch[1];
      result.findings.push({ source: 'GovUK-MOT', field: 'last_odometer', value: mileageMatch[1] + ' miles', confidence: 90 });
    }
    if (/MOT pass|PASSED/i.test(bodyText)) {
      result.rawData.mot_result = 'PASS';
      result.findings.push({ source: 'GovUK-MOT', field: 'mot_result', value: 'PASS', confidence: 95 });
    } else if (/MOT fail|FAILED/i.test(bodyText)) {
      result.rawData.mot_result = 'FAIL';
      result.findings.push({ source: 'GovUK-MOT', field: 'mot_result', value: 'FAIL', confidence: 95 });
    }
    const advisories = [];
    for (const m of bodyText.matchAll(/(?:Advisory|Advice)[\s\n]+([^\n]{5,150})/gi)) {
      if (m[1] && m[1].trim().length > 5) advisories.push(m[1].trim());
    }
    if (advisories.length > 0) result.rawData.govuk_advisories = advisories;
  } catch (err) {
    result.errors.push(`GovUK MOT: ${err}`);
  } finally {
    if (browser) await browser.close();
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 10: NHTSA VIN
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchText(url, opts = {}) {
  const { timeout = 15_000 } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
    });
    clearTimeout(timer);
    return await resp.text();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

async function collectVin(vin) {
  const result = { findings: [], errors: [], rawData: {} };
  try {
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`;
    const text = await fetchText(url);
    let json;
    try { json = JSON.parse(text); } catch { json = { Results: [] }; }
    if (json.Results.length === 0) { result.errors.push('NHTSA: empty response'); return result; }
    const r = json.Results[0];
    const fields = [
      ['Make', 'make'], ['Model', 'model'], ['Model Year', 'year'],
      ['Body Class', 'body_type'], ['Engine Displacement (CC)', 'engine_cc'],
      ['Cylinders', 'cylinders'], ['Fuel Type - Primary', 'fuel_type'],
      ['Transmission', 'transmission'], ['Drive Type', 'drive_type'],
    ];
    for (const [nhtsaKey, fieldName] of fields) {
      const val = r[nhtsaKey];
      if (val && val.trim() !== '' && val.trim() !== 'Not Applicable' && val.trim() !== '0') {
        result.rawData[fieldName] = val.trim();
        result.findings.push({ source: 'NHTSA-vPIC', field: fieldName, value: val.trim(), confidence: 90 });
      }
    }
    if (!result.findings.length) result.errors.push('NHTSA: no usable data');
  } catch (err) {
    result.errors.push(`NHTSA vPIC: ${err}`);
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 11: REPORT GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

function parseMotDate(str) {
  if (!str) return null;
  const parts = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (parts) {
    let year = parseInt(parts[3]);
    if (year < 100) year += year > 50 ? 1900 : 2000;
    return new Date(year, parseInt(parts[2]) - 1, parseInt(parts[1]));
  }
  return null;
}

function sevEmoji(sev) {
  return { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[sev] || '⚪';
}

function generateMarkdownReport(data) {
  const lines = [];
  const today = new Date().toISOString().split('T')[0];

  lines.push(`# 🚗 Vehicle OSINT Report — **${data.plate}**`);
  lines.push('');
  lines.push(`| | |`);
  lines.push(`|---|---|`);
  lines.push(`| **Report Date** | ${today} |`);
  lines.push(`| **Registration** | ${data.plate} |`);
  lines.push(`| **Plate Type** | UK Registration |`);
  lines.push(`| **Data Sources** | car-checking.com, Gov.uk DVLA, Gov.uk MOT |`);
  lines.push('');

  // ── Report Section Key ───────────────────────────────────────────────────
  lines.push('| Section | Heading |');
  lines.push('| ------- | ---------------------------- |');
  lines.push('| 1 | 🚗 Vehicle Overview |');
  lines.push('| 2 | 🔍 Current Status |');
  lines.push('| 3 | ⚠️ MOT History |');
  lines.push('| 4 | 🛣️ Mileage Analysis |');
  lines.push('| 5 | 🔧 The Advisories |');
  lines.push('| 6 | 💰 Market Valuation |');
  lines.push('| 7 | 🎯 Risk Assessment |');
  lines.push('| 8 | 📝 Registration Timeline |');
  lines.push('| 9 | 📡 Data Sources & Confidence |');
  lines.push('');

  // ── 1. Vehicle Header Card ───────────────────────────────────────────────
  lines.push('## 🚗 Vehicle Overview');
  lines.push('');
  lines.push('```');
  lines.push(`  Registration:     ${data.plate}`);
  lines.push(`  Make:             ${data.make || 'Unknown'}`);
  lines.push(`  Model:            ${data.model || 'Unknown'}`);
  lines.push(`  Year:             ${data.year || 'Unknown'}`);
  lines.push(`  Colour:           ${data.colour || 'Unknown'}`);
  lines.push(`  Body Type:        ${data.bodyType || (data.marketData?.body || 'N/A')}`);
  lines.push(`  Fuel Type:        ${data.fuelType || 'Unknown'}`);
  lines.push(`  Engine Size:      ${data.engineCc ? data.engineCc.toLocaleString() + ' cc' : 'N/A'}`);
  lines.push(`  Power:            ${data.power || 'N/A'}`);
  lines.push(`  Torque:           ${data.torque || 'N/A'}`);
  lines.push(`  Transmission:     ${data.gearbox || 'N/A'}`);
  lines.push(`  Cylinders:        ${data.cylinders || 'N/A'}`);
  lines.push('  CO2 Emissions:    ' + (data.co2Emission ? data.co2Emission : 'N/A'));
  lines.push(`  CO2 Band:         ${data.co2Label || 'N/A'}`);
  lines.push(`  Combined MPG:     ${data.consumptionCombined || 'N/A'} mpg`);
  lines.push(`  0-60 mph:         ${data.zeroToSixty || 'N/A'} sec`);
  lines.push(`  Top Speed:        ${data.topSpeed || 'N/A'}`);
  lines.push(`  VIN:              ${data.vin || 'Not on record'}`);
  lines.push(`  Previous VRM:     ${data.previousVrm || 'None'}`);
  lines.push('```');
  lines.push('');

  // ── 2. Vehicle Status ────────────────────────────────────────────────────
  lines.push('## 🔍 Current Status');
  lines.push('');
  lines.push('```');
  lines.push(`  Tax Status:        ${data.taxStatus || 'Unknown'}`);
  lines.push(`  MOT Status:        ${data.motStatus || 'Unknown'}`);
  lines.push(`  MOT Expiry:        ${data.motExpiry || 'Unknown'}`);
  lines.push(`  MOT Pass Rate:     ${data.motPassRate ? data.motPassRate + '%' : 'N/A'}`);
  lines.push(`  MOT Passed:        ${data.motPassed ?? 0}  |  MOT Failed: ${data.motFailed ?? 0}`);
  lines.push(`  MOT Tests Total:   ${data.motHistoryCount ?? 0}`);
  lines.push(`  First Reg:         ${data.firstReg || 'Unknown'}`);
  lines.push(`  Insurance Group:   ${data.insuranceGroup || 'N/A'}`);
  lines.push(`  Keepers / Owners:  ${data.numberOfKeepers ? String(data.numberOfKeepers) : 'Unknown'}`);
  lines.push('```');
  lines.push('');

  // ── 3. MOT History Intelligence ─────────────────────────────────────────
  lines.push('## ⚠️ MOT History');
  lines.push('');
  lines.push(`**MOT Pass Rate:** ${data.motPassRate ? data.motPassRate + '%' : 'N/A'}  **|**  **Passed:** ${data.motPassed ?? 0}  **|**  **Failed:** ${data.motFailed ?? 0}  **|**  **Tests on record:** ${data.motHistoryCount ?? 0}`);
  lines.push('');

  if (data.motEntries && data.motEntries.length > 0) {
    lines.push(`| # | Date | Odometer | Result | Test Centre | Advisories |`);
    lines.push(`|---|------|----------|--------|-------------|-------------|`);
    for (const entry of data.motEntries.slice(0, 20)) {
      const resIcon = entry.result === 'Pass' ? '✔' : entry.result === 'Fail' ? '✗' : '?';
      const advText = entry.advisories.length > 0
        ? entry.advisories.slice(0, 2).join('; ').slice(0, 80) + (entry.advisories.length > 2 ? ` +${entry.advisories.length - 2}` : '')
        : 'None';
      lines.push(`| ${entry.testNumber} | ${entry.date || '?'} | ${entry.mileage ? parseInt(entry.mileage).toLocaleString() + ' mi' : '?'} | ${resIcon} ${entry.result} | ${entry.testCentre || '?'} | ${advText} |`);
    }
    lines.push('');
  } else {
    lines.push('⚠️ Full MOT history not available.');
    lines.push('');
  }

  // ── 4. Mileage Intelligence ──────────────────────────────────────────────
  lines.push('## 🛣️ Mileage Analysis');
  lines.push('');
  if (data.mileageTimeline && data.mileageTimeline.length > 0) {
    const timeline = data.mileageTimeline; // newest first
    const current = timeline[0];
    const oldest = timeline[timeline.length - 1];
    const age = data.year ? new Date().getFullYear() - data.year : 10;
    const yearsBetween = Math.max(1, age);
    const milesDiff = current - oldest;
    const annualAvg = Math.round(milesDiff / yearsBetween);

    lines.push(`| Metric | Value |`);
    lines.push(`|---|---|`);
    lines.push(`| Current odometer (latest MOT) | **${current.toLocaleString()} mi** |`);
    lines.push(`| First recorded MOT mileage | ${oldest.toLocaleString()} mi |`);
    lines.push(`| Total miles covered (MOT period) | ${milesDiff.toLocaleString()} mi |`);
    lines.push(`| MOT record span | ${yearsBetween} years |`);
    lines.push(`| Average per MOT year | **${annualAvg.toLocaleString()} mi/yr** |`);
    lines.push('');

    const mileageRating = annualAvg < 8000 ? '🟢 Low — careful owner' : annualAvg < 12000 ? '🟢 Normal' : annualAvg < 18000 ? '🟡 Moderate-to-high' : '🔴 High mileage';
    lines.push(`**Mileage rating:** ${mileageRating}`);
    lines.push('');

    lines.push('**Mileage trend (newest → oldest MOT):**');
    lines.push('');
    lines.push(`| MOT | Date | Mileage |`);
    lines.push(`|---|---|---|`);
    data.motEntries.slice(0, Math.min(timeline.length, 20)).forEach((entry, i) => {
      const date = data.mileageDates && data.mileageDates[i] ? `(${data.mileageDates[i]})` : '';
      const miles = timeline[i] ? timeline[i].toLocaleString() + ' mi' : '?';
      lines.push(`| #${entry.testNumber} ${date} | ${entry.date || '?'} | ${miles} |`);
    });
    lines.push('');
  } else {
    lines.push('⚠️ Mileage timeline not available.');
    lines.push('');
  }

  // ── 5. Advisory & Defect Items ──────────────────────────────────────────
  lines.push('## 🔧 The Advisories');
  lines.push('');
  if (data.advisories && data.advisories.length > 0) {
    const bySev = { critical: [], high: [], medium: [], low: [] };
    for (const a of data.advisories) (bySev[a.severity] || bySev.low).push(a);
    let totalMin = 0, totalMax = 0;
    for (const a of data.advisories) { totalMin += a.costMin; totalMax += a.costMax; }

    lines.push(`**Total advisory repair cost (estimated):** £${totalMin.toLocaleString()} – £${totalMax.toLocaleString()}`);
    lines.push(`**As-is value adjustment:** -£${Math.round(totalMax * 0.75).toLocaleString()} (typical negotiation discount)`);
    lines.push('');

    for (const sev of ['critical', 'high', 'medium', 'low']) {
      const items = bySev[sev];
      if (!items || items.length === 0) continue;
      lines.push(`### ${sevEmoji(sev)} ${sev.charAt(0).toUpperCase() + sev.slice(1)} Severity (${items.length})`);
      lines.push('');
      for (const a of items) {
        const labourStr = a.labourHours > 0 ? ` | ${a.labourHours}h labour` : '';
        const failTag = a.isFailure ? ' **[PREVIOUS FAIL]**' : '';
        lines.push(`- ${sevEmoji(a.severity)} **${a.item}**${failTag} — est. £${a.costMin.toLocaleString()}-£${a.costMax.toLocaleString()}${labourStr}`);
        if (a.notes) lines.push(`  └ ${a.notes}`);
      }
      lines.push('');
    }
  } else {
    lines.push('✔ No advisories recorded on last MOT.');
    lines.push('');
  }

  // ── 6. Market Valuation ──────────────────────────────────────────────────
  lines.push('## 💰 Market Valuation');
  lines.push('');
  if (data.valuation) {
    const v = data.valuation;
    lines.push('| Scenario | Price |');
    lines.push('|---|---|');
    lines.push(`| **Retail value (${v.condition} condition)** | **£${v.min.toLocaleString()} – £${v.max.toLocaleString()}** |`);
    lines.push(`| As-is (with advisories deducted) | £${v.valWithAdvMin.toLocaleString()} – £${v.valWithAdvMax.toLocaleString()} |`);
    lines.push(`| Original MSRP (when new) | £${v.msrpMin.toLocaleString()} – £${v.msrpMax.toLocaleString()} |`);
    lines.push(`| Depreciation | ~${v.deprPct}% from new |`);
    const yr = data.year ? String(new Date().getFullYear() - data.year) : '?';
    const miles = data.currentMileage ? data.currentMileage.toLocaleString() + ' mi' : 'unknown mileage';
    lines.push("| Assessed condition | " + (v.condition.charAt(0).toUpperCase() + v.condition.slice(1)) + ' |');
    lines.push('');
    lines.push('**How price was derived:** Based on ' + yr + '-year-old ' + (data.make || '?') + ' ' + (data.model || '?') + ' with ' + miles + ', adjusted for advisories. Depreciation curve: ~18% year 1, then ~10%/yr.');
    lines.push('');
    lines.push('**Expected months remaining:** ' + v.lifespanMonths + ' months');
    lines.push('**MOT fail risk:** ' + v.motFailRisk.toUpperCase());
    lines.push('');
    lines.push('**Valuation confidence:** ' + (
      (data.motHistoryCount ?? 0) >= 10 ? '🟢 High — ' + data.motHistoryCount + ' MOT records' :
      (data.motHistoryCount ?? 0) >= 5  ? '🟡 Medium — ' + data.motHistoryCount + ' MOT records' :
      '🔴 Low — limited MOT history'
    ));
    lines.push('');
    lines.push('**Recommendation:**');
    lines.push('');
    lines.push(`> ${v.recommendation}`);
    lines.push('');
  } else {
    lines.push('Market valuation not available.');
    lines.push('');
  }

  // ── 7. Risk Assessment ───────────────────────────────────────────────────
  lines.push('## 🎯 Risk Assessment');
  lines.push('');
  const critCount = (data.advisories || []).filter(a => a.severity === 'critical').length;
  const highCount  = (data.advisories || []).filter(a => a.severity === 'high').length;
  const medCount   = (data.advisories || []).filter(a => a.severity === 'medium').length;
  const lowCount   = (data.advisories || []).filter(a => a.severity === 'low').length;
  const failCount  = (data.advisories || []).filter(a => a.isFailure).length;

  const overallRisk = critCount > 0 || highCount > 2
    ? '🔴 HIGH'
    : highCount > 0 || medCount >= 3
      ? '🟡 MODERATE'
      : '🟢 LOW';

  lines.push(`**Overall Risk: ${overallRisk}**`);
  lines.push('');
  lines.push('| Severity | Count |');
  lines.push('|---|---|');
  if (critCount > 0) lines.push(`| 🔴 Critical | ${critCount} |`);
  if (highCount > 0) lines.push(`| 🟠 High | ${highCount} |`);
  if (medCount > 0)  lines.push(`| 🟡 Medium | ${medCount} |`);
  if (lowCount > 0)  lines.push(`| 🟢 Low | ${lowCount} |`);
  if (!data.advisories || data.advisories.length === 0) lines.push('| 🟢 None | 0 |');
  lines.push('');

  if (data.riskFlags && data.riskFlags.length > 0) {
    for (const flag of data.riskFlags) lines.push(`- ${flag}`);
    lines.push('');
  }
  if (failCount > 0) lines.push(`🔴 **Previous MOT failure(s):** ${failCount} — see MOT history above.\n`);
  if ((data.advisories || []).some(a => a.item.toLowerCase().includes('mileage'))) {
    lines.push('🚨 **Mileage discrepancy flagged** — HPI check strongly recommended.\n');
  }
  if (data.age > 15) lines.push(`⚠️ **Age:** ${data.age} years — structural rust, corrosion, and major component wear risk.\n`);
  if (!data.vin) lines.push('⚠️ **VIN not on record** — verify against physical plate.\n');
  if (data.previousVrm && data.previousVrm !== 'None') lines.push(`🔄 **Plate changed** — previously ${data.previousVrm}.\n`);

  // ── 8. Registration Timeline ─────────────────────────────────────────────
  lines.push('## 📝 Registration Timeline');
  lines.push('');
  if (data.registrationHistory && data.registrationHistory.length > 0) {
    lines.push('| Date | Mileage |');
    lines.push('|---|---|');
    for (const entry of data.registrationHistory) {
      const miles = entry.mileage ? parseInt(entry.mileage).toLocaleString() + ' mi' : '?';
      lines.push(`| ${entry.date || '?'} | ${miles} |`);
    }
    lines.push('');
    lines.push('*Note: Registration dates reflect keeper changes, not MOT tests. Mileage recorded at each V5C registration event.*');
    lines.push('');
  } else {
    lines.push('Registration history not available (premium feature on car-checking.com).');
    lines.push('');
  }

  // ── 9. Data Sources & Confidence ────────────────────────────────────────
  lines.push('## 📡 Data Sources & Confidence');
  lines.push('');
  lines.push('| Source | Status | Data Retrieved |');
  lines.push('|---|---|---|');
  lines.push(`| car-checking.com | ${data.carCheckAvailable ? '✅ Available' : '❌ Failed'} | ${data.carCheckAvailable ? 'Full spec + MOT history + mileage timeline' : 'Error'} |`);
  lines.push(`| Gov.uk DVLA | ${data.dvlaAvailable ? '✅ Available' : '❌ Failed'} | ${data.dvlaAvailable ? 'Tax status + colour + first registration' : 'Error'} |`);
  lines.push(`| Gov.uk MOT | ${data.govUkMotAvailable ? '✅ Available' : '❌ Failed'} | ${data.govUkMotAvailable ? 'MOT status + last test' : 'Error'} |`);
  lines.push('');

  const sourcesOk = [data.carCheckAvailable, data.dvlaAvailable, data.govUkMotAvailable].filter(Boolean).length;
  const confPct = Math.min(95, 30 + sourcesOk * 20 + Math.min((data.motHistoryCount ?? 0) * 1.5, 20));
  lines.push(`**Overall OSINT Confidence:** ${confPct >= 70 ? '🟢 High' : confPct >= 50 ? '🟡 Medium' : '🔴 Low'} (${Math.round(confPct)}%)`);
  lines.push('');

  if (data.collectorErrors && data.collectorErrors.length > 0) {
    lines.push(`**⚠️ Errors (${data.collectorErrors.length}):**`);
    for (const err of data.collectorErrors.slice(0, 5)) {
      lines.push(`- ${String(err).replace(/\n/g, ' ').slice(0, 120)}`);
    }
    lines.push('');
  }

  // ── Footer ──────────────────────────────────────────────────────────────
  lines.push('---');
  lines.push(`*Vehicle OSINT Report — ${data.plate} — ${new Date().toISOString()} by Snowie Vehicle OSINT Pipeline*`);

  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 12: FILE I/O
// ═══════════════════════════════════════════════════════════════════════════════

const FS_WRITE = require('fs').writeFileSync;
const FS_MKDIR = require('fs').mkdirSync;

function saveReport(content, plate, outputPath) {
  const path = require('path');
  if (outputPath) {
    const dir = path.dirname(outputPath);
    if (dir && dir !== '.') try { FS_MKDIR(dir, { recursive: true }); } catch {}
    FS_WRITE(outputPath, content, 'utf8');
    return outputPath;
  } else {
    const today = new Date().toISOString().split('T')[0];
    const dir = `reports${path.sep}osint${path.sep}${today}`;
    try { FS_MKDIR(dir, { recursive: true }); } catch {}
    const fullPath = `${dir}${path.sep}vehicle-${plate}.md`;
    FS_WRITE(fullPath, content, 'utf8');
    return fullPath;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 13: MAIN ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════════

async function runVehicleOsint(plate) {
  const clean = plate.replace(/[\s\-]/g, '').toUpperCase();
  const plateType = detectPlateType(clean);

  console.log(`\n🔍 Vehicle OSINT — ${clean} (type: ${plateType})`);

  const allErrors = [];
  let carCheckRaw = null;
  let dvlaRaw = null;
  let govUkRaw = null;

  if (plateType === 'UK') {
    console.log('\n📡 Querying UK sources...');

    const [dvlaResult, carCheckResult, govUkResult] = await Promise.allSettled([
      collectDVLA(clean),
      collectCarCheck(clean),
      collectGovUkMot(clean),
    ]);

    if (dvlaResult.status === 'fulfilled') {
      allErrors.push(...dvlaResult.value.errors);
      dvlaRaw = dvlaResult.value.rawData;
      console.log(`  ${dvlaResult.value.findings.length > 0 ? '✅' : '⚠️ '} DVLA: ${dvlaResult.value.findings.length > 0 ? 'OK' : 'no data'}`);
    } else {
      allErrors.push(`DVLA: ${dvlaResult.reason}`);
      console.log('  ❌ DVLA: failed');
    }

    if (carCheckResult.status === 'fulfilled') {
      allErrors.push(...carCheckResult.value.errors);
      carCheckRaw = carCheckResult.value.rawData;
      const fieldCount = Object.keys(carCheckResult.value.rawData).length;
      console.log(`  ${carCheckResult.value.findings.length > 0 ? '✅' : '⚠️ '} car-checking.com: ${carCheckResult.value.findings.length} fields extracted`);
    } else {
      allErrors.push(`car-checking.com: ${carCheckResult.reason}`);
      console.log('  ❌ car-checking.com: failed');
    }

    if (govUkResult.status === 'fulfilled') {
      allErrors.push(...govUkResult.value.errors);
      govUkRaw = govUkResult.value.rawData;
      console.log(`  ${govUkResult.value.findings.length > 0 ? '✅' : '⚠️ '} Gov.uk MOT: ${govUkResult.value.findings.length > 0 ? 'OK' : 'no data'}`);
    } else {
      allErrors.push(`Gov.uk MOT: ${govUkResult.reason}`);
      console.log('  ❌ Gov.uk MOT: failed');
    }
  } else if (plateType === 'VIN') {
    const vinResult = await Promise.allSettled([collectVin(clean)]);
    if (vinResult[0].status === 'fulfilled') allErrors.push(...vinResult[0].value.errors);
  }

  // ── Extract fields ───────────────────────────────────────────────────────
  const cc = carCheckRaw || {};
  const dvla = dvlaRaw || {};

  const specRaw = cc.make || '';
  const make = cc.make || dvla.make || '';
  const model = cc.model || '';
  const colour = cc.colour || dvla.colour || '';
  const year = parseInt(cc.year || '0', 10) || 0;
  const fuelType = cc.fuel_type || '';
  const engineCc = parseInt(String(cc.engine_capacity || '0').replace(/\D/g, ''), 10) || 0;
  const gearbox = cc.gearbox || '';
  const power = cc.power_bhp || '';
  const torque = cc.torque_rpm || '';
  const cylinders = cc.cylinders || '';
  const zeroToSixty = cc.zero_to_60 || '';
  const topSpeed = cc.top_speed || '';
  const consumptionCombined = cc.consumption_combined || '';
  const consumptionCity = cc.consumption_city || '';
  const consumptionExtraUrban = cc.consumption_extra_urban || '';
  const co2Emission = cc.co2_gkm || '';
  const co2Label = cc.co2_label || '';
  const vin = cc.vin || '';
  const motExpiry = cc.mot_expiry || dvla.mot_expiry_dvla || '';
  const motPassRate = cc.mot_pass_rate || '';
  const motPassed = cc.mot_passed || 0;
  const motFailed = cc.mot_failed || 0;
  const motEntries = cc.mot_entries || [];
  const mileageTimeline = Array.isArray(cc.mileage_timeline) ? cc.mileage_timeline : [];
  const mileageDates = Array.isArray(cc.mileage_dates) ? cc.mileage_dates : [];
  const allAdvisoriesRaw = cc.all_advisories || [];
  const registrationHistory = cc.registration_history || [];
  const taxStatus = cc.tax_status || dvla.tax_status || '';
  const firstReg = cc.first_registration || dvla.first_reg || '';
  const previousVrm = cc.previous_vrm || '';
  const numberOfKeepers = cc['number_of_keepers'] || null;
  const currentMileage = cc.current_mileage || (mileageTimeline[0] || null);
  const age = year ? new Date().getFullYear() - year : 0;

  // ── Market data ─────────────────────────────────────────────────────────
  const marketData = lookupMarketData(make, model);
  const insuranceGroup = marketData ? `${marketData.ins_min}-${marketData.ins_max}` : null;
  const bodyType = marketData?.body || '';

  // ── Classify advisories ─────────────────────────────────────────────────
  const seenKeys = new Set();
  const advisories = [];
  for (const rawAdv of allAdvisoriesRaw) {
    const classified = classifyAdvisory(rawAdv);
    const key = rawAdv.toLowerCase().replace(/\s+/g, ' ').slice(0, 60);
    if (!seenKeys.has(key) && key.length > 3) {
      seenKeys.add(key);
      advisories.push(classified);
    }
  }

  // ── Valuation ────────────────────────────────────────────────────────────
  let valuation = null;
  if (make) {
    try {
      valuation = generateValuation(make, model, year, currentMileage, fuelType, advisories, motFailed, marketData);
      const v = valuation;
      console.log(`\n💰 Valuation: £${v.min.toLocaleString()}-£${v.max.toLocaleString()} | ${v.condition} | ${v.deprPct}% depr | Risk: ${v.motFailRisk.toUpperCase()}`);
    } catch (e) {
      console.log(`⚠️ Valuation error: ${e}`);
    }
  }

  // ── Risk flags ───────────────────────────────────────────────────────────
  const riskFlags = [];
  if (valuation?.motFailRisk === 'high') riskFlags.push('⚠️ High MOT fail risk — serious advisories present');
  if (valuation && valuation.totalAdvCostMax > valuation.max * 0.6) riskFlags.push('⚠️ Repair costs exceed 60% of vehicle value');
  if (motFailed >= 3) riskFlags.push(`⚠️ Multiple MOT failures (${motFailed}) on record`);
  if (motExpiry && parseMotDate(motExpiry) < new Date()) riskFlags.push('⚠️ MOT has expired');
  if (motExpiry && parseMotDate(motExpiry) && (parseMotDate(motExpiry).getTime() - Date.now()) < 30 * 86400000) riskFlags.push('⚠️ MOT expiring within 30 days');

  const motStatus = motExpiry
    ? (parseMotDate(motExpiry) > new Date() ? 'Valid' : 'Expired')
    : 'No MOT data';

  const reportData = {
    plate: clean, make, model, year, colour, bodyType, fuelType,
    engineCc, gearbox, power, torque, cylinders,
    zeroToSixty, topSpeed,
    consumptionCombined, consumptionCity, consumptionExtraUrban,
    co2Emission, co2Label,
    vin, previousVrm, taxStatus,
    motStatus, motExpiry, motPassRate, motPassed, motFailed,
    motHistoryCount: motEntries.length, motEntries,
    mileageTimeline, mileageDates,
    registrationHistory,
    firstReg, numberOfKeepers, insuranceGroup,
    advisories, valuation, age, riskFlags,
    collectorErrors: allErrors,
    carCheckAvailable: !!(cc.make || cc.mot_expiry),
    dvlaAvailable: Object.keys(dvla).length > 0,
    govUkMotAvailable: !!(govUkRaw?.mot_expiry || govUkRaw?.raw_text),
    marketData,
    currentMileage,
  };

  return reportData;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 14: ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  const { plate, outputPath } = CLI;
  const clean = plate.replace(/[\s\-]/g, '').toUpperCase();

  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║       Vehicle OSINT Pipeline — Standalone      ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  let reportData;
  try {
    reportData = await runVehicleOsint(plate);
  } catch (err) {
    console.error(`\n❌ Fatal error: ${err}`);
    process.exit(1);
  }

  const markdown = generateMarkdownReport(reportData);
  const savedPath = saveReport(markdown, clean, outputPath);

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  === Vehicle OSINT: ${clean} ===`);
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Make/Model:  ${reportData.make} ${reportData.model}`);
  console.log(`  Year:        ${reportData.year || '?'}  |  Colour: ${reportData.colour || '?'}`);
  console.log(`  Mileage:     ${reportData.currentMileage ? reportData.currentMileage.toLocaleString() + ' mi' : '?'}`);
  console.log(`  MOT:         ${reportData.motExpiry || '?'}  |  ${reportData.motPassRate ? reportData.motPassRate + '% pass rate' : 'no pass rate'}`);
  if (reportData.valuation) {
    console.log(`  Value:       £${reportData.valuation.min.toLocaleString()}-£${reportData.valuation.max.toLocaleString()} | ${reportData.valuation.condition}`);
    console.log(`  As-is:       £${reportData.valuation.valWithAdvMin.toLocaleString()}-£${reportData.valuation.valWithAdvMax.toLocaleString()} (with advisories)`);
    console.log(`  Depr:        ${reportData.valuation.deprPct}% from new`);
  }
  const riskStr2 = reportData.valuation
    ? (reportData.valuation.motFailRisk === 'high' ? '🔴 HIGH' : reportData.valuation.motFailRisk === 'medium' ? '🟡 MODERATE' : '🟢 LOW')
    : '⚪ UNKNOWN';
  console.log(`  Risk:        ${riskStr2}`);
  console.log(`  Advisories:  ${reportData.advisories.length} — £${reportData.valuation?.totalAdvCostMin ?? 0}-£${reportData.valuation?.totalAdvCostMax ?? 0} est.`);
  console.log(`  Report:     ${savedPath}`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  if (reportData.collectorErrors?.length > 0) {
    console.log(`⚠️  ${reportData.collectorErrors.length} error(s):`);
    for (const err of reportData.collectorErrors.slice(0, 3)) {
      console.log(`   - ${String(err).replace(/\n/g, ' ').slice(0, 100)}`);
    }
    console.log('');
  }
}

main().catch(err => { console.error('Unhandled error:', err); process.exit(1); });
