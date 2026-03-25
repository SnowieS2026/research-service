/**
 * vector-store.ts — Chroma-backed vector store for the bounty pipeline
 *
 * Two collections:
 *   - pipeline_findings: snapshots, reports, scan results, discovery logs
 *   - agent_memory: daily logs, memory files, USER.md, MEMORY.md content
 *
 * Uses: Chroma server (Docker) + Ollama nomic-embed-text for embeddings
 * Chunking: documents larger than MAX_CHUNK chars are split into overlapping pieces
 */

import { ChromaClient } from 'chromadb';
import path from 'path';
import fs from 'fs';

const VECTORSTORE_DIR = path.join(process.cwd(), 'logs', 'vectorstore');
const OLLAMA_URL = 'http://localhost:11434';
const EMBEDDING_MODEL = 'nomic-embed-text';
const MAX_CHUNK = 4000; // chars per chunk — safe for nomic-embed-text context window

let _client: ChromaClient | null = null;

async function getClient(): Promise<ChromaClient> {
  if (!_client) {
    fs.mkdirSync(VECTORSTORE_DIR, { recursive: true });
    _client = new ChromaClient({ host: 'localhost', port: 8000 });
  }
  return _client;
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    let attempt = 0;
    while (attempt < 3) {
      try {
        const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: EMBEDDING_MODEL, prompt: text }),
        });
        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          throw new Error(`Ollama ${response.status}: ${errText}`.slice(0, 120));
        }
        const data = await response.json() as { embedding: number[] };
        results.push(data.embedding);
        break;
      } catch (e) {
        attempt++;
        if (attempt >= 3) throw e;
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }
  return results;
}

function chunkText(text: string, maxLen = MAX_CHUNK): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxLen) {
    chunks.push(text.slice(i, i + maxLen));
  }
  return chunks;
}

export interface FindingDoc {
  id: string;
  collection: 'pipeline_findings' | 'agent_memory';
  content: string;
  metadata: Record<string, string | number | boolean>;
}

async function getCollection(name: string) {
  const client = await getClient();
  return client.getOrCreateCollection({ name });
}

export async function add(collection: FindingDoc['collection'], docs: Omit<FindingDoc, 'collection'>[]) {
  const col = await getCollection(collection);

  const ids: string[] = [];
  const contents: string[] = [];
  const embeddings: number[][] = [];
  const metad: Record<string, unknown>[] = [];

  for (const doc of docs) {
    // Split large documents into chunks — each chunk gets its own ID
    const chunks = chunkText(doc.content);
    for (let c = 0; c < chunks.length; c++) {
      const chunkId = chunks.length === 1 ? doc.id : `${doc.id}:chunk${c}`;
      ids.push(chunkId);
      contents.push(chunks[c]);
      metad.push({ ...doc.metadata, chunk: c, totalChunks: chunks.length } as Record<string, unknown>);
    }
  }

  // Embed and add in batches of 20
  for (let i = 0; i < contents.length; i += 20) {
    const batch = contents.slice(i, i + 20);
    const batchEmbs = await embedBatch(batch);
    const batchIds = ids.slice(i, i + batch.length);
    const batchMetad = metad.slice(i, i + batch.length);
    await col.add({ ids: batchIds, documents: batch, embeddings: batchEmbs, metadatas: batchMetad });
  }
}

export async function query(
  collection: FindingDoc['collection'],
  queryText: string,
  n = 5
): Promise<Array<{ id: string; content: string; metadata: Record<string, unknown>; distance?: number }>> {
  const col = await getCollection(collection);

  const [queryEmbedding] = await embedBatch([queryText]);

  const results = await col.query({
    queryEmbeddings: [queryEmbedding],
    n,
    includeEmbeddings: false,
    includeDistances: true,
  });

  const hits = results.documents?.[0] ?? [];
  const ids = results.ids?.[0] ?? [];
  const metadatas = results.metadatas?.[0] ?? [];
  const distances = results.distances?.[0] ?? [];

  return hits.map((content, i) => ({
    id: ids[i] ?? '',
    content: content ?? '',
    metadata: (metadatas[i] ?? {}) as Record<string, unknown>,
    distance: distances[i],
  }));
}

export async function remove(collection: FindingDoc['collection'], ids: string[]) {
  const col = await getCollection(collection);
  await col.delete({ ids });
}

export async function count(collection: FindingDoc['collection']): Promise<number> {
  const col = await getCollection(collection);
  return await col.count();
}

export async function peek(collection: FindingDoc['collection'], n = 5) {
  const col = await getCollection(collection);
  const results = await col.get({ limit: n, includeDistances: true, includeEmbeddings: false });
  return results.documents?.map((doc, i) => ({
    id: results.ids[i],
    content: doc,
    metadata: results.metadatas?.[i] ?? {},
    distance: results.distances?.[i],
  })) ?? [];
}

// ── Convenience wrappers ─────────────────────────────────────────────────────

export const pipeline = {
  add: (docs: Omit<FindingDoc, 'collection'>[]) => add('pipeline_findings', docs),
  query: (q: string, n?: number) => query('pipeline_findings', q, n),
  remove: (ids: string[]) => remove('pipeline_findings', ids),
  count: () => count('pipeline_findings'),
  peek: (n?: number) => peek('pipeline_findings', n),
};

export const memory = {
  add: (docs: Omit<FindingDoc, 'collection'>[]) => add('agent_memory', docs),
  query: (q: string, n?: number) => query('agent_memory', q, n),
  remove: (ids: string[]) => remove('agent_memory', ids),
  count: () => count('agent_memory'),
  peek: (n?: number) => peek('agent_memory', n),
};
