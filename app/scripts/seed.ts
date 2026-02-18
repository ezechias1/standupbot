/**
 * Run with: npx tsx scripts/seed.ts
 * Seeds the knowledge base with mock company documents.
 */
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// We replicate the store/extractor logic here to avoid Next.js-specific imports
const DATA_FILE = path.join(process.cwd(), "data", "store.json");
const MOCK_DIR = path.join(process.cwd(), "data", "mock");
const CHUNK_SIZE = 600;
const CHUNK_OVERLAP = 100;

interface Document {
  id: string;
  name: string;
  category: string;
  uploadedAt: string;
  size: number;
  chunkCount: number;
}

interface DocumentChunk {
  id: string;
  docId: string;
  docName: string;
  category: string;
  text: string;
  index: number;
}

function chunkText(text: string, docId: string, docName: string, category: string): DocumentChunk[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const chunks: DocumentChunk[] = [];
  let i = 0, index = 0;
  while (i < cleaned.length) {
    const end = Math.min(i + CHUNK_SIZE, cleaned.length);
    const chunk = cleaned.slice(i, end).trim();
    if (chunk.length > 50) {
      chunks.push({ id: `${docId}-chunk-${index}`, docId, docName, category, text: chunk, index });
      index++;
    }
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

const mockFiles = [
  { file: "hr-policy.txt", category: "hr" },
  { file: "it-sop.txt", category: "sop" },
  { file: "onboarding-sop.txt", category: "sop" },
];

const documents: Document[] = [];
const chunks: DocumentChunk[] = [];

for (const { file, category } of mockFiles) {
  const filePath = path.join(MOCK_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`Skipping ${file} — not found`);
    continue;
  }
  const text = fs.readFileSync(filePath, "utf-8");
  const docId = uuidv4();
  const docChunks = chunkText(text, docId, file, category);

  documents.push({
    id: docId,
    name: file,
    category,
    uploadedAt: new Date().toISOString(),
    size: Buffer.byteLength(text, "utf-8"),
    chunkCount: docChunks.length,
  });
  chunks.push(...docChunks);
  console.log(`✓ Seeded: ${file} (${docChunks.length} chunks)`);
}

fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
fs.writeFileSync(DATA_FILE, JSON.stringify({ documents, chunks }, null, 2));
console.log(`\n✅ Seeded ${documents.length} documents, ${chunks.length} total chunks → data/store.json`);
