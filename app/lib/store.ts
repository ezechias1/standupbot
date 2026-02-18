/**
 * store.ts — Simple JSON file-based persistence layer.
 *
 * All documents and their text chunks are stored in a single JSON file at
 * data/store.json. This keeps the setup zero-dependency (no database needed)
 * and works great for local use or small teams.
 *
 * For production at scale, replace this with a real database (e.g. Supabase, Postgres).
 */
import fs from "fs";
import path from "path";
import type { DocumentStore } from "./types";

// Path to the JSON file where all documents and chunks are persisted
const DATA_FILE = path.join(process.cwd(), "data", "store.json");

/** Creates the data/ directory if it doesn't exist yet */
export function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Reads the full store from disk.
 * Returns an empty store if the file doesn't exist or is corrupted.
 */
export function readStore(): DocumentStore {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return { documents: [], chunks: [] };
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as DocumentStore;
  } catch {
    // If the file is corrupted, start fresh rather than crashing
    return { documents: [], chunks: [] };
  }
}

/**
 * Writes the full store back to disk.
 * Called after every upload, URL import, or delete operation.
 */
export function writeStore(store: DocumentStore): void {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}
