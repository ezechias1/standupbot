/**
 * Called at server startup (or on-demand) to hydrate the in-memory
 * search index from the persisted JSON store.
 */
import { readStore } from "./store";
import { loadIndex } from "./search";

let initialized = false;

export function ensureIndexLoaded() {
  if (initialized) return;
  const store = readStore();
  loadIndex(store.chunks);
  initialized = true;
}

export function invalidateIndex() {
  initialized = false;
}
