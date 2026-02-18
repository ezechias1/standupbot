import fs from "fs";
import path from "path";
import type { DocumentStore } from "./types";

const DATA_FILE = path.join(process.cwd(), "data", "store.json");

export function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function readStore(): DocumentStore {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return { documents: [], chunks: [] };
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as DocumentStore;
  } catch {
    return { documents: [], chunks: [] };
  }
}

export function writeStore(store: DocumentStore): void {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}
