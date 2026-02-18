/**
 * search.ts — In-memory full-text search engine powered by MiniSearch.
 *
 * MiniSearch builds a fast inverted index over all document chunks.
 * When a user asks a question, we search this index to find the most
 * relevant chunks, which are then injected into the AI prompt as context.
 *
 * The index lives in memory (not on disk) and is rebuilt from store.json
 * each time the server starts, or whenever documents are added/removed.
 */
import MiniSearch from "minisearch";
import type { DocumentChunk, SourceRef } from "./types";

// In-memory state — these are module-level singletons on the server
let _index: MiniSearch<DocumentChunk> | null = null;
let _chunks: DocumentChunk[] = [];

/**
 * Builds a fresh MiniSearch index from a list of chunks.
 * - Searches across the chunk text (boosted 2x) and document name (1x)
 * - Fuzzy matching (20% tolerance) catches typos
 * - Prefix matching so "vacat" matches "vacation"
 */
function buildIndex(chunks: DocumentChunk[]): MiniSearch<DocumentChunk> {
  const index = new MiniSearch<DocumentChunk>({
    fields: ["text", "docName"],
    storeFields: ["id", "docId", "docName", "category", "text", "index"],
    searchOptions: {
      boost: { text: 2, docName: 1 },
      fuzzy: 0.2,
      prefix: true,
    },
  });
  index.addAll(chunks);
  return index;
}

/** Replaces the entire index — called on server startup from initIndex.ts */
export function loadIndex(chunks: DocumentChunk[]) {
  _chunks = chunks;
  _index = buildIndex(chunks);
}

/** Appends new chunks and rebuilds the index — called after an upload or URL import */
export function addChunks(chunks: DocumentChunk[]) {
  _chunks = [..._chunks, ...chunks];
  _index = buildIndex(_chunks);
}

/** Removes all chunks belonging to a document and rebuilds — called on delete */
export function removeDocChunks(docId: string) {
  _chunks = _chunks.filter((c) => c.docId !== docId);
  _index = buildIndex(_chunks);
}

/**
 * Searches the index for chunks relevant to a query.
 * Returns the top K results ranked by relevance score.
 */
export function search(query: string, topK = 5): DocumentChunk[] {
  if (!_index || _chunks.length === 0) return [];
  const results = _index.search(query).slice(0, topK);
  return results as unknown as DocumentChunk[];
}

/**
 * Converts a list of chunks into deduplicated SourceRef objects for the UI.
 * Only one source per document is returned (the first/best matching chunk).
 * The excerpt is the first 150 characters of that chunk's text.
 */
export function buildSources(chunks: DocumentChunk[]): SourceRef[] {
  const seen = new Set<string>();
  return chunks
    .filter((c) => {
      if (seen.has(c.docId)) return false; // Skip duplicate documents
      seen.add(c.docId);
      return true;
    })
    .map((c) => ({
      docId: c.docId,
      docName: c.docName,
      category: c.category,
      excerpt: c.text.slice(0, 150) + (c.text.length > 150 ? "..." : ""),
    }));
}
