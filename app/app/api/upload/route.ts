import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { readStore, writeStore } from "@/lib/store";
import { extractText, chunkText } from "@/lib/extractor";
import { addChunks } from "@/lib/search";
import { ensureIndexLoaded, invalidateIndex } from "@/lib/initIndex";
import type { Document } from "@/lib/types";

export async function POST(req: Request) {
  try {
    ensureIndexLoaded();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "other";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractText(buffer, file.type);

    if (!text || text.trim().length < 10) {
      return NextResponse.json(
        { error: "Could not extract text from file" },
        { status: 400 }
      );
    }

    const docId = uuidv4();
    const chunks = chunkText(text, docId, file.name, category);

    const document: Document = {
      id: docId,
      name: file.name,
      category: category as Document["category"],
      uploadedAt: new Date().toISOString(),
      size: buffer.length,
      chunkCount: chunks.length,
    };

    const store = readStore();
    store.documents.push(document);
    store.chunks.push(...chunks);
    writeStore(store);

    addChunks(chunks);
    invalidateIndex();

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process file" },
      { status: 500 }
    );
  }
}
