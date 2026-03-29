// Ingest all POI reports and global political figures into vector store
// Usage: npx tsx ingest-all-reports.ts

import { pipeline } from './src/vector-store.js';
import * as fs from 'fs';
import * as path from 'path';

const RESEARCH_DIR = 'C:\\Users\\bryan\\.openclaw\\workspace\\geopolitics\\research';

const REPORT_MAP: Record<string, { type: string; region?: string }> = {
  'UK-SECRETS-report.md':                     { type: 'geopolitical_secrets', region: 'uk' },
  'SADIQ-KHAN-POI-report.md':                 { type: 'poi_report', region: 'uk' },
  'HUMZA-YOUSAF-POI-report.md':              { type: 'poi_report', region: 'scotland' },
  'ANAS-SARWAR-POI-report.md':               { type: 'poi_report', region: 'scotland' },
  'GLOBAL-POLITICAL-FIGURES-report.md':      { type: 'global_political_figures', region: 'europe_middleeast_asia' },
  'GLOBAL-POLITICAL-FIGURES-2-report.md':   { type: 'global_political_figures', region: 'americas_china_iran_gulf' },
};

async function main() {
  console.log('\n=== Ingesting All Geopolitical Reports ===\n');

  const files = fs.readdirSync(RESEARCH_DIR).filter(f => REPORT_MAP[f]);
  console.log(`Files to ingest: ${files.length}\n`);

  for (const file of files) {
    const content = fs.readFileSync(path.join(RESEARCH_DIR, file), 'utf8');
    const meta = REPORT_MAP[file];
    const id = file.replace('.md', '').toLowerCase();

    await pipeline.add([{
      id: `geopolitics:${id}`,
      content: content.slice(0, 60000),
      metadata: {
        type: meta.type,
        region: meta.region,
        file,
        ingestedAt: Date.now()
      }
    }]);

    console.log(`  [OK] ${file} — ${content.length} chars`);
    await new Promise(r => setTimeout(r, 200));
  }

  const total = await pipeline.count();
  console.log(`\nTotal in pipeline_findings: ${total} documents\n`);
}

main().catch(console.error);
