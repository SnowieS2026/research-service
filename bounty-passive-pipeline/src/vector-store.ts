/**
 * vector-store.ts — Chroma-backed vector store for the bounty pipeline
 *
 * Two collections:
 *   - pipeline_findings: snapshots, reports, scan results, discovery logs
 *   - agent_memory: daily logs, memory files, USER.md, MEMORY.md content
 *
 * Uses: Chroma server (Docker) + Ollama nomic-embed-text for embeddings
 * Chunking: documents larger than MAX_CHUNK chars are split into overlapping pieces
 * Transport: Chroma REST API v2 (direct HTTP, avoids Node SDK compat issues)
 *
 * Chroma v2 API base: /api/v2/tenants/{tenant}/databases/{database}/collections/{collection}
 * Collection IDs are UUIDs. We derive stable UUIDs from collection names.
 */

import path from 'path';
import fs from 'fs';

const OLLAMA_URL   = 'http://localhost:11434';
const CHROMA_HOST  = 'http://localhost:8000';
const TENANT       = 'default_tenant';
const DATABASE     = 'default_database';
const EMBEDDING_MODEL = 'nomic-embed-text';
const MAX_CHUNK    = 4000; // chars per chunk — safe for nomic-embed-text context window

// Cache of real collection UUIDs (fetched once per process)
let _collectionUuidCache: Record<string, string> = {};

async function fetchCollectionUuid(name: string): Promise<string> {
  if (_collectionUuidCache[name]) return _collectionUuidCache[name];
  const collections = await apiRequest('GET',
    `/api/v2/tenants/${TENANT}/databases/${DATABASE}/collections`) as Array<{ name: string; id: string }>;
  const found = collections.find(c => c.name === name);
  if (!found) throw new Error(`Collection '${name}' not found in Chroma`);
  _collectionUuidCache[name] = found.id;
  return found.id;
}

const collectionPath = async (name: string) =>
  `/api/v2/tenants/${TENANT}/databases/${DATABASE}/collections/${await fetchCollectionUuid(name)}`;

const collectionPathByName = (name: string) =>
  `/api/v2/tenants/${TENANT}/databases/${DATABASE}/collections/${name}`;

// ── Ollama embedding ────────────────────────────────────────────────────────
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
          const err = await response.text().catch(() => '');
          throw new Error(`Ollama ${response.status}: ${err}`.slice(0, 120));
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
  for (let i = 0; i < text.length; i += maxLen) chunks.push(text.slice(i, i + maxLen));
  return chunks;
}

// ── Chroma REST API v2 ───────────────────────────────────────────────────────
async function apiRequest(
  method: string,
  urlPath: string,
  body?: unknown,
): Promise<unknown> {
  const opts: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${CHROMA_HOST}${urlPath}`, opts);
  if (res.status === 204) return undefined;
  const text = await res.text();
  if (!res.ok) throw new Error(`Chroma ${method} ${urlPath} → ${res.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : undefined;
}

// Ensure collection exists (fetch UUID, create if missing)
async function ensureCollection(name: string): Promise<void> {
  try {
    await fetchCollectionUuid(name);
    return; // already exists
  } catch {
    // 404 — create it (Chroma will assign a UUID)
    await apiRequest('POST', `/api/v2/tenants/${TENANT}/databases/${DATABASE}/collections`, {
      name,
    });
    // Fetch and cache the assigned UUID
    await fetchCollectionUuid(name);
  }
}

// ── Public API ───────────────────────────────────────────────────────────────
export interface FindingDoc {
  id: string;
  collection: 'pipeline_findings' | 'agent_memory';
  content: string;
  metadata: Record<string, string | number | boolean>;
}

export async function add(
  collection: FindingDoc['collection'],
  docs: Omit<FindingDoc, 'collection'>[]
): Promise<void> {
  await ensureCollection(collection);
  const path = await collectionPath(collection);

  const allIds: string[] = [];
  const allContents: string[] = [];
  const allEmbeddings: number[][] = [];
  const allMetadatas: Record<string, unknown>[] = [];

  for (const doc of docs) {
    const chunks = chunkText(doc.content);
    for (let c = 0; c < chunks.length; c++) {
      allIds.push(chunks.length === 1 ? doc.id : `${doc.id}:chunk${c}`);
      allContents.push(chunks[c]);
      allMetadatas.push({ ...doc.metadata, chunk: c, totalChunks: chunks.length });
    }
  }

  // Embed in batches of 20
  for (let i = 0; i < allContents.length; i += 20) {
    const batch = allContents.slice(i, i + 20);
    allEmbeddings.push(...(await embedBatch(batch)));
  }

  await apiRequest('POST', `${path}/add`, {
    ids: allIds,
    documents: allContents,
    embeddings: allEmbeddings,
    metadatas: allMetadatas,
  });
}

export async function query(
  collection: FindingDoc['collection'],
  queryText: string,
  n = 5
): Promise<Array<{ id: string; content: string; metadata: Record<string, unknown>; distance?: number }>> {
  const [queryEmbedding] = await embedBatch([queryText]);
  const path = await collectionPath(collection);

  const data = await apiRequest('POST', `${path}/query`, {
    query_embeddings: [queryEmbedding],
    n,
    include_distances: true,
    include_metadatas: true,
  }) as {
    ids: string[][];
    documents: string[][];
    metadatas: Record<string, unknown>[][];
    distances: number[][];
  };

  const ids       = data.ids?.[0] ?? [];
  const contents  = data.documents?.[0] ?? [];
  const metadatas = data.metadatas?.[0] ?? [];
  const distances = data.distances?.[0] ?? [];

  return contents.map((content, i) => ({
    id: ids[i] ?? '',
    content: content ?? '',
    metadata: metadatas[i] ?? {},
    distance: distances[i],
  }));
}

export async function remove(collection: FindingDoc['collection'], ids: string[]): Promise<void> {
  const path = await collectionPath(collection);
  await apiRequest('POST', `${path}/delete`, { ids });
}

export async function count(collection: FindingDoc['collection']): Promise<number> {
  try {
    const path = await collectionPath(collection);
    const data = await apiRequest('GET', path) as { count?: number };
    return data.count ?? 0;
  } catch {
    return 0;
  }
}

export async function peek(
  collection: FindingDoc['collection'],
  n = 5
): Promise<Array<{ id: string; content: string; metadata: Record<string, unknown>; distance?: number }>> {
  const path = await collectionPath(collection);
  const data = await apiRequest('POST', `${path}/get`, {
    limit: n,
    include_distances: true,
    include_metadatas: true,
  }) as {
    ids: string[];
    documents: string[];
    metadatas: Record<string, unknown>[];
    distances: number[];
  };

  return (data.documents ?? []).map((content, i) => ({
    id: data.ids?.[i] ?? '',
    content: content ?? '',
    metadata: data.metadatas?.[i] ?? {},
    distance: data.distances?.[i],
  }));
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
