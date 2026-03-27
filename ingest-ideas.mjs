import path from 'path';
import fs from 'fs';

// We need to use the vector-store.ts logic directly
// The issue: Chroma v2 uses ULIDs internally but the REST API expects UUIDs for collection paths
// However, the actual collection UUID from Chroma is an 8-4-4-4-12 format (looks like UUID but isn't valid UUIDv4)
// 
// Solution: use the Chroma Python client or call through the Node module that already works
// Since auto-ingest.ts works (it reported "Ingested: 4"), let's use the same approach

const { ChromaClient } = await import('chroma-js');

const content = fs.readFileSync('C:/Users/bryan/.openclaw/workspace/reports/income/high-ticket-automation-ideas.md', 'utf8');

const client = new ChromaClient({ host: 'http://localhost:8000' });

try {
  // Get the collection
  const collection = await client.getCollection({ name: 'agent_memory' });
  console.log('Collection found:', collection.name, collection.id);
  
  // Embed via Ollama
  const OllamaUrl = 'http://localhost:11434';
  const embRes = await fetch(`${OllamaUrl}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'nomic-embed-text', prompt: content.slice(0, 8000) })
  });
  const { embedding } = await embRes.json();
  console.log('Embedding done, size:', embedding.length);
  
  // Add to Chroma using the collection method
  await collection.add({
    ids: ['income-high-ticket-automation-ideas-2026-03-27'],
    documents: [content],
    embeddings: [embedding],
    metadatas: [{ source: 'report', type: 'income_ideas', date: '2026-03-27' }]
  });
  
  console.log('SUCCESS: ingested to agent_memory');
} catch (e) {
  console.error('Error:', e.message);
  // Try alternative: use raw REST with name path
  console.log('Trying raw REST with collection name...');
}
