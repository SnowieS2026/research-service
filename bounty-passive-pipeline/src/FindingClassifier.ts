import type { DiffNotification } from './BrowserTool.js';
import type { NormalisedProgram } from './browser/parsers/BaseParser.js';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Classification {
  severity: Severity;
  reasons: string[];
  cvss: number;
  changedFields: string[];
  newAssets: string[];
  removedAssets: string[];
  rewardChanged: 'increased' | 'decreased' | 'unchanged' | 'unknown';
}

/** Approximate CVSS mapping per severity tier */
const SEVERITY_CVSS: Record<Severity, number> = {
  LOW: 3.5,
  MEDIUM: 6.0,
  HIGH: 8.5,
  CRITICAL: 10.0
};

function maxSeverity(a: Severity, b: Severity): Severity {
  const order: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  return order[Math.max(order.indexOf(a), order.indexOf(b))];
}

function parseRewardRange(range: string): { min: number; max: number } | null {
  if (!range || range === 'unknown') return null;
  // Handles: "$1,000 - $5,000", "€500 - €2000", "$500+", "€500–€2000", "Varies"
  const cleaned = range.replace(/[€$£¥]/g, '').replace(/,/g, '').trim();
  const dashMatch = cleaned.match(/(\d+)\s*[-–—]\s*(\d+)/);
  if (dashMatch) {
    return { min: parseInt(dashMatch[1], 10), max: parseInt(dashMatch[2], 10) };
  }
  const plusMatch = cleaned.match(/(\d+)\s*\+/);
  if (plusMatch) {
    return { min: parseInt(plusMatch[1], 10), max: parseInt(plusMatch[1], 10) };
  }
  const singleMatch = cleaned.match(/(\d+)/);
  if (singleMatch) {
    return { min: parseInt(singleMatch[1], 10), max: parseInt(singleMatch[1], 10) };
  }
  return null;
}

function rewardDirection(
  oldRange: string | undefined,
  newRange: string | undefined
): 'increased' | 'decreased' | 'unchanged' | 'unknown' {
  if (!oldRange || !newRange || oldRange === 'unknown' || newRange === 'unknown') {
    return 'unknown';
  }
  const oldParsed = parseRewardRange(oldRange);
  const newParsed = parseRewardRange(newRange);
  if (!oldParsed || !newParsed) return 'unknown';
  if (newParsed.max > oldParsed.max) return 'increased';
  if (newParsed.max < oldParsed.max) return 'decreased';
  if (newParsed.min < oldParsed.min) return 'increased';
  if (newParsed.min > oldParsed.min) return 'decreased';
  return 'unchanged';
}

function arrayDiff(oldArr: string[], newArr: string[]): { added: string[]; removed: string[] } {
  const oldSet = new Set(oldArr);
  const newSet = new Set(newArr);
  return {
    added: newArr.filter(item => !oldSet.has(item)),
    removed: oldArr.filter(item => !newSet.has(item))
  };
}

/**
 * Classifies a DiffNotification into a severity level with reasons.
 */
export function classifyFinding(diff: DiffNotification): Classification {
  const reasons: string[] = [];
  let severity: Severity = 'LOW';

  const allChangedFields = [
    ...diff.diff.addedFields,
    ...diff.diff.removedFields,
    ...diff.diff.changedFields
  ];

  // Get old and new values where available
  const prevProg = diff.prevProgram;

  // Scope assets diff
  let newAssets: string[] = [];
  let removedAssets: string[] = [];
  if (allChangedFields.includes('scope_assets')) {
    const oldAssets = prevProg?.scope_assets ?? [];
    const diffed = arrayDiff(oldAssets, diff.scope_assets);
    newAssets = diffed.added;
    removedAssets = diffed.removed;
  }

  // Reward change — use prevProgram when available, otherwise unknown
  const rewardChanged = allChangedFields.includes('reward_range')
    ? rewardDirection(
        prevProg?.reward_range,
        diff.reward_range
      )
    : 'unchanged';

  // ── Severity logic ──────────────────────────────────────────────────

  // New scope assets → MEDIUM
  if (newAssets.length > 0) {
    reasons.push(`${newAssets.length} new asset(s) added to scope`);
    severity = maxSeverity(severity, 'MEDIUM');
  }

  // Reward range increased → HIGH
  if (rewardChanged === 'increased') {
    reasons.push('Reward range increased');
    severity = maxSeverity(severity, 'HIGH');
  }

  // New allowed techniques → MEDIUM
  if (allChangedFields.includes('allowed_techniques')) {
    reasons.push('Allowed techniques updated');
    severity = maxSeverity(severity, 'MEDIUM');
  }

  // Prohibited techniques removed → HIGH
  if (allChangedFields.includes('prohibited_techniques')) {
    reasons.push('Prohibited/restricted techniques removed from scope');
    severity = maxSeverity(severity, 'HIGH');
  }

  // Scope assets removed → LOW
  if (removedAssets.length > 0) {
    reasons.push(`${removedAssets.length} asset(s) removed from scope`);
    severity = maxSeverity(severity, 'LOW');
  }

  // Reward range decreased → MEDIUM
  if (rewardChanged === 'decreased') {
    reasons.push('Reward range decreased');
    severity = maxSeverity(severity, 'MEDIUM');
  }

  // Program closed / dead → CRITICAL
  if (allChangedFields.includes('program_name') && diff.program_name === 'Unknown') {
    reasons.push('Program may have been closed or renamed');
    severity = maxSeverity(severity, 'CRITICAL');
  }

  // Payout notes changed → LOW
  if (allChangedFields.includes('payout_notes') && diff.payout_notes) {
    reasons.push('Program notes/triage status updated');
    severity = maxSeverity(severity, 'LOW');
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
    changedFields: allChangedFields,
    newAssets,
    removedAssets,
    rewardChanged
  };
}
