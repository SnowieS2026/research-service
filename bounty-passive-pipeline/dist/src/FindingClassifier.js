/** Approximate CVSS mapping per severity tier */
const SEVERITY_CVSS = {
    LOW: 3.5,
    MEDIUM: 6.0,
    HIGH: 8.5,
    CRITICAL: 10.0
};
function maxSeverity(a, b) {
    const order = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    return order[Math.max(order.indexOf(a), order.indexOf(b))];
}
function parseRewardRange(range) {
    // Handles formats like "$1,000 - $5,000", "€500 - €2000", "$500+", "Varies"
    const cleaned = range.replace(/[€$£,]/g, '').replace(/\s+/g, ' ').trim();
    const match = cleaned.match(/(\d+)\s*-\s*(\d+)/);
    if (match) {
        return { min: parseInt(match[1], 10), max: parseInt(match[2], 10) };
    }
    const single = cleaned.match(/(\d+)/);
    if (single) {
        return { min: parseInt(single[1], 10), max: parseInt(single[1], 10) };
    }
    return null;
}
function rewardDirection(oldRange, newRange) {
    if (!oldRange || !newRange)
        return 'unknown';
    const oldParsed = parseRewardRange(oldRange);
    const newParsed = parseRewardRange(newRange);
    if (!oldParsed || !newParsed)
        return 'unknown';
    if (newParsed.max > oldParsed.max)
        return 'increased';
    if (newParsed.max < oldParsed.max)
        return 'decreased';
    if (newParsed.min < oldParsed.min)
        return 'increased';
    if (newParsed.min > oldParsed.min)
        return 'decreased';
    return 'unchanged';
}
function arrayAddedItems(oldArr, newArr) {
    return newArr.filter((item) => !oldArr.includes(item));
}
function arrayRemovedItems(oldArr, newArr) {
    return oldArr.filter((item) => !newArr.includes(item));
}
/**
 * Classifies a DiffNotification into a severity level with reasons.
 */
export function classifyFinding(diff) {
    const reasons = [];
    let severity = 'LOW';
    const changedFields = [
        ...diff.diff.addedFields,
        ...diff.diff.removedFields,
        ...diff.diff.changedFields
    ];
    const changedFieldNames = changedFields;
    const oldProg = {};
    const newProg = {};
    // We reconstruct partial old/new from the diff notification fields
    // The diff notification IS the new program (it has current values)
    // and the diff tells us what changed. We need old values from diff.
    // Since diff.addedFields/removedFields/changedFields give field names,
    // we use the notification's own arrays for the new values.
    // Scope assets changed?
    const scopeChanged = changedFieldNames.includes('scope_assets');
    const newAssets = scopeChanged
        ? arrayAddedItems([], diff.scope_assets) // diff alone can't give old list easily
        : [];
    const removedAssets = scopeChanged
        ? arrayRemovedItems(diff.scope_assets, [])
        : [];
    // Reward changed?
    const rewardChanged = changedFieldNames.includes('reward_range')
        ? rewardDirection(diff.reward_range, diff.reward_range)
        : 'unchanged';
    // ── Severity logic ──────────────────────────────────────────────────
    // New scope assets → MEDIUM
    if (changedFieldNames.includes('scope_assets') && diff.scope_assets.length > 0) {
        reasons.push('New assets added to scope');
        severity = maxSeverity(severity, 'MEDIUM');
    }
    // Reward range increased → HIGH
    if (rewardChanged === 'increased') {
        reasons.push('Reward range increased');
        severity = maxSeverity(severity, 'HIGH');
    }
    // New allowed techniques → MEDIUM
    if (changedFieldNames.includes('allowed_techniques')) {
        reasons.push('Allowed techniques updated');
        severity = maxSeverity(severity, 'MEDIUM');
    }
    // Prohibited techniques removed → HIGH
    if (changedFieldNames.includes('prohibited_techniques')) {
        reasons.push('Prohibited/restricted techniques removed from scope');
        severity = maxSeverity(severity, 'HIGH');
    }
    // Scope assets removed → LOW
    if (changedFieldNames.includes('scope_assets') && diff.scope_assets.length === 0) {
        reasons.push('Scope assets removed from program');
        severity = maxSeverity(severity, 'LOW');
    }
    // Reward range decreased → MEDIUM
    if (rewardChanged === 'decreased') {
        reasons.push('Reward range decreased');
        severity = maxSeverity(severity, 'MEDIUM');
    }
    // Program closed / dead → CRITICAL
    if (changedFieldNames.includes('program_name') && diff.program_name === 'Unknown') {
        reasons.push('Program may have been closed or renamed');
        severity = maxSeverity(severity, 'CRITICAL');
    }
    // Default – minor changes
    if (reasons.length === 0) {
        reasons.push('Minor program metadata changed');
        severity = 'LOW';
    }
    return {
        severity,
        reasons,
        cvss: SEVERITY_CVSS[severity],
        changedFields: changedFieldNames,
        newAssets,
        removedAssets,
        rewardChanged
    };
}
