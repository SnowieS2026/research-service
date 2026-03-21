/**
 * Shared finding interfaces + deduplication for the active scanning layer.
 */
import crypto from 'crypto';

export type FindingSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface BaseFinding {
  id: string;          // SHA256 of url+param+type
  url: string;
  type: string;        // 'xss' | 'sql' | 'ssrf' | 'idor' | 'auth' | 'rce' | 'info'
  severity: FindingSeverity;
  cvss: number;
  tool: string;
  description: string;
  evidence: string;
  createdAt: string;
  references: string[];
}

export interface XSSFinding extends BaseFinding {
  type: 'xss';
  param: string;
  payload: string;
}

export interface SQLiFinding extends BaseFinding {
  type: 'sql';
  param: string;
  dbms: string;
}

export interface SSRFfinding extends BaseFinding {
  type: 'ssrf';
  param: string;
}

export interface IDORFinding extends BaseFinding {
  type: 'idor';
  param: string;
}

export interface AuthFinding extends BaseFinding {
  type: 'auth';
  subType?: string;
}

export interface RCEFinding extends BaseFinding {
  type: 'rce';
}

export interface InfoFinding extends BaseFinding {
  type: 'info';
}

export interface NucleiFinding extends BaseFinding {
  type: 'nuclei';
  template: string;
  matchedAt: string;
}

export interface ApiFinding extends BaseFinding {
  type: 'api';
  subType: string;
}

export interface ScanRunResult {
  scanId: string;
  startedAt: string;
  duration: number;
  targetsScanned: number;
  findings: BaseFinding[];
  summary: {
    xss: number;
    sql: number;
    ssrf: number;
    idor: number;
    auth: number;
    rce: number;
    info: number;
  };
  stackDetected: Record<string, number>; // tech → count
  errors: string[];
}

export interface ScannerConfig {
  dryRun: boolean;
  tools: {
    dalfox: boolean;
    sqlmap: boolean;
    nuclei: boolean;
    ssrf: boolean;
    auth: boolean;
    api: boolean;
    subfinder: boolean;
    gau: boolean;
    httpx: boolean;
    gitleaks: boolean;
  };
  nucleiTemplates: string;
  rateLimitMs: number;
  timeoutPerTarget: number;
  maxTargetsPerRun: number;
  outputDir: string;
  callbackUrl?: string;
  sqlmapLevel?: number;
  sqlmapRisk?: number;
}

export type AnyFinding = XSSFinding | SQLiFinding | SSRFfinding | IDORFinding | AuthFinding | RCEFinding | InfoFinding | NucleiFinding | ApiFinding;

/** Build a stable deduplication ID from a finding's core attributes. */
export function buildFindingId(url: string, param: string, type: string): string {
  const raw = `${url}||${param}||${type}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/** Deduplicate findings by url+param+type, keeping the first seen. */
export function deduplicateFindings<T extends BaseFinding>(findings: T[]): T[] {
  const seen = new Set<string>();
  return findings.filter((f) => {
    const key = buildFindingId(f.url, (f as unknown as XSSFinding).param ?? (f as unknown as SQLiFinding).param ?? '', f.type);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Map a raw nuclei severity string to our FindingSeverity type. */
export function mapNucleiSeverity(severity: string): FindingSeverity {
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
export function nucleiToFinding(
  url: string,
  template: string,
  severity: string,
  matchedAt: string,
  description: string,
  evidence: string
): NucleiFinding {
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
export function sevToCvss(sev: FindingSeverity): number {
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
