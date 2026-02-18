import MiniSearch from "minisearch";
import type { DocumentChunk, SourceRef } from "./types";

let _index: MiniSearch<DocumentChunk> | null = null;
let _chunks: DocumentChunk[] = [];

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

export function loadIndex(chunks: DocumentChunk[]) {
  _chunks = chunks;
  _index = buildIndex(chunks);
}

export function addChunks(chunks: DocumentChunk[]) {
  _chunks = [..._chunks, ...chunks];
  _index = buildIndex(_chunks);
}

export function removeDocChunks(docId: string) {
  _chunks = _chunks.filter((c) => c.docId !== docId);
  _index = buildIndex(_chunks);
}

export function search(query: string, topK = 5): DocumentChunk[] {
  if (!_index || _chunks.length === 0) return [];
  const results = _index.search(query, { limit: topK });
  return results as unknown as DocumentChunk[];
}

export function buildSources(chunks: DocumentChunk[]): SourceRef[] {
  const seen = new Set<string>();
  return chunks
    .filter((c) => {
      if (seen.has(c.docId)) return false;
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
