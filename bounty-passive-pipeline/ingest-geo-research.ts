// Ingest the 5 geopolitical secrets reports into vector store
// Usage: npx tsx ingest-geo-research.ts

import { pipeline } from './src/vector-store.js';
import * as fs from 'fs';
import * as path from 'path';

const RESEARCH_DIR = 'C:\\Users\\bryan\\.openclaw\\workspace\\geopolitics\\research';

async function main() {
  console.log('\n=== Ingesting Geopolitical Secrets Reports ===\n');

  const files = fs.readdirSync(RESEARCH_DIR).filter(f => f.endsWith('.md'));
  console.log('Files found:', files.length, '\n');

  for (const file of files) {
    const content = fs.readFileSync(path.join(RESEARCH_DIR, file), 'utf8');
    const region = file.replace('-SECRETS-report.md', '').toLowerCase();

    await pipeline.add([{
      id: `geopolitics:research:${region}`,
      content: content.slice(0, 50000),
      metadata: {
        type: 'geopolitical_secrets_report',
        region,
        file,
        ingestedAt: Date.now()
      }
    }]);

    console.log(`  [OK] ${region} — ${content.length} chars`);
    await new Promise(r => setTimeout(r, 300));
  }

  const total = await pipeline.count();
  console.log(`\nTotal in pipeline_findings: ${total} documents\n`);
}

main().catch(console.error);
