// Ingest the 5 global Islamic infrastructure reports into vector store
import { pipeline } from './src/vector-store.js';
import * as fs from 'fs';
import * as path from 'path';

const RESEARCH = 'C:\\Users\\bryan\\.openclaw\\workspace\\geopolitics\\research';

const infraFiles = [
  'SAUDI-GLOBAL-ISLAMIC-INFRASTRUCTURE-report.md',
  'IRAN-GLOBAL-ISLAMIC-INFRASTRUCTURE-report.md',
  'MUSLIM-BROTHERHOOD-GLOBAL-report.md',
  'ISLAMIC-CHARITY-DAWAH-NETWORK-report.md',
  'TURKEY-PAKISTAN-GLOBAL-ISLAMIC-NETWORKS-report.md'
];

async function main() {
  console.log('\n=== Ingesting Global Islamic Infrastructure Reports ===\n');
  for (const file of infraFiles) {
    const content = fs.readFileSync(path.join(RESEARCH, file), 'utf8');
    const id = 'geopolitics:' + file.replace('.md','').replace(/-/g,'_').toLowerCase();
    await pipeline.add([{
      id,
      content: content.slice(0, 50000),
      metadata: { type: 'global_islamic_infrastructure', file, ingestedAt: Date.now() }
    }]);
    console.log('  [OK]', file, '—', content.length, 'chars');
    await new Promise(r => setTimeout(r, 200));
  }
  const total = await pipeline.count();
  console.log('\nTotal in pipeline_findings:', total, 'documents\n');
}

main().catch(console.error);
