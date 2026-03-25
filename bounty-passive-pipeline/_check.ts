import { memory, pipeline } from './src/vector-store.js';

const mc = await memory.count();
const pc = await pipeline.count();
console.log('agent_memory:', mc, 'docs');
console.log('pipeline_findings:', pc, 'docs');

const h = await memory.query('bounty hunting Superhuman Capital.com sessions programs', 3);
for (const x of h) {
  console.log('---');
  console.log('id:', x.id);
  console.log('content:', x.content.slice(0, 100));
  console.log('distance:', x.distance?.toFixed(3));
}
