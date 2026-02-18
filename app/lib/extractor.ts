import type { DocumentChunk } from "./types";

const CHUNK_SIZE = 600;
const CHUNK_OVERLAP = 100;

export function chunkText(
  text: string,
  docId: string,
  docName: string,
  category: string
): DocumentChunk[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const chunks: DocumentChunk[] = [];
  let i = 0;
  let index = 0;

  while (i < cleaned.length) {
    const end = Math.min(i + CHUNK_SIZE, cleaned.length);
    const chunkText = cleaned.slice(i, end).trim();
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
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
}

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

  // Plain text
  return buffer.toString("utf-8");
}
