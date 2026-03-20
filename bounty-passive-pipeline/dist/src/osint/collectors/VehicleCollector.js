import { osintFetch, osintDelay, tryParseJson } from '../http.js';
import { Logger } from '../../Logger.js';
import { estimateAdvisories, generateVehicleValuation } from './VehicleValuation.js';
const LOG = new Logger('VehicleCollector');
function detectPlateType(plate) {
    const clean = plate.replace(/\s/g, '').toUpperCase();
    // VIN: 17 characters
    if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(clean))
        return 'VIN';
    // UK current format (2001+): 2 letters + 2 digits + 3 letters (e.g. KY05YTJ)
    if (/^[A-Z]{2}\d{2}[A-Z]{3}$/.test(clean))
        return 'UK';
    // UK prefix format (pre-2001): 1 letter + 1-3 digits + 2-3 letters  (e.g. A123ABC)
    if (/^[A-Z]\d{1,3}[A-Z]{2,3}$/.test(clean))
        return 'UK';
    // UK suffix format (pre-2001): 3 letters + 1-3 digits + 2 letters   (e.g. ABC123DE)
    if (/^[A-Z]{3}\d{1,3}[A-Z]{2}$/.test(clean))
        return 'UK';
    // UK with space separator: 2 letters + 2 digits + space + 3 letters
    if (/^[A-Z]{2}\d{2} [A-Z]{3}$/.test(clean))
        return 'UK';
    // UK old format: 3 letters + space + 3 numbers           (e.g. ABC 123)
    if (/^[A-Z]{3} ?\d{3}$/.test(clean))
        return 'UK';
    // US: 3-7 chars, alphanumeric
    if (/^[A-Z0-9]{3,8}$/i.test(clean))
        return 'US';
    return 'UNKNOWN';
}
export class VehicleCollector {
    async collect(query) {
        const { target } = query;
        const findings = [];
        const errors = [];
        const rawData = {};
        const plateType = detectPlateType(target);
        if (plateType === 'VIN') {
            return this.collectVin(target.toUpperCase(), findings, errors, rawData);
        }
        else if (plateType === 'UK') {
            const clean = target.replace(/\s/g, '').toUpperCase();
            // Run UK checks in parallel
            const [dvla, carCheck, mibResult] = await Promise.allSettled([
                this.collectDVLA(clean, {}, [], []),
                this.collectCarCheck(clean, [], [], {}),
                this.collectMIB(clean, [], [])
            ]);
            if (dvla.status === 'fulfilled') {
                findings.push(...dvla.value.findings);
                errors.push(...dvla.value.errors);
                Object.assign(rawData, { DVLA: dvla.value.rawData });
            }
            if (carCheck.status === 'fulfilled') {
                findings.push(...carCheck.value.findings);
                errors.push(...carCheck.value.errors);
                Object.assign(rawData, { CarCheck: carCheck.value.rawData });
            }
            else {
                errors.push(`car-checking.com: ${carCheck.reason}`);
            }
            if (mibResult.status === 'fulfilled') {
                findings.push(...mibResult.value.findings);
                errors.push(...mibResult.value.errors);
                Object.assign(rawData, { MIB: mibResult.value.rawData });
            }
            else {
                errors.push(`MIB insurance check: ${mibResult.reason}`);
            }
            // ── VehicleValuation: extract advisories and generate cost estimates ────
            try {
                const _carCheckRawTmp = carCheck.status === 'fulfilled' ? carCheck.value.rawData : undefined;
                const carCheckRaw = _carCheckRawTmp ?? {};
                const rawText = carCheckRaw['raw_text'] || '';
                const valuationMake = rawData['DVLA']?.['Make']
                    || carCheckRaw['make'] || '';
                const valuationModel = carCheckRaw['model'] || '';
                const valuationYear = parseInt(carCheckRaw['year'] || '0', 10) || 0;
                const mileage = null; // not available from DVLA/car-check free tier
                // Extract ALL advisory items from the full raw text — don't split by MOT block.
                // The advisory items appear in the text as "Advice ..." or "Advisory ...".
                const advisoryLines = [];
                const allItemsRe = /(?:^|\s)(Advice|Advisory)\s+([^\n]{10,250}?)(?=\s+(?:Advice|Advisory)|$)/gim;
                for (const match of rawText.matchAll(allItemsRe)) {
                    const item = match[2]?.trim();
                    if (item && item.length > 5)
                        advisoryLines.push(item);
                }
                // Fallback: if regex missed them, try splitting by keyword
                if (advisoryLines.length === 0) {
                    const parts = rawText.split(/(?=Advice\s{2,}|Advisory\s{2,})/gi);
                    for (const part of parts) {
                        const line = part.replace(/^Advice\s*/i, '').replace(/^Advisory\s*/i, '').trim();
                        if (line.length > 5 && line.length < 300)
                            advisoryLines.push(line);
                    }
                }
                const motFailedStr = String(rawData['DVLA'] ? rawData['DVLA']['Failed MOT tests'] || '0' : '0');
                const motFailed = parseInt(motFailedStr, 10) || 0;
                const motPassedStr = String(rawData['DVLA'] ? rawData['DVLA']['MOT passed'] || '0' : '0');
                const motPassed = parseInt(motPassedStr, 10) || 0;
                const motTotal = motFailed + motPassed;
                const engineCcStr = carCheckRaw['engine_capacity'] || '';
                const engineCc = parseInt(engineCcStr.replace(/\D/g, ''), 10) || 0;
                const fuelType = carCheckRaw['fuel_type'] || 'DIESEL';
                const advisoryCosts = estimateAdvisories(advisoryLines, motFailed, motTotal, valuationYear, engineCc, fuelType);
                const valuation = generateVehicleValuation(valuationMake, valuationModel, valuationYear, mileage, fuelType, advisoryCosts, motFailed, motTotal);
                // Attach valuation findings with exact field names report.ts expects
                findings.push({
                    source: 'VehicleValuation',
                    field: 'make',
                    value: String(valuation.make),
                    confidence: 90,
                });
                findings.push({
                    source: 'VehicleValuation',
                    field: 'model',
                    value: String(valuation.model),
                    confidence: 90,
                });
                findings.push({
                    source: 'VehicleValuation',
                    field: 'year',
                    value: String(valuation.year),
                    confidence: 90,
                });
                findings.push({
                    source: 'VehicleValuation',
                    field: 'advisory_total_min',
                    value: String(valuation.totalAdvisoryCostMin),
                    confidence: 90,
                });
                findings.push({
                    source: 'VehicleValuation',
                    field: 'advisory_total_max',
                    value: String(valuation.totalAdvisoryCostMax),
                    confidence: 90,
                });
                findings.push({
                    source: 'VehicleValuation',
                    field: 'mot_fail_risk',
                    value: String(valuation.motFailRisk),
                    confidence: 70,
                });
                // Also push individual advisory costs as findings
                for (const ac of advisoryCosts) {
                    findings.push({
                        source: 'VehicleValuation',
                        field: `cost__${ac.item.replace(/\s+/g, '_')}__${ac.severity}__${ac.urgency}`,
                        value: `£${ac.estimatedCostMin}-£${ac.estimatedCostMax}`,
                        confidence: ac.severity === 'critical' ? 95 : ac.severity === 'high' ? 85 : 70,
                    });
                }
                rawData['valuation'] = valuation;
                rawData['advisory_costs'] = advisoryCosts;
            }
            catch (valErr) {
                // Valuation is best-effort — don't fail the whole collector
                errors.push(`VehicleValuation: ${valErr}`);
            }
            return { collector: 'VehicleCollector', findings, errors, rawData };
        }
        else if (plateType === 'US') {
            return this.collectUS(target.toUpperCase(), findings, errors, rawData);
        }
        else {
            findings.push({
                source: 'VehicleCollector',
                field: 'note',
                value: 'Unrecognised format. Supported: UK reg (KY05YTJ), VIN (17 chars), US plate (e.g. ABC-1234)',
                confidence: 0
            });
            return { collector: 'VehicleCollector', findings, errors, rawData };
        }
    }
    // ── UK: DVLA free check (basic: make, colour) ──────────────────────────────
    async collectDVLA(plate, _rawData, _errors, _findings) {
        const findings = [];
        const errors = [];
        const rawData = {};
        let browser;
        try {
            const { chromium } = await import('@playwright/test');
            browser = await chromium.launch({ headless: true });
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
                    if (key && val)
                        rawData[key] = val;
                }
            }
            const makeKey = Object.keys(rawData).find(k => /make/i.test(k));
            const colourKey = Object.keys(rawData).find(k => /colour/i.test(k));
            if (makeKey)
                findings.push({ source: 'GovUK-DVLA', field: 'make', value: String(rawData[makeKey]), confidence: 95 });
            if (colourKey)
                findings.push({ source: 'GovUK-DVLA', field: 'colour', value: String(rawData[colourKey]), confidence: 95 });
            if (Object.keys(rawData).length === 0) {
                errors.push('DVLA returned empty result');
            }
        }
        catch (err) {
            errors.push(`DVLA lookup failed: ${err}`);
        }
        finally {
            if (browser)
                await browser.close();
        }
        return { collector: 'VehicleCollector', findings, errors, rawData };
    }
    // ── UK: car-checking.com (full MOT history + specs) ─────────────────────────
    async collectCarCheck(plate, _findings, _errors, _rawData) {
        const findings = [];
        const errors = [];
        const rawData = {};
        let browser;
        try {
            const { chromium } = await import('@playwright/test');
            browser = await chromium.launch({ headless: true });
            const page = await browser.newPage();
            await page.goto('https://www.car-checking.com/', { waitUntil: 'domcontentloaded', timeout: 15_000 });
            await page.waitForTimeout(2000);
            // Fill the reg input and submit
            const regInput = page.locator('#subForm1');
            if (await regInput.count() === 0) {
                errors.push('car-checking.com: reg input not found');
                return { collector: 'VehicleCollector', findings, errors, rawData };
            }
            await regInput.fill(plate);
            await page.locator('button[type="submit"]').first().click();
            await page.waitForTimeout(5000);
            // Pull all text from the report page
            const bodyText = await page.locator('body').textContent();
            if (!bodyText || bodyText.trim().length < 50) {
                errors.push('car-checking.com: no report data returned');
                return { collector: 'VehicleCollector', findings, errors, rawData };
            }
            rawData['raw_text'] = bodyText?.substring(0, 5000);
            // Parse specification section
            const specPairs = [
                ['Make', 'make'],
                ['Model', 'model'],
                ['Colour', 'colour'],
                ['Year of manufacture', 'year'],
                ['Top speed', 'top_speed'],
                ['0 to 60 MPH', 'zero_to_60'],
                ['Gearbox', 'gearbox'],
                ['Engine & fuel consumption', 'engine'],
                ['Power', 'power'],
                ['Torque', 'torque'],
                ['Engine capacity', 'engine_capacity'],
                ['Cylinders', 'cylinders'],
                ['Fuel type', 'fuel_type'],
                ['Consumption city', 'consumption_city'],
                ['Consumption extra urban', 'consumption_extra_urban'],
                ['Consumption combined', 'consumption_combined'],
                ['CO2 emission', 'co2_emission'],
                ['CO2 label', 'co2_label'],
            ];
            const text = bodyText || '';
            for (const [label, field] of specPairs) {
                const regex = new RegExp(`${label}[\\s\\S]{0,200}`);
                const m = text.match(regex);
                if (m) {
                    // value is typically after the label, on the same or next line
                    const snippet = m[0].replace(label, '').trim().split(/\n/)[0].trim();
                    if (snippet && snippet.length < 200 && !snippet.includes('YOUR CAR REPORT')) {
                        rawData[field] = snippet;
                    }
                }
            }
            // Parse MOT section
            const motExpiryMatch = text.match(/MOT expiry date[\s\n]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
            if (motExpiryMatch) {
                findings.push({ source: 'car-checking.com', field: 'mot_expiry', value: motExpiryMatch[1], confidence: 95 });
                rawData['mot_expiry'] = motExpiryMatch[1];
            }
            const motPassRateMatch = text.match(/MOT pass rate[\s\n]+(\d+)\s*%/i);
            if (motPassRateMatch) {
                findings.push({ source: 'car-checking.com', field: 'mot_pass_rate', value: motPassRateMatch[1] + '%', confidence: 90 });
            }
            const motPassedMatch = text.match(/MOT passed[\s\n]+(\d+)/i);
            if (motPassedMatch) {
                findings.push({ source: 'car-checking.com', field: 'mot_passed', value: motPassedMatch[1], confidence: 90 });
            }
            const motFailedMatch = text.match(/Failed MOT tests[\s\n]+(\d+)/i);
            if (motFailedMatch) {
                findings.push({ source: 'car-checking.com', field: 'mot_failed', value: motFailedMatch[1], confidence: 90 });
            }
            // Make/model/year from the report header
            const makeModelMatch = text.match(/(VAUXHALL|OPEL|FORD|TOYOTA|BMW|MERCEDES|AUDI|VOLKSWAGEN|CHRYSLER|JAGUAR|LAND ROVER|OTHER)[\s\n]+([A-Z0-9 \-+]+)[\s\n]+(\d{4})/i);
            if (makeModelMatch) {
                const m = makeModelMatch[1].toUpperCase();
                const mod = makeModelMatch[2].trim();
                const yr = makeModelMatch[3];
                if (!rawData['make'])
                    findings.push({ source: 'car-checking.com', field: 'make', value: m, confidence: 95 });
                if (!rawData['model'])
                    findings.push({ source: 'car-checking.com', field: 'model', value: mod, confidence: 90 });
                if (!rawData['year'])
                    findings.push({ source: 'car-checking.com', field: 'year', value: yr, confidence: 95 });
            }
        }
        catch (err) {
            errors.push(`car-checking.com failed: ${err}`);
        }
        finally {
            if (browser)
                await browser.close();
        }
        await osintDelay(500);
        return { collector: 'VehicleCollector', findings, errors, rawData };
    }
    // ── UK: MIB Navigate — free insurance check ──────────────────────────────────
    async collectMIB(plate, _findings, _errors) {
        const findings = [];
        const errors = [];
        const rawData = {};
        try {
            // Try the MIB Navigate form
            const body = new URLSearchParams({ registrationNumber: plate }).toString();
            const resp = await osintFetch('https://enquiry.navigate.mib.org.uk/checkyourvehicle', { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0' }, timeout: 15_000 });
            rawData['mib_response'] = resp.substring(0, 2000);
            if (resp.includes('insured') || resp.includes('INSURED')) {
                findings.push({ source: 'MIB-Navigate', field: 'insurance_status', value: 'Insured', confidence: 90 });
            }
            else if (resp.includes('not insured') || resp.includes('NOT INSURED') || resp.includes('no insurance')) {
                findings.push({ source: 'MIB-Navigate', field: 'insurance_status', value: 'Not insured', confidence: 90 });
            }
        }
        catch (err) {
            errors.push(`MIB Navigate insurance check: ${err}`);
        }
        return { collector: 'VehicleCollector', findings, errors, rawData };
    }
    // ── VIN lookup via NHTSA vPIC ────────────────────────────────────────────────
    async collectVin(vin, findings, errors, rawData) {
        try {
            const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`;
            const text = await osintFetch(url, { timeout: 15_000 });
            const json = tryParseJson(text, { Results: [] });
            if (json.Results.length === 0) {
                errors.push('NHTSA: empty response');
                return { collector: 'VehicleCollector', findings, errors, rawData };
            }
            const r = json.Results[0];
            // Useful NHTSA fields to extract
            const fields = [
                ['Make', 'make'],
                ['Model', 'model'],
                ['Model Year', 'year'],
                ['Body Class', 'body_type'],
                ['Engine Number', 'engine_number'],
                ['Engine Displacement (CC)', 'engine_cc'],
                ['Cylinders', 'cylinders'],
                ['Fuel Type - Primary', 'fuel_type'],
                ['Transmission', 'transmission'],
                ['Drive Type', 'drive_type'],
                ['Brake System Type', 'brake_type'],
                ['Plant Country', 'plant_country'],
                ['Manufacturer Name', 'manufacturer'],
                ['Plant State/Province', 'plant_state'],
                ['Vehicle Type', 'vehicle_type'],
                ['Plant Company Name', 'plant_company'],
            ];
            for (const [nhtsaKey, fieldName] of fields) {
                const val = r[nhtsaKey];
                if (val && val.trim() !== '' && val.trim() !== 'Not Applicable' && val.trim() !== '0') {
                    rawData[fieldName] = val.trim();
                    findings.push({ source: 'NHTSA-vPIC', field: fieldName, value: val.trim(), confidence: 90 });
                }
            }
            if (findings.length === 0) {
                errors.push('NHTSA: VIN decoded but no usable data (vehicle may not be US-market)');
            }
        }
        catch (err) {
            errors.push(`NHTSA vPIC lookup failed: ${err}`);
        }
        return { collector: 'VehicleCollector', findings, errors, rawData };
    }
    // ── US plate (limited) ───────────────────────────────────────────────────────
    async collectUS(plate, findings, errors, rawData) {
        const stateMatch = plate.match(/^([A-Z]{2})/i);
        const state = stateMatch ? stateMatch[1].toUpperCase() : null;
        if (state) {
            findings.push({
                source: 'VehicleCollector',
                field: 'us_state_hint',
                value: `Possible US state: ${state} (deduced from plate prefix)`,
                confidence: 50
            });
        }
        findings.push({
            source: 'VehicleCollector',
            field: 'note',
            value: 'US plate lookup requires state-specific DMV. For full data, use VIN lookup instead.',
            confidence: 0
        });
        return { collector: 'VehicleCollector', findings, errors, rawData };
    }
}
