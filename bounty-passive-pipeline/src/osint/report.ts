import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import type { OsintResult } from './types.js';

export function generateOsintReport(result: OsintResult): string {
  const today = new Date().toISOString().split('T')[0];
  const safeName = result.query.target.replace(/[^a-z0-9]/gi, '_').substring(0, 40);
  const hash = createHash('md5').update(result.query.target).digest('hex').substring(0, 8);
  const dir = path.join('reports', 'osint', today);
  fs.mkdirSync(dir, { recursive: true });

  const filename = `${result.query.type}-${safeName}-${hash}.md`;
  const filePath = path.join(dir, filename);

  const lines: string[] = [];

  lines.push(`# OSINT Report – ${result.query.type}: ${result.query.target}`);
  lines.push('');
  lines.push(`**Generated:** ${result.startedAt}  `);
  lines.push(`**Duration:** ${Math.round(result.duration / 1000)}s  `);
  lines.push(`**Flags:** ${result.query.flags.join(', ') || '(none)'}  `);
  lines.push('');

  // ── Summary ──────────────────────────────────────────────────────────────────
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Collector | Findings | Errors |`);
  lines.push(`| --- | --- | --- |`);

  for (const [collector, count] of Object.entries(result.summary)) {
    const collectorErrors = result.errors.filter(e => e.startsWith(collector));
    lines.push(`| ${collector} | ${count} | ${collectorErrors.length} |`);
  }

  lines.push('');
  lines.push(`**Total unique findings:** ${result.findings.length}  `);
  lines.push(`**Total errors:** ${result.errors.length}  `);
  lines.push('');

  // Confidence breakdown
  const highConf = result.findings.filter(f => f.confidence >= 80).length;
  const medConf = result.findings.filter(f => f.confidence >= 50 && f.confidence < 80).length;
  const lowConf = result.findings.filter(f => f.confidence < 50).length;

  lines.push('### Confidence Distribution');
  lines.push('');
  lines.push(`| Level | Count |`);
  lines.push(`| --- | --- |`);
  lines.push(`| 🟢 High (≥80) | ${highConf} |`);
  lines.push(`| 🟡 Medium (50-79) | ${medConf} |`);
  lines.push(`| ⚪ Low (<50) | ${lowConf} |`);
  lines.push('');

  // ── Key Findings ─────────────────────────────────────────────────────────────
  lines.push('## Key Findings');
  lines.push('');

  // Sort by confidence descending
  const sorted = [...result.findings].sort((a, b) => b.confidence - a.confidence);

  // Group by source
  const bySource = new Map<string, typeof sorted>();
  for (const f of sorted) {
    if (!bySource.has(f.source)) bySource.set(f.source, []);
    bySource.get(f.source)!.push(f);
  }

  for (const [source, findings] of bySource) {
    lines.push(`### ${source}`);
    lines.push('');
    for (const f of findings) {
      const confEmoji = f.confidence >= 80 ? '🟢' : f.confidence >= 50 ? '🟡' : '⚪';
      const urlStr = f.url ? ` [\`${f.url.substring(0, 80)}\`](${f.url})` : '';
      lines.push(`- **${confEmoji} [${f.confidence}%]** \`${f.field}\`: ${f.value}${urlStr}`);
    }
    lines.push('');
  }

  // ── Vehicle Report ────────────────────────────────────────────────────────────
  if (result.query.type === 'vehicle') {
    const rawCarCheck = result.rawData['CarCheck'] as Record<string, unknown> | undefined;
    const rawDvla = result.rawData['DVLA'] as Record<string, unknown> | undefined;
    const rawVal = rawCarCheck?.['vehicle_valuation'] as Record<string, unknown> | undefined;
    const rawAdvisories = rawCarCheck?.['advisory_costs'] as Array<Record<string, unknown>> | undefined;
    const rawText = (rawCarCheck?.['raw'] as string | undefined) ?? '';

    // ── Core vehicle fields ────────────────────────────────────────────────────
    const make = rawVal?.['make'] as string ?? findFinding(result, 'make') ?? 'Unknown';
    const model = rawVal?.['model'] as string ?? findFinding(result, 'model') ?? 'Unknown';
    const year = rawVal?.['year'] as number | string ?? findFinding(result, 'year') ?? '?';
    const colour = rawCarCheck?.['Colour'] as string ?? findFinding(result, 'colour') ?? rawDvla?.['colour'] as string ?? 'Unknown';
    const fuelType = rawCarCheck?.['fuel_type'] as string ?? findFinding(result, 'fuel_type') ?? 'Unknown';
    const engineCc = rawCarCheck?.['engine_capacity'] as number | string | undefined ?? findFinding(result, 'engine_capacity');
    const gearbox = rawCarCheck?.['gearbox'] as string ?? findFinding(result, 'gearbox') ?? 'Unknown';
    const bodyType = rawCarCheck?.['body_type'] as string | undefined ?? findFinding(result, 'body_type');

    // ── DVLA fields ───────────────────────────────────────────────────────────
    const dvlaTaxStatus = rawDvla ? extractDvlaTaxStatus(rawDvla) : null;
    const dvlaColour = rawDvla?.['colour'] as string | undefined;

    // ── MOT fields ─────────────────────────────────────────────────────────────
    const motPassed = parseInt(String(rawCarCheck?.['mot_passed'] ?? findFinding(result, 'mot_passed') ?? '0'));
    const motFailed = parseInt(String(rawCarCheck?.['mot_failed'] ?? findFinding(result, 'mot_failed') ?? '0'));
    const motExpiryStr = (rawCarCheck?.['mot_expiry'] as string | undefined) ?? findFinding(result, 'mot_expiry');
    const motExpiryDate = motExpiryStr ? parseMotDate(motExpiryStr) : null;
    const motStatus = motExpiryDate
      ? (motExpiryDate > new Date() ? 'Valid' : 'Expired')
      : (motPassed > 0 || motFailed > 0 ? 'Unknown' : 'No MOT data');

    // ── Valuation ─────────────────────────────────────────────────────────────
    const valMinVal = findFinding(result, 'current_value_min');
    const valMaxVal = findFinding(result, 'current_value_max');
    const valMin = (rawVal?.['currentValueMin'] as number | undefined) ?? (valMinVal ? parseInt(valMinVal) : undefined);
    const valMax = (rawVal?.['currentValueMax'] as number | undefined) ?? (valMaxVal ? parseInt(valMaxVal) : undefined);
    const valAdvMin = rawVal?.['valueWithAdvisoriesMin'] as number | undefined;
    const valAdvMax = rawVal?.['valueWithAdvisoriesMax'] as number | undefined;
    const expectedMonthsVal = findFinding(result, 'expected_months');
    const expectedMonths = (rawVal?.['expectedMonthsRemaining'] as number | undefined) ?? (expectedMonthsVal ? parseInt(expectedMonthsVal) : undefined);
    const totalAdvMinVal = findFinding(result, 'advisory_total_min');
    const totalAdvMin = (rawVal?.['totalAdvisoryCostMin'] as number | undefined) ?? (totalAdvMinVal ? parseInt(totalAdvMinVal) : undefined);
    const totalAdvMaxVal = findFinding(result, 'advisory_total_max');
    const totalAdvMax = (rawVal?.['totalAdvisoryCostMax'] as number | undefined) ?? (totalAdvMaxVal ? parseInt(totalAdvMaxVal) : undefined);
    const motFailRisk = (rawVal?.['motFailRisk'] as string | undefined) ?? findFinding(result, 'mot_fail_risk') ?? 'unknown';
    const recommendation = (rawVal?.['recommendation'] as string | undefined) ?? findFinding(result, 'recommendation');

    // ── Parse MOT history from raw text ───────────────────────────────────────
    const { motRows, mileageTimeline, testCentres } = parseMotHistory(rawText);

    // ── Parse advisories ──────────────────────────────────────────────────────
    const advisories = (rawAdvisories ?? []).map((a: any) => ({
      item: String(a.item ?? ''),
      severity: String(a.severity ?? 'medium'),
      urgency: String(a.urgency ?? 'when_due'),
      estimatedCostMin: Number(a.estimatedCostMin ?? 0),
      estimatedCostMax: Number(a.estimatedCostMax ?? 0),
    }));

    const criticalCount = advisories.filter(a => a.severity === 'critical').length;
    const highCount = advisories.filter(a => a.severity === 'high').length;
    const mediumCount = advisories.filter(a => a.severity === 'medium').length;
    const lowCount = advisories.filter(a => a.severity === 'low').length;

    // ── Risk rating ───────────────────────────────────────────────────────────
    const riskRating = criticalCount > 0 || highCount > 2
      ? '🔴 HIGH'
      : highCount > 0 || mediumCount >= 3
        ? '🟡 MODERATE'
        : '🟢 LOW';

    // ── Confidence scoring ─────────────────────────────────────────────────────
    const dvlaConf = rawDvla && Object.keys(rawDvla).length > 0 ? 100 : 0;
    const motConf = (motPassed > 0 || motFailed > 0 || rawText.length > 100) ? 100 : 0;
    const marketConf = (valMin && valMax) ? 80 : 50;
    const riskConf = 65;
    const overallConf = Math.round((dvlaConf + motConf + marketConf + riskConf) / 4);

    // ── Risk flags ────────────────────────────────────────────────────────────
    const riskFlags: string[] = [];
    // Write-off (check raw text for indicators)
    if (/category\s*[- ]?\s*[sabc]|write[ -]?off|insurance total loss/i.test(rawText)) {
      riskFlags.push('⚠️ Category write-off history');
    }
    // Colour change
    if (dvlaColour && colour && dvlaColour !== colour && colour !== 'Unknown') {
      riskFlags.push(`⚠️ Colour change: DVLA says "${dvlaColour}", reported as "${colour}"`);
    }
    // Mileage anomaly
    const mileageAnomaly = detectMileageAnomaly(mileageTimeline);
    if (mileageAnomaly) riskFlags.push(`⚠️ Mileage anomaly: ${mileageAnomaly}`);
    // MOT gaps
    const motGaps = detectMotGaps(motRows);
    if (motGaps) riskFlags.push(`⚠️ MOT gaps: ${motGaps}`);
    // Repeated failures
    if (motFailed >= 3) riskFlags.push(`⚠️ Repeated failures: ${motFailed} fails on record`);
    // Plate transfers
    if (/plate transfer|registration transferred|plate previously assigned/i.test(rawText)) {
      riskFlags.push('⚠️ Plate transfer history');
    }

    // ── Analyst summary ───────────────────────────────────────────────────────
    const summaryText = buildAnalystSummary({
      make, model, year, colour, motStatus, motExpiryDate,
      motPassed, motFailed, advisories, riskRating, valMin, valMax,
      mileageTimeline, criticalCount, highCount, motFailRisk,
    });

    // ─────────────────────────────────────────────────────────────────────────
    lines.push('');
    lines.push('## 🚗 Vehicle OSINT Report');
    lines.push('');
    lines.push(`**Target:** ${result.query.target}  `);
    lines.push(`**Generated:** ${result.startedAt}  `);
    lines.push(`**Flags:** ${result.query.flags.join(', ') || '(none)'}  `);
    lines.push('');

    // ── Section 1: Vehicle Header Card ───────────────────────────────────────
    lines.push('### 1. Vehicle Header Card');
    lines.push('');
    lines.push('```');
    lines.push(`  Registration: ${result.query.target}`);
    lines.push(`  Make: ${make}`);
    lines.push(`  Model: ${model}`);
    lines.push(`  Year: ${year}`);
    lines.push(`  Colour: ${colour}`);
    lines.push(`  Body Type: ${bodyType ?? 'N/A'}`);
    lines.push(`  Fuel Type: ${fuelType}`);
    lines.push(`  Engine Size: ${engineCc ? `${engineCc} cc` : 'N/A'}`);
    lines.push(`  Transmission: ${gearbox}`);
    lines.push('```');
    lines.push('');

    // ── Section 2: Vehicle Status ─────────────────────────────────────────────
    lines.push('### 2. Vehicle Status');
    lines.push('');
    lines.push('```');
    lines.push(`  ✔ Registered with DVLA${dvlaConf === 100 ? ' (confirmed)' : ' (data unavailable)'}`);
    lines.push(`  ✔ Tax status${dvlaTaxStatus ? `: ${dvlaTaxStatus}` : ': data unavailable'}`);
    lines.push(`  ✔ MOT status: ${motStatus}${motExpiryDate ? ` (expires ${formatDate(motExpiryDate)})` : ''}`);
    lines.push(`  ✔ Last V5 issued date: ${extractV5Date(rawText) ?? 'not found in record'}`);
    lines.push('```');
    lines.push('');

    // ── Section 3: MOT History Intelligence ──────────────────────────────────
    lines.push('### 3. MOT History Intelligence');
    lines.push('');
    const motEmoji = motStatus === 'Valid' ? '✔' : motStatus === 'Expired' ? '🔴' : '❓';
    lines.push(`**Current MOT Status:** ${motEmoji} ${motStatus}`);
    if (motExpiryDate) {
      lines.push(`**MOT Expiry Date:** ${formatDate(motExpiryDate)}`);
    }
    lines.push('');
    if (motRows.length > 0) {
      lines.push('**Recent Test Results:**');
      lines.push('');
      lines.push('| Date | Result | Mileage | Test Centre |');
      lines.push('| --- | --- | --- | --- |');
      motRows.forEach(row => {
        const resEmoji = row.result === 'PASS' ? '✅' : '❌';
        lines.push(`| ${row.date} | ${resEmoji} ${row.result} | ${row.mileage} | ${row.testCentre} |`);
      });
      lines.push('');
    }
    if (advisories.length > 0) {
      const recentAdvisories = advisories.slice(0, 10);
      const advisoryItems = recentAdvisories.map(a => {
        const sevEmoji = a.severity === 'critical' ? '🔴' : a.severity === 'high' ? '🟠' : a.severity === 'medium' ? '🟡' : '🟢';
        return `${sevEmoji} ${a.item}`;
      });
      lines.push(`**Failure Patterns:**`);
      advisoryItems.forEach(a => lines.push(`  🔧 ${a}`));
      lines.push('');
    } else {
      lines.push('**Failure Patterns:**  No advisories recorded on last MOT.');
      lines.push('');
    }

    // ── Section 4: Risk Indicators ───────────────────────────────────────────
    lines.push('### 4. Risk Indicators');
    lines.push('');
    const condLabel = criticalCount > 0 || highCount >= 2
      ? '🔴 Neglect indicators'
      : highCount > 0 || mediumCount >= 3
        ? '🟡 Average condition'
        : '🟢 Well maintained';
    lines.push(`**Overall Condition:** ${condLabel}`);
    lines.push('');
    lines.push(`| Severity | Count |`);
    lines.push(`| --- | --- |`);
    if (criticalCount > 0) lines.push(`| 🔴 Critical | ${criticalCount} |`);
    if (highCount > 0) lines.push(`| 🟠 High | ${highCount} |`);
    if (mediumCount > 0) lines.push(`| 🟡 Medium | ${mediumCount} |`);
    if (lowCount > 0) lines.push(`| 🟢 Low | ${lowCount} |`);
    if (advisories.length === 0) lines.push(`| 🟢 None | 0 |`);
    lines.push('');

    // ── Section 5: Mileage Intelligence ───────────────────────────────────────
    lines.push('### 5. Mileage Intelligence Analysis');
    lines.push('');
    if (mileageTimeline.length > 0) {
      lines.push('**Recorded Mileage Timeline:**');
      lines.push('');
      lines.push('| Year | Mileage |');
      lines.push('| --- | --- |');
      mileageTimeline.forEach(entry => {
        lines.push(`| ${entry.year} | ${entry.mileage.toLocaleString()} mi |`);
      });
      lines.push('');
      const mileageAnalysis = analyseMileageTrend(mileageTimeline);
      lines.push(`**Analysis:** ${mileageAnalysis}`);
      lines.push('');
    } else {
      lines.push('No mileage history extracted from MOT records.');
      lines.push('');
    }

    // ── Section 6: Market Intelligence ────────────────────────────────────────
    lines.push('### 6. Market Intelligence');
    lines.push('');
    if (valMin && valMax) {
      const confEmoji = marketConf >= 80 ? '🟢' : '🟡';
      lines.push(`**Estimated Market Value:** £${valMin.toLocaleString()} – £${valMax.toLocaleString()}`);
      lines.push(`**Valuation Confidence:** ${confEmoji} ${marketConf >= 80 ? 'High' : 'Medium'}`);
      if (valAdvMin && valAdvMax) {
        lines.push(`**As-is value (with advisories):** £${valAdvMin.toLocaleString()} – £${valAdvMax.toLocaleString()}`);
      }
      lines.push('');
    } else {
      lines.push('Market valuation not available.');
      lines.push('');
    }
    // Comparable listings from raw text
    const comparables = extractComparables(rawText);
    if (comparables.length > 0) {
      lines.push('**Comparable listings found:**');
      comparables.forEach(c => lines.push(`  - ${c}`));
      lines.push('');
    }

    // ── Section 7: Insurance Risk Indicators ─────────────────────────────────
    lines.push('### 7. Insurance Risk Indicators');
    lines.push('');
    const insuranceGroup = findFinding(result, 'insurance_group') ?? 'N/A';
    const insRiskEmoji = motFailRisk === 'high' || criticalCount > 0 ? '🔴' : motFailRisk === 'medium' || highCount > 0 ? '🟡' : '🟢';
    const insRiskLabel = motFailRisk === 'high' || criticalCount > 0 ? 'High' : motFailRisk === 'medium' || highCount > 0 ? 'Moderate' : 'Low';
    lines.push(`**Insurance Group:** ${insuranceGroup}`);
    lines.push(`**Risk Rating:** ${insRiskEmoji} ${insRiskLabel}`);
    lines.push('');

    // ── Section 8: Geographic Intelligence ────────────────────────────────────
    lines.push('### 8. Geographic Intelligence');
    lines.push('');
    if (testCentres.length > 0) {
      const uniqueLocations = [...new Set(testCentres)];
      lines.push('**Common test locations:**');
      uniqueLocations.slice(0, 5).forEach(loc => lines.push(`  - ${loc}`));
      lines.push('');
      const usagePattern = inferUsagePattern(uniqueLocations);
      lines.push(`**Usage pattern:** ${usagePattern}`);
      lines.push('');
    } else {
      lines.push('No geographic data available from MOT records.');
      lines.push('');
    }

    // ── Section 9: Mechanical Intelligence ────────────────────────────────────
    lines.push('### 9. Mechanical Intelligence Indicators');
    lines.push('');
    // Known common issues for this make/model from ADVISORY_DATABASE keywords
    const knownIssues = getKnownIssuesForModel(make, model);
    if (knownIssues.length > 0) {
      lines.push('**Known common issues for this make/model:**');
      knownIssues.slice(0, 8).forEach(issue => lines.push(`  🔧 ${issue}`));
      lines.push('');
    }
    if (advisories.length > 0) {
      lines.push('**Specific advisories found on this vehicle:**');
      advisories.slice(0, 10).forEach(a => {
        const sevEmoji = a.severity === 'critical' ? '🔴' : a.severity === 'high' ? '🟠' : a.severity === 'medium' ? '🟡' : '🟢';
        lines.push(`  ${sevEmoji} ${a.item}`);
      });
      lines.push('');
    }
    const reliabilityEmoji = criticalCount > 0 || highCount >= 3 ? '🔴' : highCount > 0 || mediumCount >= 3 ? '🟡' : '🟢';
    const reliabilityLabel = criticalCount > 0 || highCount >= 3 ? 'Poor' : highCount > 0 || mediumCount >= 3 ? 'Average' : 'Good';
    lines.push(`**Model Reliability Rating:** ${reliabilityEmoji} ${reliabilityLabel}`);
    lines.push('');

    // ── Section 10: Ownership Intelligence ────────────────────────────────────
    lines.push('### 10. Ownership Intelligence (OSINT derived)');
    lines.push('');
    const estimatedOwners = estimateOwnerCount(mileageTimeline, motRows, testCentres);
    lines.push(`**Estimated Owner Count:** ${estimatedOwners}`);
    const ownershipIndicators = buildOwnershipIndicators(mileageTimeline, motRows, testCentres);
    if (ownershipIndicators.length > 0) {
      ownershipIndicators.forEach(ind => lines.push(`  - ${ind}`));
    }
    lines.push('');

    // ── Section 11: Risk Flags ────────────────────────────────────────────────
    lines.push('### 11. Risk Flags');
    lines.push('');
    if (riskFlags.length > 0) {
      riskFlags.forEach(flag => lines.push(`  ${flag}`));
    } else {
      lines.push('  No significant risk flags identified.');
    }
    lines.push('');

    // ── Section 12: OSINT Confidence Score ────────────────────────────────────
    lines.push('### 12. OSINT Confidence Score');
    lines.push('');
    lines.push('| Category | Confidence |');
    lines.push('| --- | --- |');
    lines.push(`| DVLA data | ${dvlaConf > 0 ? '🟢 100%' : '🔴 0%'} |`);
    lines.push(`| MOT data | ${motConf > 0 ? '🟢 100%' : '🔴 0%'} |`);
    lines.push(`| Market data | ${marketConf >= 80 ? '🟢 ' + marketConf + '%' : marketConf >= 50 ? '🟡 ' + marketConf + '%' : '🔴 ' + marketConf + '%'} |`);
    lines.push(`| Risk analysis | 🟡 65% |`);
    lines.push('');
    const overallEmoji = overallConf >= 80 ? '🟢' : overallConf >= 50 ? '🟡' : '🔴';
    lines.push(`**Overall OSINT confidence:** ${overallEmoji} **${overallConf}/100**`);
    lines.push('');

    // ── Section 13: Analyst Summary ───────────────────────────────────────────
    lines.push('### 13. Analyst Summary');
    lines.push('');
    lines.push(summaryText);
    lines.push('');

    // ── Section 14: Overall OSINT Risk Rating ─────────────────────────────────
    lines.push('### 14. Overall OSINT Risk Rating');
    lines.push('');
    lines.push(`**${riskRating}**`);
    lines.push('');
  }

  // ── Errors ───────────────────────────────────────────────────────────────────
  if (result.errors.length > 0) {
    lines.push('## Errors');
    lines.push('');
    for (const err of result.errors) {
      lines.push(`- ${err}`);
    }
    lines.push('');
  }

  // ── Raw Data ─────────────────────────────────────────────────────────────────
  lines.push('## Raw Data');
  lines.push('');
  lines.push('```json');
  try {
    lines.push(JSON.stringify(result.rawData, null, 2));
  } catch {
    lines.push('(serialisation failed)');
  }
  lines.push('```');
  lines.push('');

  // ── Recommendations ───────────────────────────────────────────────────────────
  lines.push('## Recommendations');
  lines.push('');
  const highConfFindings = sorted.filter(f => f.confidence >= 80);
  if (highConfFindings.length > 0) {
    lines.push('High-confidence findings to investigate further:');
    for (const f of highConfFindings.slice(0, 10)) {
      lines.push(`- ${f.field} → ${f.value} (${f.source})${f.url ? ` [Link](${f.url})` : ''}`);
    }
  } else {
    lines.push('No high-confidence findings. Consider:');
    lines.push('- Running with `--deep` flag for deeper investigation');
    lines.push('- Providing additional context (e.g., email domain, phone country code)');
  }

  lines.push('');

  // ── Helper: find a finding by field name ─────────────────────────────────────
  function findFinding(result: OsintResult, field: string): string | undefined {
    return result.findings.find(f => f.field === field)?.value;
  }

  // ── Helper: parse a MOT date string into a Date ───────────────────────────────
  function parseMotDate(str: string): Date | null {
    if (!str) return null;
    // Handle formats like "01/02/2023", "1/2/23", "2023-02-01"
    const parts = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (parts) {
      let year = parseInt(parts[3]);
      if (year < 100) year += year > 50 ? 1900 : 2000;
      return new Date(year, parseInt(parts[2]) - 1, parseInt(parts[1]));
    }
    const iso = new Date(str);
    return isNaN(iso.getTime()) ? null : iso;
  }

  // ── Helper: format a Date as DD/MM/YYYY ──────────────────────────────────────
  function formatDate(d: Date): string {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  // ── Helper: extract DVLA tax status from raw DVLA data ───────────────────────
  function extractDvlaTaxStatus(dvla: Record<string, unknown>): string {
    const status = dvla['tax_status'] as string | undefined;
    if (status) return status;
    const taxed = dvla['taxed'] as boolean | undefined;
    const sorn = dvla['sorn'] as boolean | undefined;
    if (taxed === false && sorn === true) return 'SORN';
    if (taxed === true) return 'Taxed';
    if (taxed === false) return 'Untaxed';
    return 'Unknown';
  }

  // ── Helper: extract V5C last issued date from raw text ────────────────────────
  function extractV5Date(rawText: string): string | null {
    const match = rawText.match(/V5[ ]?C.*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)
      ?? rawText.match(/last\s+issued.*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)
      ?? rawText.match(/v5.*?issued.*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    return match ? match[1] : null;
  }

  // ── Helper: parse MOT history rows from raw car-check text ───────────────────
  interface MotRow { date: string; result: string; mileage: string; testCentre: string; }
  function parseMotHistory(rawText: string): {
    motRows: MotRow[];
    mileageTimeline: { year: number; mileage: number }[];
    testCentres: string[];
  } {
    const motRows: MotRow[] = [];
    const mileageTimeline: { year: number; mileage: number }[] = [];
    const testCentres: string[] = [];

    if (!rawText) return { motRows, mileageTimeline, testCentres };

    // Split text into lines
    const lines = rawText.split('\n');

    // MOT date pattern: dates like 01/02/2023 or 1/2/23
    const dateRe = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/g;
    // Mileage pattern: 5-6 digits followed by space and "mi" or "miles"
    const mileageRe = /\b(\d{5,6})\s*(?:mi|miles|mileage)\b/i;
    // Test centre pattern: location strings that follow a date+result
    const centreRe = /([A-Z][A-Za-z\s]+(?:Garage|MOT|Centre|Center|Test|Motor|Engineering|Ltd|Unit|Estate)[A-Za-z\s,0-9]*)/;

    // Try to find MOT result blocks — look for date + PASS/FAIL pattern
    const motBlockRe = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}).*?(PASS|FAIL|PASSED|FAILED)/gi;
    let match: RegExpExecArray | null;

    const seen = new Set<string>();
    while ((match = motBlockRe.exec(rawText)) !== null) {
      const dateStr = match[1];
      const result = match[2].toUpperCase().replace('ED', '');
      const blockStart = match.index;
      const blockEnd = Math.min(blockStart + 150, rawText.length);
      const block = rawText.substring(blockStart, blockEnd);

      // Extract mileage from this block
      const mileageMatch = block.match(mileageRe);
      const mileage = mileageMatch ? parseInt(mileageMatch[1]).toLocaleString() + ' mi' : 'N/A';

      // Extract test centre
      const centreMatch = block.match(centreRe);
      const testCentre = centreMatch ? centreMatch[1].trim() : 'Unknown';

      // Extract year for timeline
      const dateParts = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      let year = 0;
      if (dateParts) {
        let yr = parseInt(dateParts[3]);
        if (yr < 100) yr += yr > 50 ? 1900 : 2000;
        year = yr;
      }

      const key = `${dateStr}-${result}-${mileage}`;
      if (!seen.has(key)) {
        seen.add(key);
        motRows.push({ date: dateStr, result, mileage, testCentre });
        if (year > 2000 && mileageMatch) {
          mileageTimeline.push({ year, mileage: parseInt(mileageMatch[1]) });
        }
        if (testCentre !== 'Unknown') testCentres.push(testCentre);
      }
    }

    // Sort mileage timeline ascending by year
    mileageTimeline.sort((a, b) => a.year - b.year);

    return { motRows, mileageTimeline, testCentres };
  }

  // ── Helper: detect mileage anomalies (rollbacks) ─────────────────────────────
  function detectMileageAnomaly(timeline: { year: number; mileage: number }[]): string | null {
    if (timeline.length < 2) return null;
    for (let i = 1; i < timeline.length; i++) {
      if (timeline[i].mileage < timeline[i - 1].mileage) {
        const drop = timeline[i - 1].mileage - timeline[i].mileage;
        if (drop > 10000) {
          return `possible rollback: ${drop.toLocaleString()} mi drop between ${timeline[i - 1].year} and ${timeline[i].year}`;
        }
      }
    }
    return null;
  }

  // ── Helper: detect MOT year gaps ──────────────────────────────────────────────
  function detectMotGaps(rows: { date: string }[]): string | null {
    if (rows.length < 2) return null;
    const years: number[] = [];
    for (const row of rows) {
      const m = row.date.match(/\d{2,4}$/);
      if (m) {
        let yr = parseInt(m[0]);
        if (yr < 100) yr += yr > 50 ? 1900 : 2000;
        years.push(yr);
      }
    }
    years.sort((a, b) => a - b);
    const gaps: string[] = [];
    for (let i = 1; i < years.length; i++) {
      if (years[i] - years[i - 1] > 1) {
        gaps.push(`missed ${years[i] - years[i - 1] - 1} year(s) between ${years[i - 1]} and ${years[i]}`);
      }
    }
    return gaps.length > 0 ? gaps.join('; ') : null;
  }

  // ── Helper: analyse mileage trend ──────────────────────────────────────────────
  function analyseMileageTrend(timeline: { year: number; mileage: number }[]): string {
    if (timeline.length < 2) return 'Insufficient data for trend analysis.';
    const first = timeline[0];
    const last = timeline[timeline.length - 1];
    const yearsDiff = last.year - first.year || 1;
    const milesPerYear = Math.round((last.mileage - first.mileage) / yearsDiff);
    const avgAnnual = 10000;

    if (milesPerYear > avgAnnual * 1.3) {
      return `📈 High annual mileage: ~${milesPerYear.toLocaleString()} mi/yr (UK avg: ~${avgAnnual.toLocaleString()} mi/yr). Indicates heavy use.`;
    } else if (milesPerYear < avgAnnual * 0.6) {
      return `📉 Low annual mileage: ~${milesPerYear.toLocaleString()} mi/yr (UK avg: ~${avgAnnual.toLocaleString()} mi/yr). Low-use vehicle.`;
    } else {
      return `⚖️ Average annual mileage: ~${milesPerYear.toLocaleString()} mi/yr (UK avg: ~${avgAnnual.toLocaleString()} mi/yr). Typical usage pattern.`;
    }
  }

  // ── Helper: extract comparable listings from raw text ────────────────────────
  function extractComparables(rawText: string): string[] {
    const results: string[] = [];
    const patterns = [
      /(?:autotrader|autotrader\.co\.uk).*?£[\d,]+/gi,
      /(?:ebay|eBay).*?£[\d,]+/gi,
      /similar.*?listed.*?£[\d,]+/gi,
    ];
    for (const pat of patterns) {
      const matches = rawText.match(pat);
      if (matches) {
        for (const m of matches) {
          const clean = m.substring(0, 120).trim();
          if (clean.length > 20) results.push(clean);
        }
      }
    }
    return results.slice(0, 5);
  }

  // ── Helper: get known issues for make/model ───────────────────────────────────
  // Reuse ADVISORY_DATABASE from VehicleValuation by checking keywords
  function getKnownIssuesForModel(make: string, model: string): string[] {
    // We'll do a simple keyword match against make/model in raw text from car-check
    // This is a simplified version — full implementation would cross-reference
    // the ADVISORY_DATABASE keywords with the specific vehicle's make/model
    // For now, return empty and rely on actual advisories found
    return [];
  }

  // ── Helper: estimate owner count ──────────────────────────────────────────────
  function estimateOwnerCount(
    mileageTimeline: { year: number; mileage: number }[],
    motRows: { date: string; result: string; mileage: string; testCentre: string }[],
    testCentres: string[]
  ): string {
    if (motRows.length === 0) return 'Unable to estimate (no MOT data)';

    // Rule of thumb: ~10k miles per year per owner
    const uniqueLocations = new Set(testCentres);
    const locationChanges = uniqueLocations.size;
    const totalYears = motRows.length > 1 ? motRows.length : 1;
    const avgMilesPerYear = mileageTimeline.length >= 2
      ? Math.round((mileageTimeline[mileageTimeline.length - 1].mileage - mileageTimeline[0].mileage) / (totalYears - 1 || 1))
      : 10000;
    const expectedMileage = (new Date().getFullYear() - (mileageTimeline[0]?.year ?? new Date().getFullYear())) * avgMilesPerYear;
    const likelyOwners = expectedMileage > 0 ? Math.max(1, Math.min(10, Math.round(expectedMileage / 10000) - locationChanges + motRows.length)) : motRows.length;

    return `${Math.max(1, Math.min(8, likelyOwners))} (estimated)`;
  }

  // ── Helper: build ownership indicators ───────────────────────────────────────
  function buildOwnershipIndicators(
    mileageTimeline: { year: number; mileage: number }[],
    motRows: { date: string; result: string; mileage: string; testCentre: string }[],
    testCentres: string[]
  ): string[] {
    const indicators: string[] = [];
    const uniqueCentres = new Set(testCentres);
    if (uniqueCentres.size >= 3) {
      indicators.push(`Multiple test locations (${uniqueCentres.size} different centres) — may indicate multiple owners or mobile testing`);
    } else if (uniqueCentres.size === 1 && motRows.length > 3) {
      indicators.push(`Consistent single test location — possibly one owner, garage-maintained vehicle`);
    }
    if (mileageTimeline.length >= 2) {
      const first = mileageTimeline[0];
      const last = mileageTimeline[mileageTimeline.length - 1];
      const totalYears = last.year - first.year;
      const milesPerYear = totalYears > 0 ? Math.round((last.mileage - first.mileage) / totalYears) : 0;
      if (milesPerYear > 15000) {
        indicators.push(`High-mileage usage pattern (~${milesPerYear.toLocaleString()} mi/yr) — possibly commercial or fleet vehicle`);
      } else if (milesPerYear < 5000) {
        indicators.push(`Low-mileage usage pattern (~${milesPerYear.toLocaleString()} mi/yr) — possibly second car or low-use private vehicle`);
      }
    }
    if (indicators.length === 0) {
      indicators.push('Insufficient MOT history to determine ownership patterns');
    }
    return indicators;
  }

  // ── Helper: infer usage pattern from test centre locations ───────────────────
  function inferUsagePattern(locations: string[]): string {
    if (locations.length === 0) return 'Unable to determine (no location data)';
    const locStr = locations.join(' ').toLowerCase();
    if (/garage|motor|service|maintenance|dealer|franchise/i.test(locStr)) {
      return '🏭 Likely dealer/service garage maintained — possibly fleet or managed ownership';
    }
    if (locations.length >= 4) {
      return '🏙️ Urban/commuter — multiple independent test centres across regions';
    }
    if (locations.length >= 2) {
      return '🚗 Commuter pattern — used across multiple locations, regular use';
    }
    return '🏡 Local/regional — single or limited test centre, typical private ownership';
  }

  // ── Helper: build analyst summary text ───────────────────────────────────────
  function buildAnalystSummary(opts: {
    make: string; model: string; year: string | number;
    colour: string; motStatus: string; motExpiryDate: Date | null;
    motPassed: number; motFailed: number; advisories: Array<{ severity: string; item: string }>;
    riskRating: string; valMin?: number; valMax?: number;
    mileageTimeline: { year: number; mileage: number }[];
    criticalCount: number; highCount: number; motFailRisk: string;
  }): string {
    const { make, model, year, colour, motStatus, motExpiryDate, motPassed, motFailed, advisories, riskRating } = opts;
    const vehicleDesc = `${make} ${model} (${year})${colour !== 'Unknown' ? ` in ${colour}` : ''}`;

    let summary = `${vehicleDesc} has an ${motStatus.toLowerCase()} MOT `;
    if (motExpiryDate) {
      summary += `expiring ${formatDate(motExpiryDate)} `;
    }
    summary += `with ${motPassed} pass(es) and ${motFailed} fail(s) on record. `;

    if (advisories.length === 0) {
      summary += `No advisories were raised on the most recent MOT, suggesting the vehicle is in reasonable mechanical condition. `;
    } else {
      const critHigh = opts.criticalCount + opts.highCount;
      if (critHigh > 0) {
        summary += `${critHigh} critical or high-severity issue(s) were identified — immediate attention is recommended before relying on this vehicle. `;
      } else {
        summary += `${advisories.length} advisory/advisories were noted; these are manageable but should be budgeted for. `;
      }
    }

    if (opts.valMin && opts.valMax) {
      summary += `Current market value is estimated at £${opts.valMin.toLocaleString()}–£${opts.valMax.toLocaleString()}. `;
    }

    summary += `Overall risk profile is rated **${riskRating.replace(/[🔴🟡🟢]/g, '').trim()}**.`;

    return summary;
  }

  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  return filePath;
}
