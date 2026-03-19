export type OsintQueryType =
  | 'person'
  | 'business'
  | 'vehicle'
  | 'phone'
  | 'email'
  | 'domain'
  | 'ip'
  | 'username'
  | 'general';

export interface OsintQuery {
  type: OsintQueryType;
  target: string;
  flags: string[];
}

export interface OsintFinding {
  source: string;
  field: string;
  value: string;
  confidence: number; // 0-100
  url?: string;
}

export interface CollectorResult {
  collector: string;
  findings: OsintFinding[];
  errors: string[];
  rawData?: Record<string, unknown>;
}

export interface OsintResult {
  query: OsintQuery;
  startedAt: string;
  duration: number;
  findings: OsintFinding[];
  summary: Record<string, number>;
  rawData: Record<string, unknown>;
  errors: string[];
}
