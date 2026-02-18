/**
 * types.ts — Shared TypeScript types used across the entire app.
 * Defines the shape of documents, chunks, messages, and source references.
 */

/** A document record in the knowledge base (metadata only — raw text is stored in chunks) */
export interface Document {
  id: string;           // Unique UUID generated at upload time
  name: string;         // Original filename or page title from URL import
  category: "hr" | "sop" | "company" | "other"; // Used for color-coded labels in the UI
  uploadedAt: string;   // ISO timestamp of when it was added
  size: number;         // File size in bytes
  chunkCount: number;   // How many text chunks were created from this document
}

/**
 * A single chunk of text extracted from a document.
 * Documents are split into overlapping 600-character chunks so the search
 * engine can find the most relevant section instead of loading the whole doc.
 */
export interface DocumentChunk {
  id: string;       // Unique chunk ID — format: "{docId}-chunk-{index}"
  docId: string;    // Links back to the parent Document
  docName: string;  // Copied from the parent so search results are self-contained
  category: string; // Inherited from the parent document
  text: string;     // The actual text content of this chunk
  index: number;    // Position within the document (0-based)
}

/** The full persisted store — everything saved to data/store.json on disk */
export interface DocumentStore {
  documents: Document[];      // Metadata for every uploaded document
  chunks: DocumentChunk[];    // All text chunks across all documents
}

/** A single message in the chat conversation */
export interface Message {
  id: string;                   // Unique UUID
  role: "user" | "assistant";   // Who sent the message
  content: string;              // Message text (markdown supported for assistant)
  sources?: SourceRef[];        // Documents the AI cited (assistant messages only)
  createdAt: number;            // Unix timestamp in milliseconds
}

/**
 * A reference to a source document cited in an AI response.
 * Shown as clickable badges below each assistant message.
 */
export interface SourceRef {
  docId: string;    // Source document ID
  docName: string;  // Display name shown on the badge
  category: string; // Category used for badge color coding
  excerpt: string;  // First 150 chars of the matched chunk (shown on hover)
}
