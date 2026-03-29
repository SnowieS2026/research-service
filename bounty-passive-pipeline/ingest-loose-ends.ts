import { add } from './src/vector-store.js';
import { readFileSync } from 'fs';

async function main() {
  console.log('Reading file...');
  const content = readFileSync(
    'C:/Users/bryan/.openclaw/workspace/geopolitics/research/UK-MUSLIM-POLITICIANS-LOOSE-ENDS-FINAL.md',
    'utf8'
  );
  console.log(`Ingesting...`);
  await add('pipeline_findings', [{
    id: 'loose_ends',
    content,
    metadata: { source: 'UK-MUSLIM-POLITICIANS-LOOSE-ENDS-FINAL.md' }
  }]);
  console.log('Done');
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
