#!/usr/bin/env node
/**
 * vehicle-osint.js — Standalone Vehicle OSINT CLI
 * 
 * Usage: node vehicle-osint.js <REG> [--output ./report.md]
 * 
 * No external dependencies beyond Node.js built-ins + playwright (auto-installed).
 * All logic is self-contained in this file.
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 1: CLI PARSER
// ═══════════════════════════════════════════════════════════════════════════════

const CLI = (() => {
  const args = process.argv.slice(2);
  
  function parseArgs() {
    const positional = [];
    const flags = {};
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--')) {
        const key = arg.slice(2);
        const next = args[i + 1];
        if (next && !next.startsWith('--')) {
          flags[key] = next;
          i++;
        } else {
          flags[key] = true;
        }
      } else if (arg.startsWith('-')) {
        const key = arg.slice(1);
        const next = args[i + 1];
        if (next && !next.startsWith('-')) {
          flags[key] = next;
          i++;
        } else {
          flags[key] = true;
        }
      } else {
        positional.push(arg);
      }
    }
    
    return { positional, flags };
  }
  
  const { positional, flags } = parseArgs();
  
  const plate = positional[0];
  const outputPath = flags.output || null;
  
  if (!plate) {
    console.error('Usage: node vehicle-osint.js <REG> [--output ./report.md]');
    console.error('Examples:');
    console.error('  node vehicle-osint.js KY05YTJ');
    console.error('  node vehicle-osint.js KY05YTJ --output ./my-report.md');
    process.exit(1);
  }
  
  return { plate, outputPath };
})();

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 2: HTTP HELPER
// ═══════════════════════════════════════════════════════════════════════════════

const HTTP = {
  async osintFetch(url, opts = {}) {
    const { timeout = 15000, method = 'GET', headers = {}, body = null } = opts;
    
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    
    try {
      const resp = await fetch(url, {
        method,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-GB,en;q=0.9',
          ...headers,
        },
        body,
        signal: controller.signal,
      });
      
      clearTimeout(timer);
      return await resp.text();
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeout}ms: ${url}`);
      }
      throw err;
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 3: VALUATION LOGIC (ported from VehicleValuation.ts)
// ═══════════════════════════════════════════════════════════════════════════════

const VALUATION = (() => {
  // ─── Types (as comments for documentation) ─────────────────────────────────
  // Severity: 'critical' | 'high' | 'medium' | 'low'
  // Urgency: 'immediate' | 'soon' | 'when_due' | 'advisory'

  // ─── Advisory Database ──────────────────────────────────────────────────────
  // ~80 entries of keyword → cost mapping, hardcoded
  const ADVISORY_DATABASE = [
    // Tyres
    { keywords: ['tyre worn close to legal limit','tyres worn close to legal limit'], item: 'Tyre(s) worn close to legal limit', severity: 'medium', urgency: 'soon', costMin: 90, costMax: 155, labourHours: 0.5, notes: '£80-140 per tyre + £10-15 fitting. MOT pass but retest due soon.', partsIncluded: true },
    { keywords: ['tyre worn on edge','tyres worn on edge','tyres below legal limit','tyre below legal limit','tyres worn below legal','tyre worn below legal'], item: 'Tyre(s) worn below legal limit', severity: 'critical', urgency: 'immediate', costMin: 90, costMax: 155, labourHours: 0.5, notes: 'ILLEGAL. Do not drive. £80-140 per tyre.', partsIncluded: true },
    { keywords: ['tyre slightly damaged','tyres slightly damaged','tyre slight damage','tyres slight damage','perishing','cracking on tyre','cracking on tyres'], item: 'Tyre(s) slightly damaged / perishing', severity: 'low', urgency: 'soon', costMin: 40, costMax: 80, labourHours: 0.25, notes: 'Monitor — may not need immediate replacement.', partsIncluded: true },
    // Suspension
    { keywords: ['coil spring fractured','coil spring broken','coil spring split'], item: 'Coil spring fractured/broken', severity: 'critical', urgency: 'immediate', costMin: 250, costMax: 600, labourHours: 2.5, notes: '£150-400 per spring + £100-200 labour + wheel alignment.', partsIncluded: false },
    { keywords: ['shock absorber leaking','shock absorber has a light leak','damper leaking','strut mount deteriorated','top mount failure'], item: 'Shock absorber / strut leaking', severity: 'high', urgency: 'soon', costMin: 150, costMax: 400, labourHours: 1.5, notes: '£80-200 per corner + £50-100 labour. Degraded handling.', partsIncluded: false },
    { keywords: ['suspension arm corroded','suspension arm deteriorated','track control arm corroded','lower arm corroded','upper arm corroded'], item: 'Suspension arm / bush corroded', severity: 'medium', urgency: 'when_due', costMin: 100, costMax: 300, labourHours: 1.5, notes: '£50-150 per arm + £80-150 labour.', partsIncluded: false },
    // Brakes
    { keywords: ['brake pipe corroded','brake pipe severely corroded','brake pipes corroded','corroded brake pipe'], item: 'Brake pipe corroded', severity: 'high', urgency: 'soon', costMin: 100, costMax: 250, labourHours: 1.5, notes: '£60-150 for pipe + £80-120 labour. Can spread fast.', partsIncluded: false },
    { keywords: ['brake hose has slight corrosion','brake hose corroded','brake hose deteriorated','rubber hose cracked','flexible brake hose perished'], item: 'Brake hose corroded / perished', severity: 'medium', urgency: 'when_due', costMin: 60, costMax: 140, labourHours: 1.0, notes: '£30-60 per hose + £50-80 labour. Replace in pairs.', partsIncluded: false },
    { keywords: ['brake cable damaged','brake cable frayed','handbrake cable damaged','parking brake cable damaged','rear brake cable damaged'], item: 'Brake cable damaged', severity: 'medium', urgency: 'when_due', costMin: 60, costMax: 140, labourHours: 1.0, notes: '£30-60 per cable + £50-80 labour.', partsIncluded: false },
    { keywords: ['brake pad worn','brake pads worn','front brake pads worn','rear brake pads worn','brake pad excessive wear','pad worn close to wire'], item: 'Brake pad(s) worn', severity: 'high', urgency: 'immediate', costMin: 80, costMax: 200, labourHours: 1.0, notes: '£40-80 per pad + £40-60 labour per axle. Replace in pairs.', partsIncluded: false },
    { keywords: ['brake disc worn','brake discs worn','brake disc in poor condition','rear brake disc scored','brake disc below minimum thickness'], item: 'Brake disc worn / scored', severity: 'high', urgency: 'soon', costMin: 100, costMax: 250, labourHours: 1.5, notes: '£60-120 per disc + £40-60 labour. Replace with pads.', partsIncluded: false },
    { keywords: ['abs sensor defective','abs sensor not working','abs warning light','anti-lock brake system warning'], item: 'ABS sensor defective', severity: 'medium', urgency: 'when_due', costMin: 100, costMax: 250, labourHours: 1.0, notes: '£60-150 for sensor + £50-100 labour. MOT advisory but safety-critical.', partsIncluded: false },
    // Steering
    { keywords: ['steering rack gaiter damaged','steering rack gaiter split','rack gaiter perished','steering rack boot split'], item: 'Steering rack gaiter split', severity: 'high', urgency: 'soon', costMin: 100, costMax: 250, labourHours: 1.5, notes: '£60-150 for gaiter + £80-120 labour. If ignored → rack £400-800.', partsIncluded: false },
    { keywords: ['track rod end worn','track rod end excessive play','tie rod end worn','steering linkage worn','steering ball joint worn'], item: 'Steering ball joint / track rod end worn', severity: 'critical', urgency: 'immediate', costMin: 100, costMax: 250, labourHours: 1.5, notes: '£50-120 per joint + £80-120 labour. Dangerous.', partsIncluded: false },
    // Engine / Emissions
    { keywords: ['exhaust emitting excessive smoke','exhaust smokes on tickover','excessive smoke from exhaust','engine emitting blue smoke','engine emitting white smoke'], item: 'Engine smoking (blue/white)', severity: 'high', urgency: 'soon', costMin: 200, costMax: 1200, labourHours: 4.0, notes: 'Blue=oil burn £400-1200. White=coolant/head gasket £300-800.', partsIncluded: false },
    { keywords: ['catalytic converter defective','catalytic converter missing','cat removed','exhaust catalytic converter below threshold'], item: 'Catalytic converter defective', severity: 'high', urgency: 'soon', costMin: 300, costMax: 1200, labourHours: 2.0, notes: '£300-800 for pattern part + £100-200 fitting. MOT fail for emissions.', partsIncluded: false },
    { keywords: ['dpf warning light','dpf blocked','dpf regeneration required','dpf fault','diesel particulate filter warning'], item: 'DPF warning / blocked', severity: 'high', urgency: 'soon', costMin: 200, costMax: 1500, labourHours: 3.0, notes: '£150-400 for forced regen + £800-1500 replacement.', partsIncluded: false },
    { keywords: ['emissions exceed limit','lambda sensor defective','lambda sensor malfunction','air fuel ratio sensor defective','o2 sensor defective','sensor for emissions defective'], item: 'Emissions sensor / lambda defective', severity: 'medium', urgency: 'when_due', costMin: 150, costMax: 400, labourHours: 1.5, notes: '£80-250 for sensor + £80-150 labour. MOT fail risk.', partsIncluded: false },
    { keywords: ['engine oil level low','engine oil warning','oil warning light','oil consumption excessive'], item: 'Engine oil level low / consuming', severity: 'high', urgency: 'soon', costMin: 50, costMax: 300, labourHours: 0.5, notes: '£30-50 for top-up + diagnosis. Could indicate ring wear or gasket leak.', partsIncluded: true },
    // Body / Structural
    { keywords: ['sub-frame corroded','subframe corroded','sub frame corroded','underbody corroded','chassis corroded','floor pan corroded'], item: 'Sub-frame / chassis corroded', severity: 'high', urgency: 'when_due', costMin: 200, costMax: 1000, labourHours: 4.0, notes: '£150-600 for welding + £100-400 labour. Structural.', partsIncluded: false },
    { keywords: ['corrosion to underside','surface corrosion to underside','corrosion to suspension','corrosion to body','corrosion to structure'], item: 'Generalised corrosion / rust', severity: 'medium', urgency: 'when_due', costMin: 50, costMax: 500, labourHours: 2.0, notes: '£50-300 for treatment + £50-200 for underseal. Monitor for spread.', partsIncluded: true },
    // Lights
    { keywords: ['headlamp lens slightly defective','headlamp lens cracked','headlamp lens deteriorated','headlight lens cracked','dipped beam headlamp defective','main beam headlamp defective'], item: 'Headlamp lens defective', severity: 'low', urgency: 'advisory', costMin: 0, costMax: 60, labourHours: 0.25, notes: '£0-30 for bulb/connector. £30-60 for lens unit. MOT fail if affecting light output.', partsIncluded: false },
    { keywords: ['rear registration plate lamp defective','number plate lamp not working','license plate lamp defective'], item: 'Number plate lamp defective', severity: 'low', urgency: 'advisory', costMin: 0, costMax: 30, labourHours: 0.25, notes: '£5-15 bulb. MOT fail item.', partsIncluded: true },
    { keywords: ['stop lamp defective','brake light not working','stop light defective','rear lamp not working'], item: 'Brake / stop lamp defective', severity: 'high', urgency: 'soon', costMin: 0, costMax: 60, labourHours: 0.25, notes: '£5-20 bulb/connector. MOT fail + safety hazard.', partsIncluded: true },
    // Wheels
    { keywords: ['wheel bearing noisy','wheel bearing excessive play','wheel bearing worn','front wheel bearing noisy','rear wheel bearing noisy'], item: 'Wheel bearing worn / noisy', severity: 'medium', urgency: 'when_due', costMin: 80, costMax: 250, labourHours: 1.5, notes: '£50-150 per bearing + £80-100 labour. MOT advisory if noisy.', partsIncluded: false },
    { keywords: ['alloy wheel damaged','alloy wheel cracked','wheel damaged not allowing bead','tyre not seating','wheel rim cracked'], item: 'Wheel / alloy rim damaged', severity: 'low', urgency: 'advisory', costMin: 0, costMax: 200, labourHours: 0.5, notes: '£0-80 for tyre change. £80-200 to repair/refurbish alloy.', partsIncluded: true },
    // Other common advisories
    { keywords: ['wiper blade deteriorated','wiper blade not cleaning','windscreen wiper deteriorated','wiper rubber perished'], item: 'Wiper blade(s) deteriorated', severity: 'low', urgency: 'advisory', costMin: 10, costMax: 40, labourHours: 0.1, notes: '£8-15 per blade. DIY £5. MOT minor item.', partsIncluded: true },
    { keywords: ['windscreen chipped','windscreen cracked','screen cracked','windscreen stone chip cracked'], item: 'Windscreen cracked / chipped', severity: 'medium', urgency: 'when_due', costMin: 0, costMax: 300, labourHours: 1.0, notes: 'Chip repair £40-60. Full replacement £200-300. MOT fail if in drivers view.', partsIncluded: false },
    { keywords: ['seat belt damaged','seat belt not working correctly','seat belt tensioner defective','seat belt webbing frayed'], item: 'Seat belt defective', severity: 'critical', urgency: 'immediate', costMin: 100, costMax: 500, labourHours: 2.0, notes: '£100-400 for belt assembly + £100-150 labour. MOT fail and life-threatening.', partsIncluded: false },
    { keywords: ['anti-roll bar linkage ball joint excessively worn','drop link worn','anti roll bar link worn','sway bar link worn'], item: 'Anti-roll bar link / drop link worn', severity: 'high', urgency: 'soon', costMin: 50, costMax: 150, labourHours: 1.0, notes: '£25-70 per link + £40-80 labour. MOT advisory — affects handling.', partsIncluded: false },
    { keywords: ['engine mount deteriorated','engine mount broken','torque mount broken','engine support mount failed'], item: 'Engine mount / torque arm deteriorated', severity: 'medium', urgency: 'when_due', costMin: 100, costMax: 350, labourHours: 2.0, notes: '£80-200 per mount + £100-150 labour. Vibrations if ignored.', partsIncluded: false },
    { keywords: ['clutch slipping','clutch wear','clutch judder','clutch biting point high','clutch replacement recommended'], item: 'Clutch slipping / worn', severity: 'high', urgency: 'when_due', costMin: 400, costMax: 900, labourHours: 4.0, notes: '£350-700 for clutch set + £150-250 labour. DMF may double cost.', partsIncluded: false },
    { keywords: ['gearbox oil leaking','gearbox leak','transmission housing leak','gearbox oil level low'], item: 'Gearbox / transmission leak', severity: 'medium', urgency: 'when_due', costMin: 50, costMax: 400, labourHours: 2.0, notes: '£50-150 for gasket/seal + £100-200 labour. Can escalate.', partsIncluded: false },
    { keywords: ['driveshaft gaiter split','driveshaft boot split','cv boot split','constant velocity joint boot split'], item: 'CV / driveshaft boot split', severity: 'high', urgency: 'soon', costMin: 80, costMax: 300, labourHours: 2.0, notes: '£60-150 for boot + £80-150 labour. Joint fails without grease.', partsIncluded: false },
    { keywords: ['water pump leaking','water pump seal leaking','coolant leak from water pump','engine cooling system leak'], item: 'Coolant / water pump leak', severity: 'high', urgency: 'soon', costMin: 100, costMax: 500, labourHours: 2.5, notes: '£80-250 for pump + £100-200 labour. Overheating = engine death.', partsIncluded: false },
    { keywords: ['radiator leaking','radiator core leaking','cooling fan not working','thermostat not working','thermostat stuck open'], item: 'Cooling system fault', severity: 'high', urgency: 'soon', costMin: 80, costMax: 400, labourHours: 1.5, notes: 'Thermostat £30-80 + £60-100 labour. Radiator £150-300 + £80-120 labour.', partsIncluded: false },
    { keywords: ['steering column lock engaged','steering lock malfunction','steering lock not releasing','steering lock fault'], item: 'Steering lock fault', severity: 'critical', urgency: 'immediate', costMin: 100, costMax: 400, labourHours: 1.0, notes: '£80-300 for column lock unit + £80-150 labour.', partsIncluded: false },
    { keywords: ['inhibitor switch defective','gear selector not working','automatic transmission fault','gear position switch defective'], item: 'Gear selector / inhibitor switch', severity: 'medium', urgency: 'when_due', costMin: 80, costMax: 300, labourHours: 1.5, notes: '£60-200 for switch + £80-120 labour.', partsIncluded: false },
    { keywords: ['high mileage indicator','mileage discrepancy','mileage inconsistent','odometer reading unreliable'], item: 'Mileage discrepancy / clock concern', severity: 'critical', urgency: 'immediate', costMin: 0, costMax: 0, labourHours: 0, notes: 'HPI check strongly recommended. Potential clocking — walk away or heavily discount.', partsIncluded: false },
    { keywords: ['hybrid system warning','high voltage system fault','hybrid battery degraded','hybrid battery fault'], item: 'Hybrid battery / system fault', severity: 'critical', urgency: 'when_due', costMin: 500, costMax: 4000, labourHours: 4.0, notes: 'Hybrid battery replacement £1500-4000. Factor into price heavily.', partsIncluded: false },
    { keywords: ['advisory ','minor deterioration','slight wear','nearest to limit','slight roughness','slight play','signs of wear','wear in bush'], item: 'General wear — monitoring advised', severity: 'low', urgency: 'advisory', costMin: 0, costMax: 200, labourHours: 0, notes: 'Not a failure. Monitor at next service.', partsIncluded: false },
  ];

  function matchAdvisories(cleanedText) {
    const lower = cleanedText.toLowerCase();
    const matched = [];
    for (const entry of ADVISORY_DATABASE) {
      for (const kw of entry.keywords) {
        if (lower.includes(kw)) {
          matched.push({
            item: entry.item,
            severity: entry.severity,
            urgency: entry.urgency,
            estimatedCostMin: entry.costMin,
            estimatedCostMax: entry.costMax,
            labourHours: entry.labourHours,
            notes: entry.notes,
            partsIncluded: entry.partsIncluded,
          });
          break;
        }
      }
    }
    return matched;
  }

  function estimateAdvisories(advisoryNotes, motFailures, motTotal, year, engineCc, fuelType) {
    const cleaned = advisoryNotes.join(' ')
      .replace(/\bMOT\s*#?\d*\b/gi, ' ')
      .replace(/\bMOT test\b/gi, ' ')
      .replace(/\b\d+\.\d+\.\d+\s*\([a-z]\)\s*\([i]+\)/gi, ' ')
      .replace(/\b\d+\.\d+\.\d+\s*\([a-z]\)/gi, ' ')
      .replace(/\b\d+\.\d+\s*\([a-z]\s*\([i]+\)\)/gi, ' ')
      .replace(/\b(nearside|offside|both|front|rear|ns|os)\b/gi, ' ')
      .replace(/\b\d+(?:\.\d+)?\s*(?:mm|cm|mph|bhp|cc|rpm|mpg|km|l|kg)\b/gi, ' ')
      .replace(/\b\d{3}\/\d{2}[R\-]\d{2}\b/g, ' ')
      .replace(/,/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const matched = matchAdvisories(cleaned);

    if (matched.length === 0 && advisoryNotes.length > 0) {
      return [{
        item: 'Miscellaneous advisory (see notes)',
        severity: 'medium',
        urgency: 'when_due',
        estimatedCostMin: 50,
        estimatedCostMax: 500,
        labourHours: 1.0,
        notes: `Could not classify: "${advisoryNotes.slice(0, 3).join('; ')}". Assessment recommended.`,
        partsIncluded: false,
      }];
    }
    return matched;
  }

  function estimateValue(make, model, year, mileage, condition) {
    const age = new Date().getFullYear() - year;
    const makeUpper = make.toUpperCase();

    const depreciatedBase = (base) => {
      if (age <= 5) return base * Math.pow(0.80, age);
      if (age <= 10) return base * Math.pow(0.80, 5) * Math.pow(0.85, age - 5);
      if (age <= 15) return base * Math.pow(0.80, 5) * Math.pow(0.85, 5) * Math.pow(0.88, age - 10);
      return base * Math.pow(0.80, 5) * Math.pow(0.85, 5) * Math.pow(0.88, 5) * Math.pow(0.93, age - 15);
    };

    const condMult = { poor: 0.50, fair: 0.70, good: 1.0 };
    let mileageAdj = 0;
    if (mileage !== null) {
      const avgMiles = 10000;
      const expectedMileage = age * avgMiles;
      const mileageDiff = mileage - expectedMileage;
      const ageMultiplier = Math.min(2.0, 1 + age * 0.04);
      if (mileageDiff > 30000) mileageAdj = Math.round(-400 * ageMultiplier);
      else if (mileageDiff > 15000) mileageAdj = Math.round(-200 * ageMultiplier);
      else if (mileageDiff > 0) mileageAdj = Math.round(-100 * ageMultiplier);
      else if (mileageDiff < -15000) mileageAdj = Math.round(250 * ageMultiplier);
      else if (mileageDiff < 0) mileageAdj = Math.round(100 * ageMultiplier);
    }

    let baseRetail = 5000;
    let brandNote = '';
    if (/VAUXHALL|OPEL/i.test(makeUpper)) { baseRetail = 6000; brandNote = ' (Vauxhall/Opel)'; }
    else if (/FORD/i.test(makeUpper)) { baseRetail = 6500; brandNote = ' (Ford)'; }
    else if (/TOYOTA|HONDA|MAZDA|SUBARU/i.test(makeUpper)) { baseRetail = 8000; brandNote = ' (Japanese)'; }
    else if (/BMW|AUDI|MERCEDES/i.test(makeUpper)) { baseRetail = 10000; brandNote = ' (Premium German)'; }
    else if (/VW|VOLKSWAGEN/i.test(makeUpper)) { baseRetail = 7500; brandNote = ' (VW)'; }
    else if (/JAGUAR|LAND ROVER|RANGE ROVER/i.test(makeUpper)) { baseRetail = 12000; brandNote = ' (Premium/Luxury)'; }
    else if (/PEUGEOT|CITROEN|RENAULT|NISSAN|SEAT|SKODA/i.test(makeUpper)) { baseRetail = 5500; brandNote = ' (Mass-market European)'; }

    const cond = condMult[condition] ?? 0.70;
    const rawMin = depreciatedBase(baseRetail) * cond * 0.75;
    const rawMax = depreciatedBase(baseRetail) * cond;
    const baseFloorMin = age >= 15 ? 700 : age >= 10 ? 500 : 400;
    let min = Math.round(rawMin + mileageAdj);
    let max = Math.round(rawMax + mileageAdj);

    if (age >= 15) {
      min = Math.max(min, 700);
      max = Math.max(max, min, Math.round(1200 * cond));
    }

    const notes = `${brandNote} Age: ${age}yr${mileage !== null ? `, Mileage: ${mileage.toLocaleString()} mi` : ''}, Condition: ${condition}.`;
    return { min: Math.max(min, baseFloorMin), max, notes };
  }

  function estimateLifespan(year, advisoryCount, motFailures, fuelType, seriousAdvisories) {
    const age = new Date().getFullYear() - year;
    const diesel = /diesel|cdti|tdi|dti/i.test(fuelType);

    let months;
    let assessment;
    if (seriousAdvisories >= 2) {
      months = 3;
      assessment = `${seriousAdvisories} serious critical/high-severity advisories. Dangerous — do not rely on this car without immediate repairs.`;
    } else if (seriousAdvisories >= 1) {
      months = 6;
      assessment = `${seriousAdvisories} serious advisory present — likely MOT fail next time. Budget for retest + repairs within 6 months.`;
    } else if (advisoryCount >= 8) {
      months = 12;
      assessment = `Many advisories (${advisoryCount}) — mostly wear items accumulating. Budget for tyres, brakes, suspension in next 12 months.`;
    } else if (diesel && age >= 15) {
      months = 18;
      assessment = `Diesel at ${age} years — DPF, turbo, and clutch are the main risks. DPF blockage (£800-2000). 18 months before something expensive.`;
    } else if (age >= 15) {
      months = 18;
      assessment = `${age}-year-old car in reasonable condition. Standard wear items (brakes, tyres, suspension) in the next 12-18 months. No urgent major repairs.`;
    } else if (age >= 10) {
      months = 24;
      assessment = `${age}-year-old car. Wear items due in 12-24 months. No structural concerns.`;
    } else {
      months = 24;
      assessment = `Car in reasonable condition. Standard wear items in 1-2 years. No urgent major repairs anticipated.`;
    }
    return { months, assessment };
  }

  function generateVehicleValuation(make, model, year, mileage, fuelType, advisories, motFailures, motTotal) {
    const hasCritical = advisories.some(a => a.severity === 'critical');
    const hasHigh = advisories.some(a => a.severity === 'high');
    const seriousCount = advisories.filter(a => a.severity === 'critical' || a.severity === 'high').length;

    const condition = hasCritical ? 'poor' : hasHigh ? 'fair' : advisories.length <= 2 ? 'good' : 'fair';
    const value = estimateValue(make, model, year, mileage, condition);
    const lifespan = estimateLifespan(year, advisories.length, motFailures, fuelType, seriousCount);

    const totalAdvisoryCostMin = advisories.reduce((s, a) => s + a.estimatedCostMin, 0);
    const totalAdvisoryCostMax = advisories.reduce((s, a) => s + a.estimatedCostMax, 0);

    const repairPenaltyMin = Math.round(totalAdvisoryCostMin * 0.7);
    const repairPenaltyMax = Math.round(totalAdvisoryCostMax * 0.7);

    const valueWithAdvisoriesMin = Math.max(300, value.min - repairPenaltyMax);
    const valueWithAdvisoriesMax = Math.max(400, value.max - repairPenaltyMin);

    let motFailRisk = 'low';
    if (seriousCount >= 3) motFailRisk = 'high';
    else if (seriousCount >= 1) motFailRisk = 'medium';

    let recommendation;
    if (hasCritical) {
      recommendation = `Critical issues found — do not buy at asking price. Either walk away or negotiate minimum £${totalAdvisoryCostMin.toLocaleString()} off. Serious safety concerns.`;
    } else if (totalAdvisoryCostMax > value.max * 0.5) {
      recommendation = `Repair costs (up to £${totalAdvisoryCostMax.toLocaleString()}) exceed half the car's value. Negotiate hard or avoid.`;
    } else if (seriousCount >= 1) {
      recommendation = `High-severity advisories present. Negotiate at least £${totalAdvisoryCostMin.toLocaleString()} off. Budget total £${(totalAdvisoryCostMin + 200).toLocaleString()}-£${(totalAdvisoryCostMax + 400).toLocaleString()} including retest.`;
    } else {
      recommendation = `Advisories are manageable wear items. Price accordingly — aim to save at least the advisory cost in negotiation. Car is worth £${value.min.toLocaleString()}-£${value.max.toLocaleString()} as-is.`;
    }

    return {
      make, model, year,
      currentValueMin: value.min,
      currentValueMax: value.max,
      valueWithAdvisoriesMin,
      valueWithAdvisoriesMax,
      expectedMonthsRemaining: lifespan.months,
      motFailRisk,
      totalAdvisoryCostMin,
      totalAdvisoryCostMax,
      recommendation,
      lifespanAssessment: lifespan.assessment,
    };
  }

  return { estimateAdvisories, estimateValue, estimateLifespan, generateVehicleValuation, ADVISORY_DATABASE };
})();

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 4: PLATE TYPE DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

function detectPlateType(plate) {
  const clean = plate.replace(/\s/g, '').toUpperCase();
  if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(clean)) return 'VIN';
  if (/^[A-Z]{2}\d{2}[A-Z]{3}$/.test(clean)) return 'UK';
  if (/^[A-Z]\d{1,3}[A-Z]{2,3}$/.test(clean)) return 'UK';
  if (/^[A-Z]{3}\d{1,3}[A-Z]{2}$/.test(clean)) return 'UK';
  if (/^[A-Z]{2}\d{2} [A-Z]{3}$/.test(clean)) return 'UK';
  if (/^[A-Z]{3} ?\d{3}$/.test(clean)) return 'UK';
  if (/^[A-Z0-9]{3,8}$/i.test(clean)) return 'US';
  return 'UNKNOWN';
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 5: DVLA COLLECTOR
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

    const rejectBtn = page.locator('button[name="cookie_consent[usage]"]').filter({ hasText: /reject/i });
    if (await rejectBtn.count() > 0) {
      await rejectBtn.click();
      await page.waitForLoadState('networkidle', { timeout: 10_000 });
    }

    await page.locator('#wizard_vehicle_enquiry_capture_vrn_vrn').fill(plate);
    await page.locator('button:text-is("Continue")').click();
    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    const rows = page.locator('.govuk-summary-list__row');
    const rowCount = await rows.count();
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const keyEl = row.locator('.govuk-summary-list__key');
      const valEl = row.locator('.govuk-summary-list__value');
      if (await keyEl.count() > 0 && await valEl.count() > 0) {
        const key = (await keyEl.textContent())?.trim() || '';
        const val = (await valEl.textContent())?.trim() || '';
        if (key && val) result.rawData[key] = val;
      }
    }

    const makeKey = Object.keys(result.rawData).find(k => /make/i.test(k));
    const colourKey = Object.keys(result.rawData).find(k => /colour/i.test(k));

    if (makeKey) result.findings.push({ source: 'GovUK-DVLA', field: 'make', value: String(result.rawData[makeKey]), confidence: 95 });
    if (colourKey) result.findings.push({ source: 'GovUK-DVLA', field: 'colour', value: String(result.rawData[colourKey]), confidence: 95 });

    const taxStatus = Object.keys(result.rawData).find(k => /tax\s*status/i.test(k));
    if (taxStatus) result.findings.push({ source: 'GovUK-DVLA', field: 'tax_status', value: String(result.rawData[taxStatus]), confidence: 95 });
    const motStatusKey = Object.keys(result.rawData).find(k => /MOT\s*status/i.test(k));
    if (motStatusKey) result.findings.push({ source: 'GovUK-DVLA', field: 'mot_status', value: String(result.rawData[motStatusKey]), confidence: 95 });
    const firstRegKey = Object.keys(result.rawData).find(k => /first\s*registered/i.test(k));
    if (firstRegKey) result.findings.push({ source: 'GovUK-DVLA', field: 'first_reg_date', value: String(result.rawData[firstRegKey]), confidence: 90 });

    if (Object.keys(result.rawData).length === 0) {
      result.errors.push('DVLA returned empty result');
    }
  } catch (err) {
    result.errors.push(`DVLA lookup failed: ${err}`);
  } finally {
    if (browser) await browser.close();
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 6: CARCHECK COLLECTOR
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
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      extraHTTPHeaders: { 'Accept-Language': 'en-GB,en;q=0.9' },
    });
    const page = await ctx.newPage();

    page.on('dialog', async d => { try { await d.accept(); } catch {} });

    await page.goto('https://www.car-checking.com/', { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await page.waitForSelector('#subForm1, form', { timeout: 15_000 });
    await page.waitForTimeout(2000);

    const regInput = page.locator('#subForm1');
    if (await regInput.count() === 0) {
      result.errors.push('car-checking.com: reg input not found');
      return result;
    }

    await regInput.fill(plate);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 25_000 }).catch(() => {}),
      page.locator('button[type="submit"]').first().click(),
    ]);

    await page.waitForTimeout(5000);

    const bodyText = await page.locator('body').textContent() ?? '';
    if (/wait a bit longer|please wait|try again later/i.test(bodyText)) {
      result.errors.push('car-checking.com: rate limited (wait between lookups)');
      await ctx.close();
      return result;
    }

    if (bodyText.length < 200) {
      await page.waitForTimeout(5000);
    }

    const finalText = await page.locator('body').textContent() ?? '';
    result.rawData['raw_text'] = finalText.substring(0, 5000);

    if (finalText.trim().length < 50) {
      result.errors.push('car-checking.com: no report data returned');
      await ctx.close();
      return result;
    }

    // Parse specification section
    const specPairs = [
      ['Make', 'make'], ['Model', 'model'], ['Colour', 'colour'],
      ['Year of manufacture', 'year'], ['Top speed', 'top_speed'],
      ['0 to 60 MPH', 'zero_to_60'], ['Gearbox', 'gearbox'],
      ['Engine & fuel consumption', 'engine'], ['Power', 'power'],
      ['Torque', 'torque'], ['Engine capacity', 'engine_capacity'],
      ['Cylinders', 'cylinders'], ['Fuel type', 'fuel_type'],
      ['Consumption city', 'consumption_city'],
      ['Consumption extra urban', 'consumption_extra_urban'],
      ['Consumption combined', 'consumption_combined'],
      ['CO2 emission', 'co2_emission'], ['CO2 label', 'co2_label'],
    ];

    for (const [label, field] of specPairs) {
      const regex = new RegExp(`${label}\\s*\\n\\s*([\\S ]{2,80})`, 'i');
      const m = finalText.match(regex);
      if (m) {
        const snippet = m[1]?.trim().replace(/\s+/g, ' ') ?? '';
        if (snippet && snippet.length > 1 && snippet.length < 100) {
          result.rawData[field] = snippet;
        }
      }
    }

    // Parse MOT section
    const motExpiryMatch = finalText.match(/MOT expiry date[\s\n]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (motExpiryMatch) {
      result.findings.push({ source: 'car-checking.com', field: 'mot_expiry', value: motExpiryMatch[1], confidence: 95 });
      result.rawData['mot_expiry'] = motExpiryMatch[1];
    }

    const motPassRateMatch = finalText.match(/MOT pass rate[\s\n]+(\d+)\s*%/i);
    if (motPassRateMatch) {
      result.findings.push({ source: 'car-checking.com', field: 'mot_pass_rate', value: motPassRateMatch[1] + '%', confidence: 90 });
    }

    const motPassedMatch = finalText.match(/MOT passed[\s\n]+(\d+)/i);
    if (motPassedMatch) {
      result.findings.push({ source: 'car-checking.com', field: 'mot_passed', value: motPassedMatch[1], confidence: 90 });
    }

    const motFailedMatch = finalText.match(/Failed MOT tests[\s\n]+(\d+)/i);
    if (motFailedMatch) {
      result.findings.push({ source: 'car-checking.com', field: 'mot_failed', value: motFailedMatch[1], confidence: 90 });
    }

    // Make/model/year from header
    const makeModelMatch = finalText.match(/(VAUXHALL|OPEL|FORD|TOYOTA|BMW|MERCEDES|AUDI|VOLKSWAGEN|CHRYSLER|JAGUAR|LAND ROVER|OTHER)[\s\n]+([A-Z0-9 \-+]+)[\s\n]+(\d{4})/i);
    if (makeModelMatch) {
      const m = makeModelMatch[1].toUpperCase();
      const mod = makeModelMatch[2].trim();
      const yr = makeModelMatch[3];
      if (!result.rawData['make']) result.findings.push({ source: 'car-checking.com', field: 'make', value: m, confidence: 95 });
      if (!result.rawData['model']) result.findings.push({ source: 'car-checking.com', field: 'model', value: mod, confidence: 90 });
      if (!result.rawData['year']) result.findings.push({ source: 'car-checking.com', field: 'year', value: yr, confidence: 95 });
    }

    // Mileage timeline extraction
    const mileageMap = {};
    const motBlockRe = /MOT #\d+[\s\S]*?(?=MOT #\d+|$)/gi;
    for (const block of finalText.matchAll(motBlockRe)) {
      const m = block[0].match(/(\d{5,6})\s*(?:mi\.?|miles\b|mileage)/i);
      if (m) {
        const num = parseInt(m[1], 10);
        const numM = block[0].match(/MOT #(\d+)/i);
        if (numM) mileageMap[numM[1]] = num;
      }
    }
    const mileageTimeline = Object.entries(mileageMap)
      .sort(([a], [b]) => parseInt(b) - parseInt(a))
      .map(([, miles]) => miles);
    const currentMileage = mileageTimeline[0] ?? null;
    if (currentMileage) {
      result.findings.push({ source: 'car-checking.com', field: 'current_mileage', value: `${currentMileage.toLocaleString()} mi`, confidence: 85 });
      result.rawData['current_mileage'] = currentMileage;
    }
    if (mileageTimeline.length > 0) {
      result.rawData['mileage_timeline'] = mileageTimeline;
    }

    // Extract all advisory items
    const advisoryLines = [];
    const allItemsRe = /(?:^|\s)(Advice|Advisory)\s+([^\n]{10,200})/gim;
    for (const match of finalText.matchAll(allItemsRe)) {
      const item = match[2]?.trim();
      if (item && item.length > 5) advisoryLines.push(item);
    }
    result.rawData['advisory_lines'] = advisoryLines;

    await ctx.close();
  } catch (err) {
    result.errors.push(`car-checking.com failed: ${err}`);
  } finally {
    if (browser) await browser.close();
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 7: GOV.UK MOT COLLECTOR
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
    const page = await browser.newPage();

    await page.goto('https://www.gov.uk/check-mot-history', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(1000);

    const regInput = page.locator('#vrm');
    if (await regInput.count() === 0) {
      result.errors.push('gov.uk MOT: reg input not found');
      return result;
    }
    await regInput.fill(plate);
    await page.locator('button[type="submit"], a[href*="mot-history"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 30_000 });
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent() ?? '';
    result.rawData['raw_text'] = bodyText.substring(0, 4000);

    const expiryMatch = bodyText.match(/expiry date[\s\n]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (expiryMatch) {
      result.findings.push({ source: 'GovUK-MOT', field: 'mot_expiry', value: expiryMatch[1], confidence: 95 });
      result.rawData['mot_expiry'] = expiryMatch[1];
    }

    const testDateMatch = bodyText.match(/test date[\s\n]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (testDateMatch) {
      result.findings.push({ source: 'GovUK-MOT', field: 'last_mot_date', value: testDateMatch[1], confidence: 95 });
      result.rawData['last_mot_date'] = testDateMatch[1];
    }

    const mileageMatch = bodyText.match(/(\d{4,6})\s*(?:miles|mi)/i);
    if (mileageMatch) {
      result.findings.push({ source: 'GovUK-MOT', field: 'last_odometer', value: mileageMatch[1] + ' miles', confidence: 90 });
      result.rawData['last_odometer'] = mileageMatch[1];
    }

    if (/MOT pass|PASSED/i.test(bodyText)) {
      result.findings.push({ source: 'GovUK-MOT', field: 'mot_result', value: 'PASS', confidence: 95 });
      result.rawData['mot_result'] = 'PASS';
    } else if (/MOT fail|FAILED/i.test(bodyText)) {
      result.findings.push({ source: 'GovUK-MOT', field: 'mot_result', value: 'FAIL', confidence: 95 });
      result.rawData['mot_result'] = 'FAIL';
    }

    const advisories = [];
    const advisoryRe = /(Advisory|Advice)[\s\n]+([^\n]{5,150})/gi;
    for (const m of bodyText.matchAll(advisoryRe)) {
      const item = m[2]?.trim();
      if (item && item.length > 5) advisories.push(item);
    }
    if (advisories.length > 0) result.rawData['govuk_advisories'] = advisories;

  } catch (err) {
    result.errors.push(`GovUK MOT: ${err}`);
  } finally {
    if (browser) await browser.close();
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 8: NHTSA VIN COLLECTOR
// ═══════════════════════════════════════════════════════════════════════════════

async function collectVin(vin) {
  const result = { findings: [], errors: [], rawData: {} };
  
  try {
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`;
    const text = await HTTP.osintFetch(url, { timeout: 15_000 });
    let json;
    try { json = JSON.parse(text); } catch { json = { Results: [] }; }

    if (json.Results.length === 0) {
      result.errors.push('NHTSA: empty response');
      return result;
    }

    const r = json.Results[0];
    const fields = [
      ['Make', 'make'], ['Model', 'model'], ['Model Year', 'year'],
      ['Body Class', 'body_type'], ['Engine Number', 'engine_number'],
      ['Engine Displacement (CC)', 'engine_cc'], ['Cylinders', 'cylinders'],
      ['Fuel Type - Primary', 'fuel_type'], ['Transmission', 'transmission'],
      ['Drive Type', 'drive_type'], ['Brake System Type', 'brake_type'],
      ['Plant Country', 'plant_country'], ['Manufacturer Name', 'manufacturer'],
      ['Plant State/Province', 'plant_state'], ['Vehicle Type', 'vehicle_type'],
      ['Plant Company Name', 'plant_company'],
    ];

    for (const [nhtsaKey, fieldName] of fields) {
      const val = r[nhtsaKey];
      if (val && val.trim() !== '' && val.trim() !== 'Not Applicable' && val.trim() !== '0') {
        result.rawData[fieldName] = val.trim();
        result.findings.push({ source: 'NHTSA-vPIC', field: fieldName, value: val.trim(), confidence: 90 });
      }
    }

    if (result.findings.length === 0) {
      result.errors.push('NHTSA: VIN decoded but no usable data (vehicle may not be US-market)');
    }

  } catch (err) {
    result.errors.push(`NHTSA vPIC lookup failed: ${err}`);
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 9: REPORT GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

function parseMotDate(str) {
  if (!str) return null;
  const parts = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (parts) {
    let year = parseInt(parts[3]);
    if (year < 100) year += year > 50 ? 1900 : 2000;
    return new Date(year, parseInt(parts[2]) - 1, parseInt(parts[1]));
  }
  const iso = new Date(str);
  return isNaN(iso.getTime()) ? null : iso;
}

function formatDate(d) {
  if (!d) return 'N/A';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function generateMarkdownReport(data) {
  const lines = [];
  const today = new Date().toISOString().split('T')[0];

  lines.push(`# Vehicle OSINT Report — ${data.plate}`);
  lines.push('');
  lines.push(`**Registration:** ${data.plate}  `);
  lines.push(`**Report Date:** ${today}  `);
  lines.push(`**Data Sources:** DVLA, car-checking.com, Gov.uk MOT  `);
  lines.push('');

  // ── Section 1: Vehicle Header Card ─────────────────────────────────────────
  lines.push('## 1. Vehicle Header Card');
  lines.push('');
  lines.push('```');
  lines.push(`  Registration: ${data.plate}`);
  lines.push(`  Make: ${data.make || 'Unknown'}`);
  lines.push(`  Model: ${data.model || 'Unknown'}`);
  lines.push(`  Year: ${data.year || 'Unknown'}`);
  lines.push(`  Colour: ${data.colour || 'Unknown'}`);
  lines.push(`  Fuel Type: ${data.fuelType || 'Unknown'}`);
  lines.push(`  Engine Size: ${data.engineCc ? `${data.engineCc} cc` : 'N/A'}`);
  lines.push(`  Transmission: ${data.gearbox || 'N/A'}`);
  lines.push('```');
  lines.push('');

  // ── Section 2: Vehicle Status ─────────────────────────────────────────────
  lines.push('## 2. Vehicle Status');
  lines.push('');
  lines.push('```');
  lines.push(`  DVLA Tax Status: ${data.taxStatus || 'N/A'}`);
  lines.push(`  MOT Status: ${data.motStatus || 'N/A'}`);
  lines.push(`  MOT Expiry: ${data.motExpiry || 'N/A'}`);
  lines.push(`  First Registered: ${data.firstRegDate || 'N/A'}`);
  lines.push('```');
  lines.push('');

  // ── Section 3: MOT Intelligence ─────────────────────────────────────────────
  lines.push('## 3. MOT History Intelligence');
  lines.push('');
  lines.push(`**MOT Pass Rate:** ${data.motPassRate || 'N/A'}`);
  lines.push(`**MOT Passed:** ${data.motPassed || 0} | **Failed:** ${data.motFailed || 0}`);
  lines.push('');
  if (data.advisories && data.advisories.length > 0) {
    lines.push('**Advisories / Defects:**');
    lines.push('');
    for (const a of data.advisories) {
      const sevEmoji = a.severity === 'critical' ? '🔴' : a.severity === 'high' ? '🟠' : a.severity === 'medium' ? '🟡' : '🟢';
      lines.push(`  ${sevEmoji} [${a.severity.toUpperCase()}] ${a.item} — £${a.estimatedCostMin}-£${a.estimatedCostMax}`);
    }
    lines.push('');
  } else {
    lines.push('**Advisories:** None recorded on last MOT.');
    lines.push('');
  }

  // ── Section 4: Mileage Intelligence ─────────────────────────────────────────
  lines.push('## 4. Mileage Intelligence');
  lines.push('');
  if (data.mileageTimeline && data.mileageTimeline.length > 0) {
    lines.push('| # | Mileage |');
    lines.push('| --- | --- |');
    data.mileageTimeline.slice(0, 10).forEach((m, i) => {
      lines.push(`| MOT #${i + 1} | ${typeof m === 'number' ? m.toLocaleString() : m.toLocaleString()} mi |`);
    });
    lines.push('');
    if (data.currentMileage) {
      lines.push(`**Current Mileage (est.):** ${typeof data.currentMileage === 'number' ? data.currentMileage.toLocaleString() : data.currentMileage} mi`);
      lines.push('');
    }
  } else {
    lines.push('No mileage history available.');
    lines.push('');
  }

  // ── Section 5: Valuation ─────────────────────────────────────────────────────
  lines.push('## 5. Market Valuation');
  lines.push('');
  if (data.valuation) {
    const v = data.valuation;
    lines.push(`**Estimated Market Value:** £${v.currentValueMin.toLocaleString()} – £${v.currentValueMax.toLocaleString()}`);
    lines.push(`**As-is Value (with advisories):** £${v.valueWithAdvisoriesMin.toLocaleString()} – £${v.valueWithAdvisoriesMax.toLocaleString()}`);
    lines.push(`**Total Advisory Costs:** £${v.totalAdvisoryCostMin.toLocaleString()} – £${v.totalAdvisoryCostMax.toLocaleString()}`);
    lines.push(`**Expected Months Remaining:** ${v.expectedMonthsRemaining} months`);
    lines.push(`**MOT Fail Risk:** ${v.motFailRisk.toUpperCase()}`);
    lines.push('');
    lines.push('**Recommendation:**');
    lines.push('');
    lines.push(`> ${v.recommendation}`);
    lines.push('');
  } else {
    lines.push('Market valuation not available.');
    lines.push('');
  }

  // ── Section 6: Risk Rating ──────────────────────────────────────────────────
  lines.push('## 6. Overall Risk Rating');
  lines.push('');
  const criticalCount = (data.advisories || []).filter(a => a.severity === 'critical').length;
  const highCount = (data.advisories || []).filter(a => a.severity === 'high').length;
  const mediumCount = (data.advisories || []).filter(a => a.severity === 'medium').length;
  const lowCount = (data.advisories || []).filter(a => a.severity === 'low').length;

  const riskRating = criticalCount > 0 || highCount > 2
    ? '🔴 HIGH'
    : highCount > 0 || mediumCount >= 3
      ? '🟡 MODERATE'
      : '🟢 LOW';

  lines.push(`**${riskRating}**`);
  lines.push('');
  lines.push('| Severity | Count |');
  lines.push('| --- | --- |');
  if (criticalCount > 0) lines.push(`| 🔴 Critical | ${criticalCount} |`);
  if (highCount > 0) lines.push(`| 🟠 High | ${highCount} |`);
  if (mediumCount > 0) lines.push(`| 🟡 Medium | ${mediumCount} |`);
  if (lowCount > 0) lines.push(`| 🟢 Low | ${lowCount} |`);
  if (!data.advisories || data.advisories.length === 0) lines.push('| 🟢 None | 0 |');
  lines.push('');

  // ── Section 7: Risk Flags ───────────────────────────────────────────────────
  lines.push('## 7. Risk Flags');
  lines.push('');
  if (data.riskFlags && data.riskFlags.length > 0) {
    for (const flag of data.riskFlags) {
      lines.push(`- ${flag}`);
    }
  } else {
    lines.push('- No significant risk flags identified.');
  }
  lines.push('');

  // ── Section 8: Collector Results ─────────────────────────────────────────────
  lines.push('## 8. Data Sources & Errors');
  lines.push('');
  if (data.collectorErrors && data.collectorErrors.length > 0) {
    lines.push('**Errors encountered:**');
    for (const err of data.collectorErrors) {
      lines.push(`- ${err}`);
    }
    lines.push('');
  }
  lines.push('**Source availability:**');
  lines.push(`- DVLA: ${data.dvlaAvailable ? '✅ Data retrieved' : '❌ Not available'}`);
  lines.push(`- car-checking.com: ${data.carCheckAvailable ? '✅ Data retrieved' : '❌ Not available / rate limited'}`);
  lines.push(`- Gov.uk MOT: ${data.govUkMotAvailable ? '✅ Data retrieved' : '❌ Not available'}`);
  lines.push('');

  // ── Section 9: Analyst Summary ──────────────────────────────────────────────
  lines.push('## 9. Analyst Summary');
  lines.push('');
  const summaryParts = [];
  if (data.make && data.model) {
    summaryParts.push(`${data.make} ${data.model}`);
  }
  if (data.motStatus) {
    summaryParts.push(`MOT: ${data.motStatus}`);
  }
  if (data.motPassRate) {
    summaryParts.push(`${data.motPassRate} pass rate`);
  }
  if (data.valuation) {
    summaryParts.push(`Value: £${data.valuation.currentValueMin.toLocaleString()}-£${data.valuation.currentValueMax.toLocaleString()}`);
  }
  summaryParts.push(`Risk: ${riskRating}`);
  lines.push(summaryParts.join(' | '));
  lines.push('');
  if (data.valuation && data.valuation.recommendation) {
    lines.push(data.valuation.recommendation);
    lines.push('');
  }

  // ── Footer ──────────────────────────────────────────────────────────────────
  lines.push('---');
  lines.push(`*Report generated by Vehicle OSINT Pipeline — ${new Date().toISOString()}*`);

  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 10: MAIN ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════════

async function runVehicleOsint(plate) {
  const clean = plate.replace(/\s/g, '').toUpperCase();
  const plateType = detectPlateType(clean);

  console.log(`\n🔍 Vehicle OSINT — Starting scan for: ${clean} (type: ${plateType})`);

  const allFindings = [];
  const allErrors = [];
  const rawData = { plate: clean };
  let carCheckRaw = null;
  let dvlaRaw = null;

  if (plateType === 'UK') {
    console.log('\n📡 Querying UK sources in parallel (DVLA + car-checking.com + Gov.uk MOT)...');
    
    const [dvlaResult, carCheckResult, govUkResult] = await Promise.allSettled([
      collectDVLA(clean),
      collectCarCheck(clean),
      collectGovUkMot(clean),
    ]);

    // DVLA
    if (dvlaResult.status === 'fulfilled') {
      allFindings.push(...dvlaResult.value.findings);
      allErrors.push(...dvlaResult.value.errors);
      rawData['DVLA'] = dvlaResult.value.rawData;
      dvlaRaw = dvlaResult.value.rawData;
      if (dvlaResult.value.findings.length > 0) {
        console.log('  ✅ DVLA: OK');
      } else {
        console.log('  ⚠️  DVLA: returned no data');
      }
    } else {
      allErrors.push(`DVLA: ${dvlaResult.reason}`);
      console.log('  ❌ DVLA: failed');
    }

    // CarCheck
    if (carCheckResult.status === 'fulfilled') {
      allFindings.push(...carCheckResult.value.findings);
      allErrors.push(...carCheckResult.value.errors);
      rawData['CarCheck'] = carCheckResult.value.rawData;
      carCheckRaw = carCheckResult.value.rawData;
      if (carCheckResult.value.findings.length > 0) {
        console.log('  ✅ car-checking.com: OK');
      } else {
        console.log('  ⚠️  car-checking.com: returned no data (may be rate limited)');
      }
    } else {
      allErrors.push(`car-checking.com: ${carCheckResult.reason}`);
      console.log('  ❌ car-checking.com: failed');
    }

    // Gov.uk MOT
    if (govUkResult.status === 'fulfilled') {
      allFindings.push(...govUkResult.value.findings);
      allErrors.push(...govUkResult.value.errors);
      rawData['GovUkMot'] = govUkResult.value.rawData;
      if (govUkResult.value.findings.length > 0) {
        console.log('  ✅ Gov.uk MOT: OK');
      } else {
        console.log('  ⚠️  Gov.uk MOT: returned no data');
      }
    } else {
      allErrors.push(`Gov.uk MOT: ${govUkResult.reason}`);
      console.log('  ❌ Gov.uk MOT: failed');
    }

  } else if (plateType === 'VIN') {
    console.log('\n📡 Querying NHTSA vPIC for VIN...');
    const vinResult = await Promise.allSettled([collectVin(clean)]);
    if (vinResult[0].status === 'fulfilled') {
      allFindings.push(...vinResult[0].value.findings);
      allErrors.push(...vinResult[0].value.errors);
      rawData['NHTSA'] = vinResult[0].value.rawData;
      console.log('  ✅ NHTSA vPIC: OK');
    } else {
      allErrors.push(`NHTSA: ${vinResult[0].reason}`);
      console.log('  ❌ NHTSA vPIC: failed');
    }

  } else if (plateType === 'US') {
    console.log('\n⚠️  US plate detected — limited data available without state DMV.');
    allFindings.push({
      source: 'VehicleCollector',
      field: 'note',
      value: 'US plate lookup requires state-specific DMV. For full data, use VIN lookup instead.',
      confidence: 0,
    });
  } else {
    allFindings.push({
      source: 'VehicleCollector',
      field: 'note',
      value: 'Unrecognised format. Supported: UK reg (KY05YTJ), VIN (17 chars), US plate.',
      confidence: 0,
    });
  }

  // ── Extract fields for report ───────────────────────────────────────────────
  const find = (field) => {
    const f = allFindings.find(f => f.field === field);
    return f ? f.value : null;
  };

  const make = find('make') || (dvlaRaw && Object.keys(dvlaRaw).find(k => /make/i.test(k)) ? dvlaRaw[Object.keys(dvlaRaw).find(k => /make/i.test(k))] : null) || (carCheckRaw ? carCheckRaw['make'] : null) || 'Unknown';
  const colour = find('colour') || (dvlaRaw && Object.keys(dvlaRaw).find(k => /colour/i.test(k)) ? dvlaRaw[Object.keys(dvlaRaw).find(k => /colour/i.test(k))] : null) || (carCheckRaw ? carCheckRaw['colour'] : null) || 'Unknown';
  const model = carCheckRaw ? carCheckRaw['model'] : find('model') || '';
  const year = parseInt(find('year') || carCheckRaw?.['year'] || '0', 10) || 0;
  const fuelType = find('fuel_type') || carCheckRaw?.['fuel_type'] || 'PETROL';
  const engineCcStr = carCheckRaw?.['engine_capacity'] || find('engine_capacity') || '';
  const engineCc = parseInt(String(engineCcStr).replace(/\D/g, ''), 10) || 0;
  const gearbox = find('gearbox') || carCheckRaw?.['gearbox'] || 'Unknown';
  const motExpiry = find('mot_expiry') || carCheckRaw?.['mot_expiry'] || '';
  const motPassRate = find('mot_pass_rate') || '';
  const motPassed = parseInt(find('mot_passed') || carCheckRaw?.['mot_passed'] || '0', 10) || 0;
  const motFailed = parseInt(find('mot_failed') || carCheckRaw?.['mot_failed'] || '0', 10) || 0;
  const taxStatus = find('tax_status') || dvlaRaw ? Object.keys(dvlaRaw || {}).find(k => /tax/i.test(k)) ? dvlaRaw[Object.keys(dvlaRaw).find(k => /tax/i.test(k))] : null : null;
  const firstRegDate = find('first_reg_date') || '';
  const currentMileage = carCheckRaw?.['current_mileage'] || null;
  const mileageTimeline = carCheckRaw?.['mileage_timeline'] || [];
  const rawText = carCheckRaw?.['raw_text'] || '';
  const motStatus = motExpiry ? (parseMotDate(motExpiry) > new Date() ? 'Valid' : 'Expired') : (motPassed > 0 || motFailed > 0 ? 'Unknown' : 'No MOT data');

  // ── Generate valuation ──────────────────────────────────────────────────────
  let valuation = null;
  if (make !== 'Unknown' || model) {
    try {
      // Gather advisory lines
      let advisoryLines = carCheckRaw?.['advisory_lines'] || [];
      if (advisoryLines.length === 0 && rawText) {
        const allItemsRe = /(?:^|\s)(Advice|Advisory)\s+([^\n]{10,200})/gim;
        for (const match of rawText.matchAll(allItemsRe)) {
          const item = match[2]?.trim();
          if (item && item.length > 5) advisoryLines.push(item);
        }
      }

      const motTotal = motFailed + motPassed;
      const advisoryCosts = VALUATION.estimateAdvisories(advisoryLines, motFailed, motTotal, year, engineCc, fuelType);
      valuation = VALUATION.generateVehicleValuation(
        String(make),
        String(model),
        year,
        currentMileage,
        fuelType,
        advisoryCosts,
        motFailed,
        motTotal
      );

      console.log(`\n💰 Valuation: £${valuation.currentValueMin.toLocaleString()}-£${valuation.currentValueMax.toLocaleString()} | Risk: ${valuation.motFailRisk.toUpperCase()}`);
    } catch (valErr) {
      console.log(`\n⚠️  Valuation generation failed: ${valErr}`);
    }
  }

  // ── Build risk flags ────────────────────────────────────────────────────────
  const riskFlags = [];
  if (valuation && valuation.motFailRisk === 'high') riskFlags.push('⚠️ High MOT fail risk — serious advisories present');
  if (valuation && valuation.totalAdvisoryCostMax > (valuation.currentValueMax || 1) * 0.5) riskFlags.push('⚠️ Repair costs exceed 50% of vehicle value');
  if (motFailed >= 3) riskFlags.push(`⚠️ Repeated failures: ${motFailed} fails on record`);
  if (motExpiry && parseMotDate(motExpiry) < new Date()) riskFlags.push('⚠️ MOT has expired');
  if (motExpiry && parseMotDate(motExpiry) && (parseMotDate(motExpiry).getTime() - Date.now()) < 30 * 86400000) riskFlags.push('⚠️ MOT expiring within 30 days');

  // ── Build report data ──────────────────────────────────────────────────────
  const reportData = {
    plate: clean,
    make: String(make),
    model: String(model),
    year,
    colour: String(colour),
    fuelType: String(fuelType),
    engineCc,
    gearbox: String(gearbox),
    taxStatus: taxStatus ? String(taxStatus) : null,
    motStatus,
    motExpiry,
    motPassRate,
    motPassed,
    motFailed,
    firstRegDate,
    currentMileage,
    mileageTimeline,
    valuation,
    advisories: valuation ? VALUATION.estimateAdvisories(
      carCheckRaw?.['advisory_lines'] || [],
      motFailed,
      motFailed + motPassed,
      year,
      engineCc,
      fuelType
    ) : [],
    riskFlags,
    collectorErrors: allErrors,
    dvlaAvailable: dvlaRaw && Object.keys(dvlaRaw).length > 0,
    carCheckAvailable: carCheckRaw && Object.keys(carCheckRaw).length > 0,
    govUkMotAvailable: !!(rawData['GovUkMot'] && Object.keys(rawData['GovUkMot'] || {}).length > 0),
  };

  return reportData;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 11: FILE I/O
// ═══════════════════════════════════════════════════════════════════════════════

const FS = {
  writeFileSync(path, data) {
    // Simple polyfill for Node.js fs.writeFileSync
    const { writeFileSync: _write } = require('fs');
    return _write(path, data, 'utf8');
  },
  mkdirSync(dir) {
    const { mkdirSync: _mkdir } = require('fs');
    return _mkdir(dir, { recursive: true });
  },
};

function saveReport(content, plate, outputPath) {
  if (outputPath) {
    // User-specified path
    const dir = outputPath.replace(/[/\\][^/\\]*$/, '').replace(/[^/\\]*$/, '') || '.';
    const file = outputPath.replace(/^.*[/\\]/, '') || `vehicle-${plate}.md`;
    try { FS.mkdirSync(dir); } catch {}
    const fullPath = outputPath;
    FS.writeFileSync(fullPath, content);
    return fullPath;
  } else {
    // Default: reports/osint/YYYY-MM-DD/vehicle-<PLATE>.md
    const today = new Date().toISOString().split('T')[0];
    const dir = `reports${require('path').sep}osint${require('path').sep}${today}`;
    try { FS.mkdirSync(dir); } catch {}
    const fullPath = `${dir}${require('path').sep}vehicle-${plate}.md`;
    FS.writeFileSync(fullPath, content);
    return fullPath;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 12: MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  const { plate, outputPath } = CLI;
  const clean = plate.replace(/\s/g, '').toUpperCase();

  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║         Vehicle OSINT Pipeline — Standalone    ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  let reportData;
  try {
    reportData = await runVehicleOsint(plate);
  } catch (err) {
    console.error(`\n❌ Fatal error: ${err}`);
    process.exit(1);
  }

  // ── Generate and save report ──────────────────────────────────────────────
  const markdown = generateMarkdownReport(reportData);
  const savedPath = saveReport(markdown, clean, outputPath);

  // ── Console summary ─────────────────────────────────────────────────────────
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  === Vehicle OSINT Report: ${clean} ===`);
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Registration: ${clean}`);
  console.log(`  Make: ${reportData.make} | Colour: ${reportData.colour}`);
  console.log(`  MOT Expiry: ${reportData.motExpiry || 'N/A'} | Pass Rate: ${reportData.motPassRate || 'N/A'}`);
  if (reportData.valuation) {
    console.log(`  Estimated Value: £${reportData.valuation.currentValueMin.toLocaleString()}-£${reportData.valuation.currentValueMax.toLocaleString()}`);
  }
  const riskLabel = reportData.valuation
    ? (reportData.valuation.motFailRisk === 'high' ? '🔴 HIGH' : reportData.valuation.motFailRisk === 'medium' ? '🟡 MODERATE' : '🟢 LOW')
    : '⚪ UNKNOWN';
  console.log(`  Risk: ${riskLabel}`);
  console.log(`  Full report saved to: ${savedPath}`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  if (reportData.collectorErrors && reportData.collectorErrors.length > 0) {
    console.log('⚠️  Errors encountered:');
    for (const err of reportData.collectorErrors.slice(0, 5)) {
      console.log(`   - ${err}`);
    }
    console.log('');
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
