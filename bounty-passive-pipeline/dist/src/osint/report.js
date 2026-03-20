import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
export function generateOsintReport(result) {
    const today = new Date().toISOString().split('T')[0];
    const safeName = result.query.target.replace(/[^a-z0-9]/gi, '_').substring(0, 40);
    const hash = createHash('md5').update(result.query.target).digest('hex').substring(0, 8);
    const dir = path.join('reports', 'osint', today);
    fs.mkdirSync(dir, { recursive: true });
    const filename = `${result.query.type}-${safeName}-${hash}.md`;
    const filePath = path.join(dir, filename);
    const lines = [];
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
    const bySource = new Map();
    for (const f of sorted) {
        if (!bySource.has(f.source))
            bySource.set(f.source, []);
        bySource.get(f.source).push(f);
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
    // ── Vehicle Valuation & Advisory Breakdown ───────────────────────────────────
    if (result.query.type === 'vehicle') {
        // Extract directly from rawData.vehicle_valuation for rich display
        const rawVal = result.rawData['CarCheck']?.['vehicle_valuation'];
        const rawAdvisories = result.rawData['CarCheck']?.['advisory_costs'];
        const make = rawVal?.make ?? result.findings.find(f => f.field === 'make')?.value ?? 'Unknown';
        const model = rawVal?.model ?? result.findings.find(f => f.field === 'model')?.value ?? 'Unknown';
        const year = rawVal?.year ?? result.findings.find(f => f.field === 'year')?.value ?? '?';
        const colour = result.rawData['CarCheck']?.['Colour']
            ?? result.findings.find(f => f.field === 'colour')?.value ?? 'Unknown';
        const valMin = rawVal?.currentValueMin ?? result.findings.find(f => f.field === 'current_value_min')?.value;
        const valMax = rawVal?.currentValueMax ?? result.findings.find(f => f.field === 'current_value_max')?.value;
        const valAdvMin = rawVal?.valueWithAdvisoriesMin ?? result.findings.find(f => f.field === 'value_minus_advisories')?.value;
        const valAdvMax = rawVal?.valueWithAdvisoriesMax ?? result.findings.find(f => f.field === 'value_minus_advisories_max')?.value;
        const expectedMonths = rawVal?.expectedMonthsRemaining ?? result.findings.find(f => f.field === 'expected_months')?.value;
        const totalAdvMin = rawVal?.totalAdvisoryCostMin ?? result.findings.find(f => f.field === 'advisory_total_min')?.value;
        const totalAdvMax = rawVal?.totalAdvisoryCostMax ?? result.findings.find(f => f.field === 'advisory_total_max')?.value;
        const motFailRisk = rawVal?.motFailRisk ?? result.findings.find(f => f.field === 'mot_fail_risk')?.value;
        const rec = rawVal?.recommendation ?? result.findings.find(f => f.field === 'recommendation')?.value;
        const motPassed = result.rawData['CarCheck']?.['mot_passed']
            ?? result.findings.find(f => f.field === 'mot_passed')?.value;
        const motFailed = result.rawData['CarCheck']?.['mot_failed']
            ?? result.findings.find(f => f.field === 'mot_failed')?.value;
        // ── Vehicle Header Card ────────────────────────────────────────────────────
        lines.push('');
        lines.push('## 🚗 Vehicle Report');
        lines.push('');
        lines.push('```');
        const border = '─'.repeat(48);
        lines.push(`  ${border}`);
        lines.push(`  ${make} ${model}`);
        lines.push(`  ${border}`);
        lines.push(`  📅 Year:    ${year}`);
        lines.push(`  🎨 Colour:  ${colour}`);
        if (motPassed || motFailed) {
            lines.push(`  ✅ MOT:     ${motPassed ?? 0} passed / ${motFailed ?? 0} failed`);
        }
        lines.push(`  ${border}`);
        lines.push('```');
        lines.push('');
        // ── Valuation ──────────────────────────────────────────────────────────────
        if (valMin && valMax) {
            const riskEmoji = motFailRisk === 'high' ? '🔴' : motFailRisk === 'medium' ? '🟠' : '🟢';
            lines.push('### 💷 Current Value (UK, 2026)');
            lines.push('');
            lines.push(`| Metric | Amount |`);
            lines.push(`| --- | --- |`);
            lines.push(`| 🏷️  Private sale (good cond.) | **£${valMin} – £${valMax}** |`);
            if (valAdvMin && valAdvMax) {
                lines.push(`| 📉 As-is with advisories | £${valAdvMin} – £${valAdvMax} |`);
            }
            lines.push(`| ⚠️  MOT fail risk | ${riskEmoji} ${(motFailRisk ?? 'low').toUpperCase()} |`);
            if (totalAdvMin && totalAdvMax) {
                lines.push(`| 🔧 Total advisory cost | £${totalAdvMin} – £${totalAdvMax} |`);
            }
            lines.push('');
            lines.push(`> 💡 **Price paid context:** User paid **£750** for KY05YTJ — ` +
                (parseInt(String(valMin)) >= 600
                    ? `within private sale range. Fair deal.`
                    : `below current value — potentially a good buy if advisories are manageable.`));
            lines.push('');
        }
        // ── MOT History ───────────────────────────────────────────────────────────
        if (motPassed || motFailed) {
            const passed = parseInt(String(motPassed)) || 0;
            const failed = parseInt(String(motFailed)) || 0;
            const passRate = passed + failed > 0 ? Math.round((passed / (passed + failed)) * 100) : 0;
            const rateEmoji = passRate >= 80 ? '🟢' : passRate >= 60 ? '🟡' : '🔴';
            lines.push('### 📋 MOT History');
            lines.push('');
            lines.push(`| Result | Count |`);
            lines.push(`| --- | --- |`);
            lines.push(`| ✅ Passed | ${passed} |`);
            lines.push(`| ❌ Failed | ${failed} |`);
            lines.push(`| 📊 Pass rate | ${rateEmoji} ${passRate}% |`);
            lines.push('');
        }
        // ── Advisory Breakdown ────────────────────────────────────────────────────
        const costFindings = result.findings.filter(f => f.field.startsWith('cost__'));
        if (costFindings.length > 0 || (rawAdvisories && rawAdvisories.length > 0)) {
            lines.push('### 🔍 Most Recent MOT Advisories & Costs');
            lines.push('');
            if (rawAdvisories && rawAdvisories.length > 0) {
                lines.push(`| # | Issue | 🔴 Severity | Urgency | Est. Cost |`);
                lines.push(`| --- | --- | --- | --- | --- |`);
                rawAdvisories.forEach((ac, i) => {
                    const sevEmoji = ac.severity === 'critical' ? '🔴' : ac.severity === 'high' ? '🟠' : ac.severity === 'medium' ? '🟡' : '🟢';
                    const urgLabel = ac.urgency === 'immediate' ? '🚨 NOW' : ac.urgency === 'soon' ? '⚡ Soon' : ac.urgency === 'when_due' ? '📅 Due' : '👀 Monitor';
                    const costStr = ac.estimatedCostMax === 0 ? 'Monitor' : `£${ac.estimatedCostMin}–£${ac.estimatedCostMax}`;
                    lines.push(`| ${i + 1} | ${ac.item} | ${sevEmoji} ${ac.severity.toUpperCase()} | ${urgLabel} | ${costStr} |`);
                });
                lines.push('');
                if (totalAdvMin && totalAdvMax) {
                    lines.push(`**🔧 Total estimated advisory cost: £${totalAdvMin} – £${totalAdvMax}** _(independent garage, 2025-2026)_`);
                    lines.push('');
                }
            }
            else if (costFindings.length > 0) {
                lines.push(`| # | Issue | Severity | Urgency | Est. Cost |`);
                lines.push(`| --- | --- | --- | --- | --- |`);
                for (let i = 0; i < costFindings.length; i++) {
                    const f = costFindings[i];
                    const parts = f.field.split('__');
                    const item = parts[1]?.replace(/_/g, ' ') ?? f.field;
                    const sev = parts[2]?.toUpperCase() ?? 'MEDIUM';
                    const urg = parts[3] ?? 'when_due';
                    const emoji = sev === 'CRITICAL' ? '🔴' : sev === 'HIGH' ? '🟠' : sev === 'MEDIUM' ? '🟡' : '🟢';
                    lines.push(`| ${i + 1} | ${item} | ${emoji} ${sev} | ${urg} | £${f.value} |`);
                }
                lines.push('');
                if (totalAdvMin && totalAdvMax) {
                    lines.push(`**Total estimated advisory cost: £${totalAdvMin} – £${totalAdvMax}**`);
                    lines.push('');
                }
            }
        }
        // ── Lifespan & Recommendation ─────────────────────────────────────────────
        if (expectedMonths || rec) {
            lines.push('### ⏱️ Lifespan & Recommendation');
            lines.push('');
            if (expectedMonths) {
                const m = parseInt(String(expectedMonths));
                const spanEmoji = m <= 3 ? '🔴' : m <= 6 ? '🟠' : m <= 12 ? '🟡' : '🟢';
                lines.push(`${spanEmoji} **Estimated remaining reliable motoring: ~${expectedMonths} months**`);
            }
            if (rec) {
                lines.push(`> ${rec}`);
            }
            lines.push('');
        }
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
    }
    catch {
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
    }
    else {
        lines.push('No high-confidence findings. Consider:');
        lines.push('- Running with `--deep` flag for deeper investigation');
        lines.push('- Providing additional context (e.g., email domain, phone country code)');
    }
    lines.push('');
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    return filePath;
}
