/**
 * VehicleValuation.ts
 * UK-used-car valuation and advisory cost estimator.
 * No external API calls — all data is hardcoded local knowledge.
 */
const ADVISORY_DATABASE = [
    // ── Tyres ────────────────────────────────────────────────────────────────────
    {
        keywords: ['tyre worn close to legal limit', 'tyres worn close to legal limit'],
        item: 'Tyre(s) worn close to legal limit',
        severity: 'medium',
        urgency: 'soon',
        costMin: 90,
        costMax: 155,
        labourHours: 0.5,
        notes: '£80-140 per tyre + £10-15 fitting. MOT pass but retest due soon. Replace proactively.',
        partsIncluded: true,
    },
    {
        keywords: ['tyre worn on edge', 'tyres worn on edge', 'tyres below legal limit', 'tyre below legal limit',
            'tyres worn below legal', 'tyre worn below legal'],
        item: 'Tyre(s) worn below legal limit',
        severity: 'critical',
        urgency: 'immediate',
        costMin: 90,
        costMax: 155,
        labourHours: 0.5,
        notes: 'ILLEGAL. Do not drive. £80-140 per tyre + £10-15 fitting each.',
        partsIncluded: true,
    },
    {
        keywords: ['tyre slightly damaged', 'tyres slightly damaged', 'tyre slight damage', 'tyres slight damage',
            'perishing', 'cracking on tyre', 'cracking on tyres'],
        item: 'Tyre(s) slightly damaged / perishing',
        severity: 'low',
        urgency: 'soon',
        costMin: 40,
        costMax: 80,
        labourHours: 0.25,
        notes: '£40-80 per tyre. Monitor — may not need immediate replacement.',
        partsIncluded: true,
    },
    // ── Suspension ──────────────────────────────────────────────────────────────
    {
        keywords: ['coil spring fractured', 'coil spring broken', 'coil spring split'],
        item: 'Coil spring fractured/broken',
        severity: 'critical',
        urgency: 'immediate',
        costMin: 250,
        costMax: 600,
        labourHours: 2.5,
        notes: '£150-400 per spring + £100-200 labour + wheel alignment. Structural failure risk.',
        partsIncluded: false,
    },
    {
        keywords: ['shock absorber leaking', 'shock absorber has a light leak', 'damper leaking',
            'strut mount deteriorated', 'top mount failure'],
        item: 'Shock absorber / strut leaking',
        severity: 'high',
        urgency: 'soon',
        costMin: 150,
        costMax: 400,
        labourHours: 1.5,
        notes: '£80-200 per corner + £50-100 labour. Degraded handling and braking.',
        partsIncluded: false,
    },
    {
        keywords: ['suspension arm corroded', 'suspension arm deteriorated', 'track control arm corroded',
            'lower arm corroded', 'upper arm corroded'],
        item: 'Suspension arm / bush corroded',
        severity: 'medium',
        urgency: 'when_due',
        costMin: 100,
        costMax: 300,
        labourHours: 1.5,
        notes: '£50-150 per arm + £80-150 labour. Dangerous if恶化.',
        partsIncluded: false,
    },
    // ── Brakes ──────────────────────────────────────────────────────────────────
    {
        keywords: ['brake pipe corroded', 'brake pipe severely corroded', 'brake pipes corroded',
            'corroded brake pipe'],
        item: 'Brake pipe corroded',
        severity: 'high',
        urgency: 'soon',
        costMin: 100,
        costMax: 250,
        labourHours: 1.5,
        notes: '£60-150 for pipe + £80-120 labour. Can spread fast. Replace before MOT retest.',
        partsIncluded: false,
    },
    {
        keywords: ['brake hose has slight corrosion', 'brake hose corroded', 'brake hose deteriorated',
            'rubber hose cracked', 'flexible brake hose perished'],
        item: 'Brake hose corroded / perished',
        severity: 'medium',
        urgency: 'when_due',
        costMin: 60,
        costMax: 140,
        labourHours: 1.0,
        notes: '£30-60 per hose + £50-80 labour. Replace in pairs.',
        partsIncluded: false,
    },
    {
        keywords: ['brake cable damaged', 'brake cable frayed', 'handbrake cable damaged',
            'parking brake cable damaged', 'rear brake cable damaged'],
        item: 'Brake cable damaged',
        severity: 'medium',
        urgency: 'when_due',
        costMin: 60,
        costMax: 140,
        labourHours: 1.0,
        notes: '£30-60 per cable + £50-80 labour. Affects handbrake operation.',
        partsIncluded: false,
    },
    {
        keywords: ['brake pad worn', 'brake pads worn', 'front brake pads worn', 'rear brake pads worn',
            'brake pad excessive wear', 'pad worn close to wire'],
        item: 'Brake pad(s) worn',
        severity: 'high',
        urgency: 'immediate',
        costMin: 80,
        costMax: 200,
        labourHours: 1.0,
        notes: '£40-80 per pad + £40-60 labour per axle. Replace in pairs.',
        partsIncluded: false,
    },
    {
        keywords: ['brake disc worn', 'brake discs worn', 'brake disc in poor condition',
            'rear brake disc scored', 'brake disc below minimum thickness'],
        item: 'Brake disc worn / scored',
        severity: 'high',
        urgency: 'soon',
        costMin: 100,
        costMax: 250,
        labourHours: 1.5,
        notes: '£60-120 per disc + £40-60 labour. Replace with pads.',
        partsIncluded: false,
    },
    {
        keywords: ['abs sensor defective', 'abs sensor not working', 'abs warning light',
            'anti-lock brake system warning'],
        item: 'ABS sensor defective',
        severity: 'medium',
        urgency: 'when_due',
        costMin: 100,
        costMax: 250,
        labourHours: 1.0,
        notes: '£60-150 for sensor + £50-100 labour. MOT advisory but safety-critical.',
        partsIncluded: false,
    },
    // ── Steering / Suspension ────────────────────────────────────────────────────
    {
        keywords: ['steering rack gaiter damaged', 'steering rack gaiter split', 'rack gaiter perished',
            'steering rack boot split'],
        item: 'Steering rack gaiter split',
        severity: 'high',
        urgency: 'soon',
        costMin: 100,
        costMax: 250,
        labourHours: 1.5,
        notes: '£60-150 for gaiter + £80-120 labour. If ignored → rack replacement £400-800.',
        partsIncluded: false,
    },
    {
        keywords: ['track rod end worn', 'track rod end excessive play', 'tie rod end worn',
            'steering linkage worn', 'steering ball joint worn'],
        item: 'Steering ball joint / track rod end worn',
        severity: 'critical',
        urgency: 'immediate',
        costMin: 100,
        costMax: 250,
        labourHours: 1.5,
        notes: '£50-120 per joint + £80-120 labour. Dangerous — steering could fail.',
        partsIncluded: false,
    },
    // ── Engine / Emissions ──────────────────────────────────────────────────────
    {
        keywords: ['exhaust emitting excessive smoke', 'exhaust smokes on tickover', 'excessive smoke from exhaust',
            'engine emitting blue smoke', 'engine emitting white smoke'],
        item: 'Engine smoking (blue/white)',
        severity: 'high',
        urgency: 'soon',
        costMin: 200,
        costMax: 1200,
        labourHours: 4.0,
        notes: 'Blue = oil burn (piston rings/valve seals £400-1200). White = coolant (head gasket £300-800).',
        partsIncluded: false,
    },
    {
        keywords: ['catalytic converter defective', 'catalytic converter missing', 'cat removed',
            'exhaust catalytic converter below threshold'],
        item: 'Catalytic converter defective',
        severity: 'high',
        urgency: 'soon',
        costMin: 300,
        costMax: 1200,
        labourHours: 2.0,
        notes: '£300-800 for pattern part + £100-200 fitting. MOT fail for emissions.',
        partsIncluded: false,
    },
    {
        keywords: ['dpf warning light', 'dpf blocked', 'dpf regeneration required', 'dpf fault',
            'diesel particulate filter warning'],
        item: 'DPF warning / blocked',
        severity: 'high',
        urgency: 'soon',
        costMin: 200,
        costMax: 1500,
        labourHours: 3.0,
        notes: '£150-400 for forced regen + £800-1500 for replacement if beyond cleaning.',
        partsIncluded: false,
    },
    {
        keywords: ['emissions exceed limit', 'lambda sensor defective', 'lambda sensor malfunction',
            'air fuel ratio sensor defective', 'o2 sensor defective', 'sensor for emissions defective'],
        item: 'Emissions sensor / lambda defective',
        severity: 'medium',
        urgency: 'when_due',
        costMin: 150,
        costMax: 400,
        labourHours: 1.5,
        notes: '£80-250 for sensor + £80-150 labour. MOT fail risk.',
        partsIncluded: false,
    },
    {
        keywords: ['engine oil level low', 'engine oil warning', 'oil warning light',
            'oil consumption excessive'],
        item: 'Engine oil level low / consuming',
        severity: 'high',
        urgency: 'soon',
        costMin: 50,
        costMax: 300,
        labourHours: 0.5,
        notes: '£30-50 for top-up + diagnosis. Could indicate ring wear or gasket leak.',
        partsIncluded: true,
    },
    // ── Body / Structural ───────────────────────────────────────────────────────
    {
        keywords: ['sub-frame corroded', 'subframe corroded', 'sub frame corroded',
            'underbody corroded', 'chassis corroded', 'floor pan corroded'],
        item: 'Sub-frame / chassis corroded',
        severity: 'high',
        urgency: 'when_due',
        costMin: 200,
        costMax: 1000,
        labourHours: 4.0,
        notes: '£150-600 for welding + £100-400 labour. Structural — MOT fail if serious.',
        partsIncluded: false,
    },
    {
        keywords: ['corrosion to underside', 'surface corrosion to underside', 'corrosion to suspension',
            'corrosion to body', 'corrosion to structure'],
        item: 'Generalised corrosion / rust',
        severity: 'medium',
        urgency: 'when_due',
        costMin: 50,
        costMax: 500,
        labourHours: 2.0,
        notes: '£50-300 for treatment + £50-200 for underseal. Monitor for spread.',
        partsIncluded: true,
    },
    // ── Lights ──────────────────────────────────────────────────────────────────
    {
        keywords: ['headlamp lens slightly defective', 'headlamp lens cracked', 'headlamp lens deteriorated',
            'headlight lens cracked', 'dipped beam headlamp defective', 'main beam headlamp defective'],
        item: 'Headlamp lens defective',
        severity: 'low',
        urgency: 'advisory',
        costMin: 0,
        costMax: 60,
        labourHours: 0.25,
        notes: '£0-30 for bulb/connector. £30-60 for lens unit. MOT fail if affecting light output.',
        partsIncluded: false,
    },
    {
        keywords: ['rear registration plate lamp defective', 'number plate lamp not working',
            'license plate lamp defective'],
        item: 'Number plate lamp defective',
        severity: 'low',
        urgency: 'advisory',
        costMin: 0,
        costMax: 30,
        labourHours: 0.25,
        notes: '£5-15 bulb + £0 labour. MOT fail item.',
        partsIncluded: true,
    },
    {
        keywords: ['stop lamp defective', 'brake light not working', 'stop light defective',
            'rear lamp not working'],
        item: 'Brake / stop lamp defective',
        severity: 'high',
        urgency: 'soon',
        costMin: 0,
        costMax: 60,
        labourHours: 0.25,
        notes: '£5-20 bulb/connector + £10-20 labour. MOT fail + safety hazard.',
        partsIncluded: true,
    },
    // ── Tyres & Wheels ─────────────────────────────────────────────────────────
    {
        keywords: ['wheel bearing noisy', 'wheel bearing excessive play', 'wheel bearing worn',
            'front wheel bearing noisy', 'rear wheel bearing noisy'],
        item: 'Wheel bearing worn / noisy',
        severity: 'medium',
        urgency: 'when_due',
        costMin: 80,
        costMax: 250,
        labourHours: 1.5,
        notes: '£50-150 per bearing + £80-100 labour. MOT advisory if noisy.',
        partsIncluded: false,
    },
    {
        keywords: ['alloy wheel damaged', 'alloy wheel cracked', 'wheel damaged not allowing bead',
            'tyre not seating', 'wheel rim cracked'],
        item: 'Wheel / alloy rim damaged',
        severity: 'low',
        urgency: 'advisory',
        costMin: 0,
        costMax: 200,
        labourHours: 0.5,
        notes: '£0-80 for tyre change if damaged. £80-200 to repair/refurbish alloy.',
        partsIncluded: true,
    },
    // ── Other common advisories ─────────────────────────────────────────────────
    {
        keywords: ['wiper blade deteriorated', 'wiper blade not cleaning', 'windscreen wiper deteriorated',
            'wiper rubber perished'],
        item: 'Wiper blade(s) deteriorated',
        severity: 'low',
        urgency: 'advisory',
        costMin: 10,
        costMax: 40,
        labourHours: 0.1,
        notes: '£8-15 per blade. DIY £5. MOT minor item.',
        partsIncluded: true,
    },
    {
        keywords: ['windscreen chipped', 'windscreen cracked', 'screen cracked',
            'windscreen stone chip cracked'],
        item: 'Windscreen cracked / chipped',
        severity: 'medium',
        urgency: 'when_due',
        costMin: 0,
        costMax: 300,
        labourHours: 1.0,
        notes: 'Chip repair £40-60. Full replacement £200-300 (heated £350+). MOT fail if in drivers view.',
        partsIncluded: false,
    },
    {
        keywords: ['seat belt damaged', 'seat belt not working correctly', 'seat belt tensioner defective',
            'seat belt webbing frayed'],
        item: 'Seat belt defective',
        severity: 'critical',
        urgency: 'immediate',
        costMin: 100,
        costMax: 500,
        labourHours: 2.0,
        notes: '£100-400 for belt assembly + £100-150 labour. MOT fail and life-threatening.',
        partsIncluded: false,
    },
    {
        keywords: ['anti-roll bar linkage ball joint excessively worn', 'drop link worn',
            'anti roll bar link worn', 'sway bar link worn'],
        item: 'Anti-roll bar link / drop link worn',
        severity: 'high',
        urgency: 'soon',
        costMin: 50,
        costMax: 150,
        labourHours: 1.0,
        notes: '£25-70 per link + £40-80 labour. MOT advisory — affects handling.',
        partsIncluded: false,
    },
    {
        keywords: ['engine mount deteriorated', 'engine mount broken', 'torque mount broken',
            'engine support mount failed'],
        item: 'Engine mount / torque arm deteriorated',
        severity: 'medium',
        urgency: 'when_due',
        costMin: 100,
        costMax: 350,
        labourHours: 2.0,
        notes: '£80-200 per mount + £100-150 labour. Vibrations and drivetrain stress if ignored.',
        partsIncluded: false,
    },
    {
        keywords: ['clutch slipping', 'clutch wear', 'clutch judder', 'clutch biting point high',
            'clutch replacement recommended'],
        item: 'Clutch slipping / worn',
        severity: 'high',
        urgency: 'when_due',
        costMin: 400,
        costMax: 900,
        labourHours: 4.0,
        notes: '£350-700 for clutch set + £150-250 labour. DMF may double cost.',
        partsIncluded: false,
    },
    {
        keywords: ['gearbox oil leaking', 'gearbox leak', 'transmission housing leak',
            'gearbox oil level low'],
        item: 'Gearbox / transmission leak',
        severity: 'medium',
        urgency: 'when_due',
        costMin: 50,
        costMax: 400,
        labourHours: 2.0,
        notes: '£50-150 for gasket/seal + £100-200 labour. Can escalate to gearbox failure.',
        partsIncluded: false,
    },
    {
        keywords: ['driveshaft gaiter split', 'driveshaft boot split', 'cv boot split',
            'constant velocity joint boot split'],
        item: 'CV / driveshaft boot split',
        severity: 'high',
        urgency: 'soon',
        costMin: 80,
        costMax: 300,
        labourHours: 2.0,
        notes: '£60-150 for boot + £80-150 labour. Joint fails without grease — £200-400 for joint.',
        partsIncluded: false,
    },
    {
        keywords: ['water pump leaking', 'water pump seal leaking', 'coolant leak from water pump',
            'engine cooling system leak'],
        item: 'Coolant / water pump leak',
        severity: 'high',
        urgency: 'soon',
        costMin: 100,
        costMax: 500,
        labourHours: 2.5,
        notes: '£80-250 for pump + £100-200 labour. Overheating = engine death.',
        partsIncluded: false,
    },
    {
        keywords: ['radiator leaking', 'radiator core leaking', 'cooling fan not working',
            'thermostat not working', 'thermostat stuck open'],
        item: 'Cooling system fault',
        severity: 'high',
        urgency: 'soon',
        costMin: 80,
        costMax: 400,
        labourHours: 1.5,
        notes: 'Thermostat £30-80 + £60-100 labour. Radiator £150-300 + £80-120 labour.',
        partsIncluded: false,
    },
    {
        keywords: ['steering column lock engaged', 'steering lock malfunction', 'steering lock not releasing',
            'steering lock fault'],
        item: 'Steering lock fault',
        severity: 'critical',
        urgency: 'immediate',
        costMin: 100,
        costMax: 400,
        labourHours: 1.0,
        notes: '£80-300 for column lock unit + £80-150 labour. Can prevent starting.',
        partsIncluded: false,
    },
    {
        keywords: ['inhibitor switch defective', 'gear selector not working', 'automatic transmission fault',
            'gear position switch defective'],
        item: 'Gear selector / inhibitor switch',
        severity: 'medium',
        urgency: 'when_due',
        costMin: 80,
        costMax: 300,
        labourHours: 1.5,
        notes: '£60-200 for switch + £80-120 labour. Car may not start or go into gear.',
        partsIncluded: false,
    },
    {
        keywords: ['high mileage indicator', 'mileage discrepancy', 'mileage inconsistent',
            'odometer reading unreliable'],
        item: 'Mileage discrepancy / clock concern',
        severity: 'critical',
        urgency: 'immediate',
        costMin: 0,
        costMax: 0,
        labourHours: 0,
        notes: 'HPI check strongly recommended. Potential clocking — walk away or heavily discount.',
        partsIncluded: false,
    },
    {
        keywords: ['hybrid system warning', 'high voltage system fault', 'hybrid battery degraded',
            'hybrid battery fault'],
        item: 'Hybrid battery / system fault',
        severity: 'critical',
        urgency: 'when_due',
        costMin: 500,
        costMax: 4000,
        labourHours: 4.0,
        notes: 'Hybrid battery replacement £1500-4000. Consult specialist. Factor into price heavily.',
        partsIncluded: false,
    },
    {
        keywords: ['advisory ', 'minor deterioration', 'slight wear', 'nearest to limit',
            'slight roughness', 'slight play', 'signs of wear', 'wear in bush'],
        item: 'General wear — monitoring advised',
        severity: 'low',
        urgency: 'advisory',
        costMin: 0,
        costMax: 200,
        labourHours: 0,
        notes: 'Not a failure. Monitor at next service. Cost depends on what it turns out to be.',
        partsIncluded: false,
    },
];
/**
 * Match advisory text against the database and return matched costs.
 */
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
                break; // one match per entry is enough
            }
        }
    }
    return matched;
}
/**
 * Parse MOT advisory text and return cost estimates for each identified issue.
 */
