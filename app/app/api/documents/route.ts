import { NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";
import { removeDocChunks, loadIndex } from "@/lib/search";
import { invalidateIndex, ensureIndexLoaded } from "@/lib/initIndex";

export async function GET() {
  ensureIndexLoaded();
  const store = readStore();
  return NextResponse.json({ documents: store.documents });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  ensureIndexLoaded();
  const store = readStore();
  store.documents = store.documents.filter((d) => d.id !== id);
  store.chunks = store.chunks.filter((c) => c.docId !== id);
  writeStore(store);

  removeDocChunks(id);
  invalidateIndex();
  loadIndex(store.chunks);

  return NextResponse.json({ success: true });
}
