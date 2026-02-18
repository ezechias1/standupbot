/**
 * api/upload/route.ts — File upload endpoint.
 *
 * Accepts a multipart form with a file and category, then runs the full
 * document ingestion pipeline:
 *   File → extract text → split into chunks → save to store → add to search index
 *
 * Supported file types: PDF, DOCX, TXT, MD (anything with readable text)
 */
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { readStore, writeStore } from "@/lib/store";
import { extractText, chunkText } from "@/lib/extractor";
import { addChunks } from "@/lib/search";
import { ensureIndexLoaded, invalidateIndex } from "@/lib/initIndex";
import type { Document } from "@/lib/types";

export async function POST(req: Request) {
  try {
    // Hydrate the search index if this is the first request since server start
    ensureIndexLoaded();

    // Parse the multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "other";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert the browser File object to a Node.js Buffer for parsing
    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract plain text from the file (handles PDF, DOCX, and plain text)
    const text = await extractText(buffer, file.type);

    if (!text || text.trim().length < 10) {
      return NextResponse.json(
        { error: "Could not extract text from file" },
        { status: 400 }
      );
    }

    // Generate a unique ID for this document
    const docId = uuidv4();

    // Split the extracted text into overlapping 600-character chunks
    const chunks = chunkText(text, docId, file.name, category);

    // Build the document metadata record (no raw text stored here — only chunks)
    const document: Document = {
      id: docId,
      name: file.name,
      category: category as Document["category"],
      uploadedAt: new Date().toISOString(),
      size: buffer.length,
      chunkCount: chunks.length,
    };

    // Persist to disk: add the document + all its chunks to store.json
    const store = readStore();
    store.documents.push(document);
    store.chunks.push(...chunks);
    writeStore(store);

    // Update the in-memory search index with the new chunks
    addChunks(chunks);

    // Mark the index as stale so the next ensureIndexLoaded() rebuilds it cleanly
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
