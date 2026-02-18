/**
 * api/documents/route.ts — Document listing and deletion.
 *
 * GET    /api/documents       → Returns all document metadata for the admin panel
 * DELETE /api/documents?id=   → Removes a document and all its chunks from disk + search index
 */
import { NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";
import { removeDocChunks, loadIndex } from "@/lib/search";
import { invalidateIndex, ensureIndexLoaded } from "@/lib/initIndex";

/** Returns the list of all indexed documents — used by the admin panel to show the document table */
export async function GET() {
  ensureIndexLoaded();
  const store = readStore();
  // Only return document metadata — chunks are server-side only and don't need to go to the browser
  return NextResponse.json({ documents: store.documents });
}

/** Permanently deletes a document and all its associated text chunks */
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  ensureIndexLoaded();
  const store = readStore();

  // Remove the document metadata and all its chunks from the store
  store.documents = store.documents.filter((d) => d.id !== id);
  store.chunks = store.chunks.filter((c) => c.docId !== id);

  // Persist the updated store to disk
  writeStore(store);

  // Sync the in-memory search index: remove deleted chunks and reload
  removeDocChunks(id);
  invalidateIndex();
  loadIndex(store.chunks);

  return NextResponse.json({ success: true });
}
