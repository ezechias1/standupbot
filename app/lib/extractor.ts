/**
 * extractor.ts — Text extraction and chunking pipeline.
 *
 * Two responsibilities:
 * 1. extractText()  — Pull plain text out of uploaded files (PDF, DOCX, TXT)
 * 2. chunkText()    — Split that text into overlapping chunks for the search index
 */
import type { DocumentChunk } from "./types";

// Each chunk is 600 characters. Chunks overlap by 100 characters so that
// a sentence split across a boundary doesn't get lost in search.
const CHUNK_SIZE = 600;
const CHUNK_OVERLAP = 100;

/**
 * Splits a large text string into overlapping chunks.
 *
 * Why overlapping? If a key sentence falls right at the boundary between two
 * chunks, overlap ensures it appears in at least one complete chunk and
 * won't be missed by the search engine.
 */
export function chunkText(
  text: string,
  docId: string,
  docName: string,
  category: string
): DocumentChunk[] {
  // Collapse all whitespace (newlines, tabs, extra spaces) into single spaces
  const cleaned = text.replace(/\s+/g, " ").trim();
  const chunks: DocumentChunk[] = [];
  let i = 0;
  let index = 0;

  while (i < cleaned.length) {
    const end = Math.min(i + CHUNK_SIZE, cleaned.length);
    const chunkText = cleaned.slice(i, end).trim();

    // Skip chunks that are too short to be useful (e.g. trailing whitespace)
    if (chunkText.length > 50) {
      chunks.push({
        id: `${docId}-chunk-${index}`,
        docId,
        docName,
        category,
        text: chunkText,
        index,
      });
      index++;
    }

    // Move forward by (CHUNK_SIZE - CHUNK_OVERLAP) to create the overlap
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
}

/**
 * Extracts plain text from a file buffer based on its MIME type.
 *
 * - PDF  → pdf-parse (reads embedded text layer, not OCR)
 * - DOCX → mammoth (strips Word formatting, returns clean text)
 * - Everything else → treated as UTF-8 plain text
 *
 * Both pdf-parse and mammoth are dynamically imported so Next.js can
 * exclude them from the browser bundle (they're server-only).
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === "application/pdf" || mimeType.includes("pdf")) {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType.includes("docx") ||
    mimeType.includes("word")
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // Plain text — just decode the buffer directly
  return buffer.toString("utf-8");
}
