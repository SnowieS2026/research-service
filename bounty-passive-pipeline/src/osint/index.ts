import { loadConfig } from '../config.js';
import { Logger } from '../Logger.js';
import { sessions_send } from '../sessions.js';
import { generateOsintReport } from './report.js';
import { deliverOsintResult } from './deliver.js';
import { PersonCollector } from './collectors/PersonCollector.js';
import { BusinessCollector } from './collectors/BusinessCollector.js';
import { VehicleCollector } from './collectors/VehicleCollector.js';
import { PhoneCollector } from './collectors/PhoneCollector.js';
import { EmailCollector } from './collectors/EmailCollector.js';
import { DomainCollector } from './collectors/DomainCollector.js';
import { IpCollector } from './collectors/IpCollector.js';
import { UsernameCollector } from './collectors/UsernameCollector.js';
import { GeneralCollector } from './collectors/GeneralCollector.js';
import type { OsintQuery, OsintResult, CollectorResult, OsintFinding } from './types.js';
export type { OsintQuery, OsintResult, CollectorResult, OsintFinding } from './types.js';
import { createHash } from 'crypto';

const LOG = new Logger('OSINT');

export async function runOsint(query: OsintQuery): Promise<OsintResult> {
  const startedAt = new Date().toISOString();
  const cfg = loadConfig();
  const timeoutMs = cfg.OSINT_TIMEOUT_PER_COLLECTOR_MS ?? 30_000;

  LOG.log(`OSINT: Starting ${query.type} lookup for "${query.target}"`);

  const collectors = getCollectors(query.type);

  const results = await Promise.allSettled(
    collectors.map(collector =>
      runCollectorWithTimeout(collector, query, timeoutMs)
    )
  );

  const allFindings: OsintFinding[] = [];
  const collectorResults: CollectorResult[] = [];
  const allErrors: string[] = [];
  const rawData: Record<string, unknown> = {};

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const collector = collectors[i];

    if (result.status === 'fulfilled') {
      const cr = result.value as CollectorResult;
      allFindings.push(...cr.findings);
      allErrors.push(...cr.errors);
      rawData[cr.collector] = cr.rawData ?? {};
      collectorResults.push(cr);
    } else {
      const errMsg = `${collector.constructor.name} failed: ${result.reason}`;
      LOG.error(errMsg);
      allErrors.push(errMsg);
      collectorResults.push({ collector: collector.constructor.name, findings: [], errors: [errMsg] });
    }
  }

  // Deduplicate by source+field
  const seen = new Set<string>();
  const deduped: OsintFinding[] = [];
  for (const f of allFindings) {
    const key = `${f.source}:${f.field}:${f.value}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(f);
    }
  }

  // Summary
  const summary: Record<string, number> = {};
  for (const cr of collectorResults) {
    summary[cr.collector] = cr.findings.length;
  }

  const duration = Date.now() - new Date(startedAt).getTime();

  const osintResult: OsintResult = {
    query,
    startedAt,
    duration,
    findings: deduped,
    summary,
    rawData,
    errors: allErrors
  };

  LOG.log(`OSINT: Complete – ${deduped.length} findings, ${allErrors.length} errors in ${duration}ms`);

  return osintResult;
}

async function runCollectorWithTimeout(
  collector: OsintCollector,
  query: OsintQuery,
  timeoutMs: number
): Promise<CollectorResult> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve({
        collector: collector.constructor.name,
        findings: [],
        errors: [`${collector.constructor.name} timed out after ${timeoutMs}ms`]
      });
    }, timeoutMs);

    collector.collect(query).then(result => {
      clearTimeout(timer);
      resolve(result);
    }).catch(err => {
      clearTimeout(timer);
      resolve({
        collector: collector.constructor.name,
        findings: [],
        errors: [`${collector.constructor.name} threw: ${String(err)}`]
      });
    });
  });
}

interface OsintCollector {
  collect(query: OsintQuery): Promise<CollectorResult>;
}

function getCollectors(type: OsintQuery['type']): OsintCollector[] {
  switch (type) {
    case 'person':
      return [new PersonCollector()];
    case 'business':
      return [new BusinessCollector()];
    case 'vehicle':
      return [new VehicleCollector()];
    case 'phone':
      return [new PhoneCollector()];
    case 'email':
      return [new EmailCollector()];
    case 'domain':
      return [new DomainCollector()];
    case 'ip':
      return [new IpCollector()];
    case 'username':
      return [new UsernameCollector()];
    case 'general':
      return [new GeneralCollector()];
    default:
      return [new GeneralCollector()];
  }
}

// ── CLI entrypoint ─────────────────────────────────────────────────────────────

export async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const typeIdx = args.indexOf('--osint');

  if (typeIdx === -1) {
    console.error('Usage: npm run osint -- --osint <type> <target> [--deep] [--no-api]');
    console.error('Types: person, business, vehicle, phone, email, domain, ip, username, general');
    process.exit(1);
  }

  const type = args[typeIdx + 1] as OsintQuery['type'];
  const target = args[typeIdx + 2];

  if (!type || !target) {
    console.error('Usage: npm run osint -- --osint <type> <target>');
    process.exit(1);
  }

  const flags = args.slice(typeIdx + 3).filter(f => f.startsWith('--'));

  const result = await runOsint({ type, target, flags });

  // Save report to disk
  const reportPath = generateOsintReport(result);
  LOG.log(`Report saved: ${reportPath}`);

  // Deliver (Telegram + disk)
  await deliverOsintResult(result);
}


// Entry point
main().catch(console.error);
