/**
 * ingest-pipeline.ts — Ingest pipeline outputs into the vector store
 *
 * Run after discovery, browser, and scan phases to index findings.
 * Usage: npx tsx ingest-pipeline.ts [phase]
 *   phase = discovery | browser | scanner | all (default: all)
 */

import { pipeline } from './src/vector-store.js';
import path from 'path';
import fs from 'fs';

const PIPELINE_ROOT = process.cwd();

interface ScanResult {
  scanId?: string;
  startedAt?: string;
  targetsScanned?: number;
  findings?: Array<{
    type?: string;
    severity?: string;
    url?: string;
    param?: string;
    payload?: string;
    description?: string;
  }>;
  summary?: Record<string, number>;
}

async function ingestDiscovery() {
  const logDir = path.join(PIPELINE_ROOT, 'logs', 'research');
  const files = fs.existsSync(logDir) ? fs.readdirSync(logDir).filter(f => f.endsWith('.md')) : [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(logDir, file), 'utf8');
    const id = `discovery:${file.replace(/\.md$/, '')}`;
    await pipeline.add([{
      id,
      content,
      metadata: { type: 'discovery', file, ingestedAt: Date.now() },
    }]);
    console.log(`  [discovery] ${file}`);
  }
}

async function ingestBrowser() {
  // Ingest snapshot files as-is
  const snapDir = path.join(PIPELINE_ROOT, 'logs', 'snapshots');
  if (!fs.existsSync(snapDir)) return;

  const files = fs.readdirSync(snapDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(snapDir, file), 'utf8');
      const data = JSON.parse(raw);

      // Extract meaningful text from snapshot
      const content = JSON.stringify(data).slice(0, 8000);
      const id = `snapshot:${file.replace(/\.json$/, '')}`;

      await pipeline.add([{
        id,
        content,
        metadata: {
          type: 'snapshot',
          file,
          platform: data.platform ?? extractPlatform(file),
          programUrl: data.program_url ?? data.programUrl ?? '',
          ingestedAt: Date.now(),
        },
      }]);
    } catch {}
  }
  console.log(`  [browser] ${files.length} snapshots`);
}

async function ingestScanner() {
  const scanDir = path.join(PIPELINE_ROOT, 'logs', 'scan-results');
  if (!fs.existsSync(scanDir)) return;

  const files = fs.readdirSync(scanDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(scanDir, file), 'utf8');
      const data: ScanResult = JSON.parse(raw);
      const tool = file.replace('-result\.json$/, '');

      const findingCount = data.findings?.length ?? 0;
      const summary = data.summary ?? {};

      const content = JSON.stringify({ scanId: data.scanId, startedAt: data.startedAt, findings: data.findings, summary }).slice(0, 6000);
      const id = `scan:${tool}:${data.scanId ?? file}`;

      await pipeline.add([{
        id,
        content,
        metadata: {
          type: 'scan',
          tool,
          scanId: data.scanId ?? '',
          targetsScanned: data.targetsScanned ?? 0,
          findingCount,
          ingestedAt: Date.now(),
        },
      }]);
    } catch (e) {
      console.warn(`  [scanner] ${file}: ${e}`);
    }
  }
  console.log(`  [scanner] ${files.length} scan results`);
}

async function ingestReports() {
  const reportsDir = path.join(PIPELINE_ROOT, 'reports');
  if (!fs.existsSync(reportsDir)) return;

  const dirs = fs.readdirSync(reportsDir).filter(d => d.match(/^\d{4}-\d{2}-\d{2}$/));

  for (const dir of dirs.slice(-7)) { // last 7 days only
    const reportFiles = fs.readdirSync(path.join(reportsDir, dir)).filter(f => f.endsWith('.md'));
    for (const file of reportFiles) {
      try {
        const content = fs.readFileSync(path.join(reportsDir, dir, file), 'utf8').slice(0, 8000);
        const id = `report:${file}:${dir}`;
        const parts = file.replace(/\.md$/, '').split('-');
        await pipeline.add([{
          id,
          content,
          metadata: {
            type: 'report',
            file,
            date: dir,
            platform: parts[0] ?? '',
            program: parts.slice(1, -1).join('-'),
            ingestedAt: Date.now(),
          },
        }]);
      } catch {}
    }
  }
  console.log(`  [reports] ingested recent reports`);
}

function extractPlatform(file: string): string {
  if (file.includes('bugcrowd')) return 'bugcrowd';
  if (file.includes('hackerone')) return 'hackerone';
  if (file.includes('intigriti')) return 'intigriti';
  if (file.includes('standoff')) return 'standoff365';
  return 'unknown';
}

async function main() {
  const phase = process.argv[2] ?? 'all';
  console.log(`\n=== Pipeline Vector Ingestion ===\n`);

  if (phase === 'all' || phase === 'discovery') {
    await ingestDiscovery();
  }
  if (phase === 'all' || phase === 'browser') {
    await ingestBrowser();
  }
  if (phase === 'all' || phase === 'scanner') {
    await ingestScanner();
  }
  if (phase === 'all' || phase === 'reports') {
    await ingestReports();
  }

  const total = await pipeline.count();
  console.log(`\nPipeline collection: ${total} documents total\n`);
}

main().catch(console.error);
