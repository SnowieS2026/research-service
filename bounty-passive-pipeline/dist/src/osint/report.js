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
