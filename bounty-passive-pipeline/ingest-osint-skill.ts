/**
 * ingest-osint-skill.ts — Ingest vehicle OSINT skill + today's report into vector store
 */
import { pipeline } from './src/vector-store.js';
import path from 'path';
import fs from 'fs';

async function main() {
  // 1. Ingest the vehicle OSINT skill
  const skillPath = 'C:/Users/bryan/.openclaw/workspace/skills/vehicle-osint/SKILL.md';
  if (fs.existsSync(skillPath)) {
    const content = fs.readFileSync(skillPath, 'utf8');
    await pipeline.add([{
      id: 'skill:vehicle-osint',
      content,
      metadata: { type: 'skill', name: 'vehicle-osint', ingestedAt: Date.now() },
    }]);
    console.log('  [skill] vehicle-osint');
  }

  // 2. Ingest today's OSINT reports
  const reportsDir = 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/reports/osint/2026-03-28';
  if (fs.existsSync(reportsDir)) {
    const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(reportsDir, file), 'utf8').slice(0, 10000);
      await pipeline.add([{
        id: `osint-report:${file}`,
        content,
        metadata: { type: 'osint-report', file, date: '2026-03-28', ingestedAt: Date.now() },
      }]);
      console.log(`  [report] ${file}`);
    }
  }

  // 3. Ingest VK06ZWJ full report (the definitive one)
  const vk06Path = 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/reports/osint/2026-03-28/vehicle-VK06ZWJ-full.md';
  if (fs.existsSync(vk06Path)) {
    const content = fs.readFileSync(vk06Path, 'utf8');
    await pipeline.add([{
      id: 'vk06zwj-full-report',
      content,
      metadata: { type: 'vehicle-osint', plate: 'VK06ZWJ', date: '2026-03-28', ingestedAt: Date.now() },
    }]);
    console.log('  [vk06zwj] full 14-section report');
  }

  const total = await pipeline.count();
  console.log(`\nVector store: ${total} documents total`);
}

main().catch(console.error);
