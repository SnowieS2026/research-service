/**
 * Shared finding interfaces + deduplication for the active scanning layer.
 */
import crypto from 'crypto';
/** Build a stable deduplication ID from a finding's core attributes. */
export function buildFindingId(url, param, type) {
    const raw = `${url}||${param}||${type}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
}
/** Deduplicate findings by url+param+type, keeping the first seen. */
export function deduplicateFindings(findings) {
    const seen = new Set();
    return findings.filter((f) => {
        const key = buildFindingId(f.url, f.param ?? f.param ?? '', f.type);
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
}
/** Map a raw nuclei severity string to our FindingSeverity type. */
export function mapNucleiSeverity(severity) {
    switch (severity.toLowerCase()) {
        case 'critical':
            return 'CRITICAL';
        case 'high':
            return 'HIGH';
        case 'medium':
        case 'moderate':
            return 'MEDIUM';
        case 'low':
        case 'info':
        case 'unknown':
        default:
            return 'LOW';
    }
}
/** Map nuclei finding to our NucleiFinding interface. */
export function nucleiToFinding(url, template, severity, matchedAt, description, evidence) {
    const sev = mapNucleiSeverity(severity);
    return {
        id: buildFindingId(url, template, 'nuclei'),
        url,
        type: 'nuclei',
        severity: sev,
        cvss: sevToCvss(sev),
        tool: 'nuclei',
        description,
        evidence,
        createdAt: new Date().toISOString(),
        references: [],
        template,
        matchedAt
    };
}
/** Convert severity enum to approximate CVSS score. */
export function sevToCvss(sev) {
    switch (sev) {
        case 'CRITICAL':
            return 10.0;
        case 'HIGH':
            return 8.5;
        case 'MEDIUM':
            return 6.0;
        case 'LOW':
            return 3.5;
    }
}
