/**
 * initIndex.ts — Hydrates the in-memory search index from disk on server startup.
 *
 * The search index (MiniSearch) lives in memory for speed, but documents are
 * persisted to data/store.json on disk. This module bridges the two:
 * the first time any API route is called, it reads the store and loads all
 * chunks into the search index so queries work immediately.
 *
 * Why a flag instead of loading in module scope?
 * Next.js API routes can be cold-started at any time. Using a lazy-init flag
 * ensures the index is only built once per server process, not on every request.
 */
import { readStore } from "./store";
import { loadIndex } from "./search";

// Tracks whether the index has been populated for this server process
let initialized = false;

/**
 * Call this at the top of every API route handler.
 * On the first call, reads store.json and builds the search index.
 * Subsequent calls are a no-op (returns immediately).
 */
export function ensureIndexLoaded() {
  if (initialized) return;
  const store = readStore();
  loadIndex(store.chunks);
  initialized = true;
}

/**
 * Marks the index as stale so the next call to ensureIndexLoaded()
 * will re-read the store and rebuild the index.
 * Called after every upload, URL import, or delete.
 */
export function invalidateIndex() {
  initialized = false;
}
