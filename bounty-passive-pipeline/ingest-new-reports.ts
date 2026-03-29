// Ingest the 5 new targeted investigation reports into vector store
import { pipeline } from './src/vector-store.js';
import * as fs from 'fs';
import * as path from 'path';

const RESEARCH = 'C:\\Users\\bryan\\.openclaw\\workspace\\geopolitics\\research';

const newFiles = [
  'ALEX-SALMOND-SETTLEMENT-report.md',
  'ASIM-SARWAR-FRAUD-report.md',
  'MUSLIM-IMPACT-FORUM-report.md',
  'QATAR-UK-MOSQUE-FUNDING-report.md',
  'WAYNE-COUPENS-report.md'
];

async function main() {
  console.log('\n=== Ingesting New Investigation Reports ===\n');
  for (const file of newFiles) {
    const content = fs.readFileSync(path.join(RESEARCH, file), 'utf8');
    const id = 'geopolitics:' + file.replace('.md','').replace(/-/g,'_').toLowerCase();
    await pipeline.add([{
      id,
      content: content.slice(0, 50000),
      metadata: { type: 'targeted_investigation', file, ingestedAt: Date.now() }
    }]);
    console.log('  [OK]', file, '—', content.length, 'chars');
    await new Promise(r => setTimeout(r, 200));
  }
  const total = await pipeline.count();
  console.log('\nTotal in pipeline_findings:', total, 'documents\n');
}

main().catch(console.error);
