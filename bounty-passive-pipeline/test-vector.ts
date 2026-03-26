import { memory, pipeline } from './src/vector-store.js';

(async () => {
  console.log('=== Vector Store Smoke Test ===');
  const [memCount, pipeCount] = await Promise.all([memory.count(), pipeline.count()]);
  console.log(`agent_memory: ${memCount} | pipeline_findings: ${pipeCount}`);

  // Test semantic query
  const hits = await memory.query('vehicle Mondeo AJ05RCF advisory valuation', 3);
  console.log(`Query hits: ${hits.length}`);
  for (const h of hits) {
    console.log(`  [${h.id}] ${h.content.slice(0, 120)}`);
  }
  process.exit(0);
})().catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
