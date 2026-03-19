import { osintFetch, osintDelay } from '../http.js';
import { Logger } from '../../Logger.js';
import type { OsintQuery, CollectorResult, OsintFinding } from '../types.js';

const LOG = new Logger('VehicleCollector');

function detectPlateType(plate: string): 'UK' | 'US' | 'UNKNOWN' {
  const clean = plate.replace(/\s/g, '').toUpperCase();
  // UK prefix format: 1 letter + 1-3 digits + 2-3 letters  (e.g. A123ABC)
  if (/^[A-Z]\d{1,3}[A-Z]{2,3}$/.test(clean)) return 'UK';
  // UK suffix format: 3 letters + 1-3 digits + 2 letters   (e.g. ABC123DE)
  if (/^[A-Z]{3}\d{1,3}[A-Z]{2}$/.test(clean)) return 'UK';
  // UK old format: 3 letters + space + 3 numbers           (e.g. ABC 123)
  if (/^[A-Z]{3} ?\d{3}$/.test(clean)) return 'UK';
  // US: 3-7 chars, alpha numeric
  if (/^[A-Z0-9]{3,8}$/i.test(clean)) return 'US';
  return 'UNKNOWN';
}

function extractDdValue(html: string, label: string): string | null {
  // Try <dt>label</dt><dd>value</dd> pattern
  const re = new RegExp(`<dt[^>]*>\\s*${label}[\\s\\S]*?</dt>\\s*<dd[^>]*>([\\s\\S]*?)</dd>`, 'i');
  const m = html.match(re);
  if (m) return m[1].replace(/<[^>]+>/g, '').trim();
  // Try <td>...label...</td><td>value</td>
  const re2 = new RegExp(`<td[^>]*>\\s*${label}[\\s\\S]*?</td>\\s*<td[^>]*>([\\s\\S]*?)</td>`, 'i');
  const m2 = html.match(re2);
  if (m2) return m2[1].replace(/<[^>]+>/g, '').trim();
  return null;
}

export class VehicleCollector {
  async collect(query: OsintQuery): Promise<CollectorResult> {
    const { target } = query;
    const findings: OsintFinding[] = [];
    const errors: string[] = [];
    const rawData: Record<string, unknown> = {};

    const plateType = detectPlateType(target);

    if (plateType === 'UK') {
      return this.collectUK(target.replace(/\s/g, '').toUpperCase(), findings, errors, rawData);
    } else if (plateType === 'US') {
      return this.collectUS(target.toUpperCase(), findings, errors, rawData);
    } else {
      findings.push({
        source: 'VehicleCollector',
        field: 'note',
        value: 'Unrecognised plate format. Supported: UK (e.g. AB12XYZ, A123ABC), US (e.g. ABC-1234)',
        confidence: 0
      });
      return { collector: 'VehicleCollector', findings, errors, rawData };
    }
  }

  private async collectUK(
    plate: string,
    findings: OsintFinding[],
    errors: string[],
    rawData: Record<string, unknown>
  ): Promise<CollectorResult> {
    try {
      const vrm = plate.toUpperCase();
      const formBody = new URLSearchParams({ Vrm: vrm, continue: 'Continue', conditionHash: '' }).toString();

      const text = await osintFetch(
        'https://vehicleenquiry.service.gov.uk/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Referer': 'https://vehicleenquiry.service.gov.uk/'
          },
          body: formBody,
          timeout: 20_000
        }
      );

      rawData['govuk_response'] = text.substring(0, 3000);

      const make = extractDdValue(text, 'Make');
      const model = extractDdValue(text, 'Model');
      const colour = extractDdValue(text, 'Colour');
      const year = extractDdValue(text, 'Year') ?? extractDdValue(text, 'Date of first registration');
      const motStatus = extractDdValue(text, 'MOT Status');
      const motExpires = extractDdValue(text, 'MOT Expiry Date');
      const taxStatus = extractDdValue(text, 'Tax Status');
      const taxDue = extractDdValue(text, 'Tax due date');
      const fuelType = extractDdValue(text, 'Fuel type');
      const engineSize = extractDdValue(text, 'Engine size');

      if (make) findings.push({ source: 'GovUK-DVLA', field: 'make', value: make, confidence: 95 });
      if (model) findings.push({ source: 'GovUK-DVLA', field: 'model', value: model, confidence: 90 });
      if (colour) findings.push({ source: 'GovUK-DVLA', field: 'colour', value: colour, confidence: 95 });
      if (year) findings.push({ source: 'GovUK-DVLA', field: 'year', value: year, confidence: 90 });
      if (motStatus) findings.push({ source: 'GovUK-DVLA', field: 'mot_status', value: motStatus, confidence: 95 });
      if (motExpires) findings.push({ source: 'GovUK-DVLA', field: 'mot_expires', value: motExpires, confidence: 95 });
      if (taxStatus) findings.push({ source: 'GovUK-DVLA', field: 'tax_status', value: taxStatus, confidence: 95 });
      if (taxDue) findings.push({ source: 'GovUK-DVLA', field: 'tax_due', value: taxDue, confidence: 80 });
      if (fuelType) findings.push({ source: 'GovUK-DVLA', field: 'fuel_type', value: fuelType, confidence: 85 });
      if (engineSize) findings.push({ source: 'GovUK-DVLA', field: 'engine_size', value: engineSize, confidence: 80 });

      // Check for error messages in response
      if (text.includes('not found') || text.includes('No results')) {
        findings.push({
          source: 'GovUK-DVLA',
          field: 'result',
          value: 'Vehicle not found in DVLA database',
          confidence: 90
        });
      }

    } catch (err) {
      errors.push(`UK DVLA lookup failed: ${err}`);
    }

    await osintDelay(1000);
    return { collector: 'VehicleCollector', findings, errors, rawData };
  }

  private async collectUS(
    plate: string,
    findings: OsintFinding[],
    errors: string[],
    rawData: Record<string, unknown>
  ): Promise<CollectorResult> {
    // Try to identify state from common plate patterns
    const stateMatch = plate.match(/^([A-Z]{2})/i);
    const state = stateMatch ? stateMatch[1].toUpperCase() : null;

    if (state) {
      findings.push({
        source: 'VehicleCollector',
        field: 'us_state_hint',
        value: `Possible state: ${state} (deduced from plate prefix)`,
        confidence: 50
      });
    }

    findings.push({
      source: 'VehicleCollector',
      field: 'note',
      value: 'US plate lookup is state-specific and limited without VIN. Full data requires the VIN.',
      confidence: 0
    });

    // Try NHTSA recall API (free, no key) – needs make+model+year, not plate
    // We'll note the limitation
    rawData['us_plate_note'] = 'NHTSA recall API requires VIN, modelYear, make – not plate number';

    return { collector: 'VehicleCollector', findings, errors, rawData };
  }
}
