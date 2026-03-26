/**
 * auto-ingest.ts — Lightweight sync that only ingests changed files
 *
 * Run on a schedule (e.g. every 30 min via cron) or at session startup.
 * Tracks last-seen mtime per file in logs/vectorstore/.sync-cursor.json
 * Only re-ingests files that have changed since last run.
 *
 * Usage: npx tsx auto-ingest.ts
 */

import { memory, pipeline } from './src/vector-store.js';
import path from 'path';
import fs from 'fs';

const WORKSPACE = 'C:\\Users\\bryan\\.openclaw\\workspace';
const PIPELINE = 'C:\\Users\\bryan\\.openclaw\\workspace\\bounty-passive-pipeline';
const CURSOR_FILE = path.join(PIPELINE, 'logs', 'vectorstore', '.sync-cursor.json');

interface Cursor {
  lastRun: number; // unix ms
  files: Record<string, number>; // path → mtime
}

function readCursor(): Cursor {
  try {
    return JSON.parse(fs.readFileSync(CURSOR_FILE, 'utf8'));
  } catch {
    return { lastRun: 0, files: {} };
  }
}

function writeCursor(cursor: Cursor) {
  fs.writeFileSync(CURSOR_FILE, JSON.stringify(cursor, null, 2));
}

async function ingestFile(
  id: string,
  fp: string,
  maxSize: number,
  type: string,
  extraMeta: Record<string, unknown> = {}
): Promise<boolean> {
  try {
    const mtime = fs.statSync(fp).mtimeMs;
    const content = fs.readFileSync(fp, 'utf8').slice(0, maxSize);
    await memory.add([{
      id,
      content,
      metadata: { type, file: path.basename(fp), ingestedAt: Date.now(), mtime, ...extraMeta },
    }]);
    return true;
  } catch (e) {
    console.warn(`  [WARN] ${id}: ${e}`);
    return false;
  }
}

async function main() {
  const cursor = readCursor();
  const now = Date.now();
  let totalIngested = 0;
  let totalSkipped = 0;

  console.log(`\n=== Auto-Ingest ===`);
  console.log(`Last run: ${cursor.lastRun ? new Date(cursor.lastRun).toISOString() : 'never'}`);

  // ── Memory files (agent_memory collection) ───────────────────────────────
  const memDir = path.join(WORKSPACE, 'memory');
  if (fs.existsSync(memDir)) {
    const files = fs.readdirSync(memDir).filter(f => f.endsWith('.md'));
    console.log(`\n  [memory] checking ${files.length} daily logs...`);
    for (const file of files) {
      const fp = path.join(memDir, file);
      const mtime = fs.statSync(fp).mtimeMs;
      const id = `memory:${file}`;
      if (cursor.files[id] === mtime) {
        totalSkipped++;
      } else {
        const ok = await ingestFile(id, fp, 12000, 'daily_memory', { file });
        if (ok) { cursor.files[id] = mtime; totalIngested++; }
        await new Promise(r => setTimeout(r, 250));
      }
    }
  }

  // ── Persona files ───────────────────────────────────────────────────────
  const personaFiles = [
    { id: 'persona:USER.md',    file: 'USER.md',    type: 'user_context' },
    { id: 'persona:MEMORY.md', file: 'MEMORY.md',   type: 'long_term_memory' },
    { id: 'persona:HEARTBEAT.md', file: 'HEARTBEAT.md', type: 'heartbeat_config' },
  ];
  console.log(`\n  [persona] checking persona files...`);
  for (const { id, file, type } of personaFiles) {
    const fp = path.join(WORKSPACE, file);
    if (!fs.existsSync(fp)) continue;
    const mtime = fs.statSync(fp).mtimeMs;
    if (cursor.files[id] === mtime) {
      totalSkipped++;
    } else {
      const ok = await ingestFile(id, fp, 12000, type, { file });
      if (ok) { cursor.files[id] = mtime; totalIngested++; }
      await new Promise(r => setTimeout(r, 250));
    }
  }

  // ── Pipeline research (agent_memory) ───────────────────────────────────
  const researchDir = path.join(PIPELINE, 'logs', 'research');
  if (fs.existsSync(researchDir)) {
    const files = fs.readdirSync(researchDir).filter(f => f.endsWith('.md'));
    console.log(`\n  [research] checking ${files.length} research docs...`);
    for (const file of files) {
      const fp = path.join(researchDir, file);
      const mtime = fs.statSync(fp).mtimeMs;
      const id = `research:${file}`;
      if (cursor.files[id] === mtime) {
        totalSkipped++;
      } else {
        const ok = await ingestFile(id, fp, 8000, 'research', { file });
        if (ok) { cursor.files[id] = mtime; totalIngested++; }
        await new Promise(r => setTimeout(r, 250));
      }
    }
  }

  // ── Vehicle reports (pipeline_findings) ─────────────────────────────────
  const reportsDir = path.join(WORKSPACE, 'reports');
  if (fs.existsSync(reportsDir)) {
    const dateDirs = fs.readdirSync(reportsDir).filter(d => d.match(/^\d{4}-\d{2}-\d{2}$/));
    // Only last 7 days
    const cutoff = now - 7 * 24 * 60 * 60 * 1000;
    const recent = dateDirs.filter(d => new Date(d).getTime() > cutoff);
    console.log(`\n  [reports] checking reports/${recent.length} recent dirs...`);
    for (const dir of recent) {
      const files = fs.readdirSync(path.join(reportsDir, dir)).filter(f => f.endsWith('.md'));
      for (const file of files) {
        const fp = path.join(reportsDir, dir, file);
        const mtime = fs.statSync(fp).mtimeMs;
        const id = `report:${dir}:${file}`;
        if (cursor.files[id] === mtime) {
          totalSkipped++;
        } else {
          const ok = await ingestFile(id, fp, 8000, 'vehicle_report', { date: dir, file });
          if (ok) { cursor.files[id] = mtime; totalIngested++; }
          await new Promise(r => setTimeout(r, 250));
        }
      }
    }
  }

  // ── Save cursor ─────────────────────────────────────────────────────────
  cursor.lastRun = now;
  writeCursor(cursor);

  const [memCount, pipeCount] = await Promise.all([memory.count(), pipeline.count()]);
  console.log(`\n  Ingested: ${totalIngested} | Skipped: ${totalSkipped}`);
  console.log(`  Collections — agent_memory: ${memCount} | pipeline_findings: ${pipeCount}`);
  console.log(`  Cursor saved. Done.\n`);
}

main().catch(console.error);
