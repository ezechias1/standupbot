export interface Document {
  id: string;
  name: string;
  category: "hr" | "sop" | "company" | "other";
  uploadedAt: string;
  size: number;
  chunkCount: number;
}

export interface DocumentChunk {
  id: string;
  docId: string;
  docName: string;
  category: string;
  text: string;
  index: number;
}

export interface DocumentStore {
  documents: Document[];
  chunks: DocumentChunk[];
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceRef[];
  createdAt: number;
}

export interface SourceRef {
  docId: string;
  docName: string;
  category: string;
  excerpt: string;
}
