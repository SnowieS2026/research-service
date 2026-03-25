/**
 * sync-memory.ts — Sync agent memory files into the vector store
 *
 * Run at session start or on demand to index:
 *   - memory/YYYY-MM-DD.md (daily logs)
 *   - USER.md, MEMORY.md, HEARTBEAT.md
 *   - bounty-passive-pipeline/logs/research/*.md
 *
 * Usage: npx tsx sync-memory.ts
 */

import { memory } from './src/vector-store.js';
import path from 'path';
import fs from 'fs';

const WORKSPACE = 'C:\\Users\\bryan\\.openclaw\\workspace';
const PIPELINE = 'C:\\Users\\bryan\\.openclaw\\workspace\\bounty-passive-pipeline';

async function main() {
  console.log('\n=== Agent Memory Sync ===\n');

  // ── Daily memory logs ────────────────────────────────────────────────────
  const memDir = path.join(WORKSPACE, 'memory');
  if (fs.existsSync(memDir)) {
    const files = fs.readdirSync(memDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(memDir, file), 'utf8').slice(0, 12000);
        await new Promise(r => setTimeout(r, 200)); // rate limit
        await memory.add([{
          id: `memory:${file}`,
          content,
          metadata: { type: 'daily_memory', file, ingestedAt: Date.now() },
        }]);
      } catch (e) {
        console.warn(`  [memory] ${file}: ${e}`);
      }
    }
    console.log(`  [memory] ${files.length} daily logs`);
  }

  // ── Persona files ───────────────────────────────────────────────────────
  const personaFiles = [
    { key: 'USER.md', file: 'USER.md', type: 'user_context' },
    { key: 'MEMORY.md', file: 'MEMORY.md', type: 'long_term_memory' },
    { key: 'HEARTBEAT.md', file: 'HEARTBEAT.md', type: 'heartbeat_config' },
  ];

  for (const { key, file, type } of personaFiles) {
    const fp = path.join(WORKSPACE, file);
    if (fs.existsSync(fp)) {
      const content = fs.readFileSync(fp, 'utf8').slice(0, 12000);
      await memory.add([{
        id: `persona:${key}`,
        content,
        metadata: { type, file, ingestedAt: Date.now() },
      }]);
      console.log(`  [persona] ${file}`);
    }
  }

  // ── Pipeline research logs ───────────────────────────────────────────────
  const researchDir = path.join(PIPELINE, 'logs', 'research');
  if (fs.existsSync(researchDir)) {
    const files = fs.readdirSync(researchDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(researchDir, file), 'utf8').slice(0, 8000);
      await memory.add([{
        id: `research:${file}`,
        content,
        metadata: { type: 'research', file, ingestedAt: Date.now() },
      }]);
    }
    console.log(`  [research] ${files.length} research docs`);
  }

  const total = await memory.count();
  console.log(`\nAgent memory collection: ${total} documents total\n`);
}

main().catch(console.error);