export function estimateAdvisories(advisoryNotes, motFailures, motTotal, year, engineCc, fuelType) {
    // Clean the advisory text before matching — remove regulation codes, MOT test numbers, etc.
    const cleaned = advisoryNotes.join(' ')
        // Remove MOT test identifiers and section markers
        .replace(/\bMOT\s*#?\d*\b/gi, ' ')
        .replace(/\bMOT test\b/gi, ' ')
        // Remove regulation codes like "5.3.4 (a) (i)"
        .replace(/\b\d+\.\d+\.\d+\s*\([a-z]\)\s*\([i]+\)/gi, ' ')
        .replace(/\b\d+\.\d+\.\d+\s*\([a-z]\)/gi, ' ')
        .replace(/\b\d+\.\d+\s*\([a-z]\s*\([i]+\)\)/gi, ' ')
        // Remove axle/position labels like "both front", "nearside rear", "offside front"
        .replace(/\b(nearside|offside|both|front|rear|ns|os)\b/gi, ' ')
        // Remove measurement values
        .replace(/\b\d+(?:\.\d+)?\s*(?:mm|cm|mph|bhp|cc|rpm|mpg|km|l|kg)\b/gi, ' ')
        // Remove tyre sizes like "185/55-15"
        .replace(/\b\d{3}\/\d{2}[R\-]\d{2}\b/g, ' ')
        // Replace all commas with spaces — "brake pipe corroded," becomes "brake pipe corroded " so it matches keyword "brake pipe corroded"
        .replace(/,/g, ' ')
        // Collapse whitespace
        .replace(/\s+/g, ' ')
        .trim();
    const matched = matchAdvisories(cleaned);
    // If no matches but there are advisories, tag as generic assessment needed
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
/**
 * Estimate current market value of a vehicle.
 * Works without external APIs using hardcoded UK market data.
 */
export function estimateValue(make, model, year, mileage, condition) {
    const age = new Date().getFullYear() - year;
    const makeUpper = make.toUpperCase();
    // ── Depreciation model — steeper for older cars to reflect real market ────────
    // age 1: ~80%, age 5: ~40%, age 10: ~20%, age 15: ~12%, age 20+: ~6%
    const depreciatedBase = (base) => {
        if (age <= 5)
            return base * Math.pow(0.80, age);
        if (age <= 10)
            return base * Math.pow(0.80, 5) * Math.pow(0.85, age - 5);
        if (age <= 15)
            return base * Math.pow(0.80, 5) * Math.pow(0.85, 5) * Math.pow(0.88, age - 10);
        return base * Math.pow(0.80, 5) * Math.pow(0.85, 5) * Math.pow(0.88, 5) * Math.pow(0.93, age - 15);
    };
    // ── Condition multipliers — tighter spread for £500-£1500 range cars ─────────
    const condMult = { poor: 0.50, fair: 0.70, good: 1.0 };
    // ── Mileage adjustment — significant for high-mileage older cars ─────────────
    let mileageAdj = 0;
    if (mileage !== null) {
        const avgMiles = 10000; // UK average annual
        const expectedMileage = age * avgMiles;
        const mileageDiff = mileage - expectedMileage;
        // High-mileage penalty is more aggressive for older cars
        const ageMultiplier = Math.min(2.0, 1 + age * 0.04);
        if (mileageDiff > 30000)
            mileageAdj = Math.round(-400 * ageMultiplier);
        else if (mileageDiff > 15000)
            mileageAdj = Math.round(-200 * ageMultiplier);
        else if (mileageDiff > 0)
            mileageAdj = Math.round(-100 * ageMultiplier);
        else if (mileageDiff < -15000)
            mileageAdj = Math.round(250 * ageMultiplier);
        else if (mileageDiff < 0)
            mileageAdj = Math.round(100 * ageMultiplier);
    }
    // ── Make/model base premiums ───────────────────────────────────────────────
    let baseRetail = 5000; // default baseline
    let brandNote = '';
    if (/VAUXHALL|OPEL/i.test(makeUpper)) {
        baseRetail = 6000;
        brandNote = ' (Vauxhall/Opel — budget-friendly, holds low value)';
    }
    else if (/FORD/i.test(makeUpper)) {
        baseRetail = 6500;
        brandNote = ' (Ford — strong UK market)';
    }
    else if (/TOYOTA|HONDA|MAZDA|SUBARU/i.test(makeUpper)) {
        baseRetail = 8000;
        brandNote = ' (Japanese — holds value well)';
    }
    else if (/BMW|AUDI|MERCEDES/i.test(makeUpper)) {
        baseRetail = 10000;
        brandNote = ' (Premium German — higher maintenance costs offset value)';
    }
    else if (/VW|VOLKSWAGEN/i.test(makeUpper)) {
        baseRetail = 7500;
        brandNote = ' (VW)';
    }
    else if (/JAGUAR|LAND ROVER|RANGE ROVER/i.test(makeUpper)) {
        baseRetail = 12000;
        brandNote = ' (Premium/Luxury)';
    }
    else if (/PEUGEOT|CITROEN|RENAULT|NISSAN|SEAT|SKODA/i.test(makeUpper)) {
        baseRetail = 5500;
        brandNote = ' (Mass-market European)';
    }
    // Age-based reduction for older cars (10+ years) — REMOVED: the depreciation
    // formula already accounts for age. The 0.50 multiplier for age>15 was crushing
    // valuations to £300-400 for cars actually worth £700-1200 in today's market.
    const cond = condMult[condition] ?? 0.70;
    const rawMin = depreciatedBase(baseRetail) * cond * 0.75;
    const rawMax = depreciatedBase(baseRetail) * cond;
    // For cars 15+ years old, apply realistic market floors (£700-£1200) because
    // the depreciation formula underestimates value for older £500-1500 cars.
    // The floorMin/floorMax override prevents absurd valuations while remaining fair.
    // Base floorMin — used in the return statement; age-specific override may raise it
    const baseFloorMin = age >= 15 ? 700 : age >= 10 ? 500 : 400;
    let min = Math.round(rawMin + mileageAdj);
    let max = Math.round(rawMax + mileageAdj);
    if (age >= 15) {
        // For cars 15+ years old: realistic market floors of £700-£1200 prevent
        // the depreciation formula from crushing valuations for old £500-1500 cars.
        const ageFloorMin = 700;
        const ageFloorMax = 1200;
        min = Math.max(min, ageFloorMin);
        max = Math.max(max, min, Math.round(ageFloorMax * cond));
    }
    const notes = `${brandNote} Age: ${age}yr${mileage !== null ? `, Mileage: ${mileage.toLocaleString()} mi` : ''}, Condition: ${condition}. Always compare against Auto Trader and HPI data.`;
    return { min: Math.max(min, baseFloorMin), max, notes };
}
/**
 * Estimate how many months before major repairs or car becomes unreliable.
 * Only counts truly critical/high-severity advisories that exist in CURRENT state.
 * Historical MOT failures (unless unresolved structural issue) don't shorten lifespan.
 */
export function estimateLifespan(year, advisoryCount, motFailures, fuelType, seriousAdvisories = 0 // critical or high severity in CURRENT advisories
) {
    const age = new Date().getFullYear() - year;
    const diesel = /diesel|cdti|tdi|dti/i.test(fuelType);
    // Determine if high mileage for age
    const avgMilesPerYear = 10000;
    const expectedMileage = age * avgMilesPerYear;
    // Pass expectedMileage in or compute here — use a default if not available
    const highMileageForAge = false; // Will be overridden below with actual check
    let months;
    let assessment;
    // Only 3 months for truly critical issues that exist NOW
    // (broken coil spring, steering failure, seat belt defect — not historical failures)
    if (seriousAdvisories >= 2) {
        months = 3;
        assessment = `${seriousAdvisories} serious critical/high-severity advisories in current MOT. Dangerous — do not rely on this car without immediate repairs.`;
    }
    else if (seriousAdvisories >= 1) {
        months = 6;
        assessment = `${seriousAdvisories} serious advisory present — likely MOT fail next time. Budget for retest + repairs within 6 months.`;
    }
    else if (advisoryCount >= 8) {
        // Many advisories = lots of wear items stacking up
        months = 12;
        assessment = `Many advisories (${advisoryCount}) — mostly wear items but accumulating. Budget for tyres, brakes, suspension in next 12 months.`;
    }
    else if (diesel && age >= 15) {
        months = 18;
        assessment = `Diesel at ${age} years — DPF, turbo, and clutch are the main risks. DPF blockage (£800-2000), turbo (£500-1500). 18 months before something expensive.`;
    }
    else if (age >= 15) {
        // Older car with no serious current advisories — but not a high-mileage example
        months = 18;
        assessment = `${age}-year-old car in reasonable condition. Standard wear items (brakes, tyres, suspension) in the next 12-18 months. No urgent major repairs anticipated — MOT passed.`;
    }
    else if (age >= 10) {
        months = 24;
        assessment = `${age}-year-old car. Wear items due in 12-24 months. No structural concerns.`;
    }
    else {
        months = 24;
        assessment = `Car in reasonable condition. Standard wear items in 1-2 years. No urgent major repairs anticipated.`;
    }
    return { months, assessment };
}
/**
 * Full vehicle valuation combining advisory costs, value estimate, and lifespan.
 */
export function generateVehicleValuation(make, model, year, mileage, fuelType, advisories, motFailures, motTotal) {
    // Determine condition from advisory severity
    const hasCritical = advisories.some(a => a.severity === 'critical');
    const hasHigh = advisories.some(a => a.severity === 'high');
    const seriousCount = advisories.filter(a => a.severity === 'critical' || a.severity === 'high').length;
    const condition = hasCritical ? 'poor' : hasHigh ? 'fair' : advisories.length <= 2 ? 'good' : 'fair';
    const value = estimateValue(make, model, year, mileage, condition);
    const lifespan = estimateLifespan(year, advisories.length, motFailures, fuelType, seriousCount);
    // Total advisory costs
    const totalAdvisoryCostMin = advisories.reduce((s, a) => s + a.estimatedCostMin, 0);
    const totalAdvisoryCostMax = advisories.reduce((s, a) => s + a.estimatedCostMax, 0);
    // Value with advisories: current value minus ~70% of repair cost (trade discount)
    const repairPenaltyMin = Math.round(totalAdvisoryCostMin * 0.7);
    const repairPenaltyMax = Math.round(totalAdvisoryCostMax * 0.7);
    const valueWithAdvisoriesMin = Math.max(300, value.min - repairPenaltyMax);
    const valueWithAdvisoriesMax = Math.max(400, value.max - repairPenaltyMin);
    // MOT fail risk based on number of high/critical advisories
    let motFailRisk = 'low';
    if (seriousCount >= 3)
        motFailRisk = 'high';
    else if (seriousCount >= 1)
        motFailRisk = 'medium';
    // Recommendation
    let recommendation;
    if (hasCritical) {
        recommendation = `Critical issues found — do not buy at asking price. Either walk away or negotiate minimum £${totalAdvisoryCostMin.toLocaleString()} off. Serious safety concerns.`;
    }
    else if (totalAdvisoryCostMax > value.max * 0.5) {
        recommendation = `Repair costs (up to £${totalAdvisoryCostMax.toLocaleString()}) exceed half the car's value. Negotiate hard or avoid.`;
    }
    else if (seriousCount >= 1) {
        recommendation = `High-severity advisories present. Negotiate at least £${(totalAdvisoryCostMin).toLocaleString()} off asking price. Budget total £${(totalAdvisoryCostMin + 200).toLocaleString()}-£${(totalAdvisoryCostMax + 400).toLocaleString()} including retest.`;
    }
    else {
        recommendation = `Advisories are manageable wear items. Price accordingly — aim to save at least the advisory cost in negotiation. Car is worth £${value.min.toLocaleString()}-£${value.max.toLocaleString()} as-is.`;
    }
    return {
        make,
        model,
        year,
        currentValueMin: value.min,
        currentValueMax: value.max,
        valueWithAdvisoriesMin,
        valueWithAdvisoriesMax,
        expectedMonthsRemaining: lifespan.months,
        motFailRisk,
        totalAdvisoryCostMin,
        totalAdvisoryCostMax,
        recommendation,
    };
}
