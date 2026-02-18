"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  Trash2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  Tag,
  Database,
  Globe,
  Link2,
  Layers,
} from "lucide-react";
import Link from "next/link";
import type { Document } from "@/lib/types";

const CATEGORIES = [
  { value: "hr", label: "HR Policy", color: "#10b981", bg: "#10b98115" },
  { value: "sop", label: "SOP / Process", color: "#f59e0b", bg: "#f59e0b15" },
  { value: "company", label: "Company Doc", color: "#8b5cf6", bg: "#8b5cf615" },
  { value: "other", label: "Other", color: "#64748b", bg: "#64748b15" },
];

interface UploadStatus {
  name: string;
  state: "uploading" | "success" | "error";
  message?: string;
}

interface CrawlStatus {
  url: string;
  state: "crawling" | "success" | "error";
  message?: string;
  docsAdded?: number;
}

export default function AdminPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [category, setCategory] = useState("hr");
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  // URL import state
  const [crawlUrl, setCrawlUrl] = useState("");
  const [crawlMode, setCrawlMode] = useState<"scrape" | "crawl">("scrape");
  const [crawlLimit, setCrawlLimit] = useState(10);
  const [crawlStatuses, setCrawlStatuses] = useState<CrawlStatus[]>([]);
  const [isCrawling, setIsCrawling] = useState(false);

  const fetchDocs = () => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then((d) => setDocuments(d.documents ?? []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const uploadFile = async (file: File) => {
    setUploads((prev) => [
      { name: file.name, state: "uploading" },
      ...prev,
    ]);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", category);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      setUploads((prev) =>
        prev.map((u) =>
          u.name === file.name && u.state === "uploading"
            ? { ...u, state: "success" }
            : u
        )
      );
      fetchDocs();
    } catch (err) {
      setUploads((prev) =>
        prev.map((u) =>
          u.name === file.name && u.state === "uploading"
            ? {
                ...u,
                state: "error",
                message: err instanceof Error ? err.message : "Unknown error",
              }
            : u
        )
      );
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach(uploadFile);
    },
    [category] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
    },
    multiple: true,
  });

  const importFromUrl = async () => {
    const url = crawlUrl.trim();
    if (!url || isCrawling) return;

    const entry: CrawlStatus = { url, state: "crawling" };
    setCrawlStatuses((prev) => [entry, ...prev]);
    setIsCrawling(true);
    setCrawlUrl("");

    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, category, mode: crawlMode, crawlLimit }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Crawl failed");

      setCrawlStatuses((prev) =>
        prev.map((s) =>
          s.url === url && s.state === "crawling"
            ? { ...s, state: "success", docsAdded: data.documentsAdded }
            : s
        )
      );
      fetchDocs();
    } catch (err) {
      setCrawlStatuses((prev) =>
        prev.map((s) =>
          s.url === url && s.state === "crawling"
            ? {
                ...s,
                state: "error",
                message: err instanceof Error ? err.message : "Unknown error",
              }
            : s
        )
      );
    } finally {
      setIsCrawling(false);
    }
  };

  const deleteDoc = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
      fetchDocs();
    } finally {
      setDeleting(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const getCat = (value: string) =>
    CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[3];

  const totalChunks = documents.reduce((a, d) => a + d.chunkCount, 0);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <header
        className="px-6 py-4 border-b sticky top-0 z-10"
        style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
      >
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-lg transition-all"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-card)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-semibold" style={{ color: "var(--text-primary)" }}>
              Document Management
            </h1>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Upload and manage your knowledge base
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Documents", value: documents.length, icon: FileText, color: "#3b82f6" },
            { label: "Text Chunks", value: totalChunks, icon: Database, color: "#8b5cf6" },
            {
              label: "Categories",
              value: new Set(documents.map((d) => d.category)).size,
              icon: Tag,
              color: "#10b981",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-xl border p-4"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} style={{ color }} />
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {label}
                </span>
              </div>
              <div className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Category selector */}
        <div
          className="rounded-xl border p-5"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Upload Settings
          </h2>
          <div>
            <label className="text-xs mb-2 block" style={{ color: "var(--text-secondary)" }}>
              Document Category
            </label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className="px-3 py-1.5 rounded-lg text-xs border transition-all"
                  style={{
                    background: category === cat.value ? cat.bg : "transparent",
                    borderColor: category === cat.value ? cat.color : "var(--border)",
                    color: category === cat.value ? cat.color : "var(--text-secondary)",
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* URL Import */}
        <div
          className="rounded-xl border p-5 space-y-4"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2">
            <Globe size={16} style={{ color: "#3b82f6" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Import from URL
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "#3b82f615", color: "#3b82f6" }}
            >
              Powered by Firecrawl
            </span>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2">
            {([
              { value: "scrape", label: "Single Page", icon: Link2 },
              { value: "crawl",  label: "Crawl Site",  icon: Layers },
            ] as const).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setCrawlMode(value)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all"
                style={{
                  background: crawlMode === value ? "#3b82f615" : "transparent",
                  borderColor: crawlMode === value ? "#3b82f6" : "var(--border)",
                  color: crawlMode === value ? "#3b82f6" : "var(--text-secondary)",
                }}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}

            {crawlMode === "crawl" && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Max pages:
                </span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={crawlLimit}
                  onChange={(e) => setCrawlLimit(Number(e.target.value))}
                  className="w-16 px-2 py-1 rounded-lg border text-xs bg-transparent outline-none"
                  style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                />
              </div>
            )}
          </div>

          {/* URL input row */}
          <div className="flex gap-2">
            <div
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border"
              style={{ background: "#0a0f1e", borderColor: "var(--border)" }}
            >
              <Link2 size={14} style={{ color: "var(--text-secondary)" }} />
              <input
                type="url"
                value={crawlUrl}
                onChange={(e) => setCrawlUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && importFromUrl()}
                placeholder="https://docs.yourcompany.com/..."
                disabled={isCrawling}
                className="flex-1 bg-transparent outline-none text-sm placeholder-slate-600"
                style={{ color: "var(--text-primary)" }}
              />
            </div>
            <button
              onClick={importFromUrl}
              disabled={!crawlUrl.trim() || isCrawling}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 flex items-center gap-2"
              style={{
                background: crawlUrl.trim() && !isCrawling
                  ? "linear-gradient(135deg, #3b82f6, #8b5cf6)"
                  : "#1e293b",
                color: "white",
              }}
            >
              {isCrawling ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Globe size={15} />
              )}
              {isCrawling
                ? crawlMode === "crawl" ? "Crawling..." : "Scraping..."
                : crawlMode === "crawl" ? "Crawl" : "Import"}
            </button>
          </div>

          {/* Crawl statuses */}
          {crawlStatuses.length > 0 && (
            <div className="space-y-2 pt-1">
              {crawlStatuses.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg border"
                  style={{ background: "#0a0f1e", borderColor: "var(--border)" }}
                >
                  {s.state === "crawling" && (
                    <Loader2 size={14} className="text-blue-400 animate-spin flex-shrink-0" />
                  )}
                  {s.state === "success" && (
                    <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                  )}
                  {s.state === "error" && (
                    <XCircle size={14} className="text-red-400 flex-shrink-0" />
                  )}
                  <span
                    className="flex-1 text-xs truncate"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {s.url}
                  </span>
                  {s.state === "crawling" && (
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      Fetching...
                    </span>
                  )}
                  {s.state === "success" && (
                    <span className="text-xs text-green-400">
                      {s.docsAdded} {s.docsAdded === 1 ? "page" : "pages"} indexed
                    </span>
                  )}
                  {s.state === "error" && (
                    <span className="text-xs text-red-400">{s.message}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drop zone */}
        <div
          {...getRootProps()}
          className="rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all"
          style={{
            borderColor: isDragActive ? "#3b82f6" : "var(--border)",
            background: isDragActive ? "#3b82f615" : "var(--bg-card)",
          }}
        >
          <input {...getInputProps()} />
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: isDragActive
                ? "linear-gradient(135deg, #3b82f6, #8b5cf6)"
                : "#1e293b",
            }}
          >
            <Upload size={22} className={isDragActive ? "text-white" : "text-slate-400"} />
          </div>
          <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            {isDragActive ? "Drop files here" : "Drag & drop files here"}
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            or click to browse · PDF, DOCX, TXT, MD supported
          </p>
        </div>

        {/* Upload statuses */}
        {uploads.length > 0 && (
          <div className="space-y-2">
            {uploads.map((u, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
              >
                {u.state === "uploading" && (
                  <Loader2 size={16} className="text-blue-400 animate-spin" />
                )}
                {u.state === "success" && (
                  <CheckCircle size={16} className="text-green-400" />
                )}
                {u.state === "error" && (
                  <XCircle size={16} className="text-red-400" />
                )}
                <span className="text-sm flex-1 truncate" style={{ color: "var(--text-primary)" }}>
                  {u.name}
                </span>
                {u.state === "uploading" && (
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Uploading...
                  </span>
                )}
                {u.state === "success" && (
                  <span className="text-xs text-green-400">Indexed</span>
                )}
                {u.state === "error" && (
                  <span className="text-xs text-red-400">{u.message}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Document list */}
        <div>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Knowledge Base ({documents.length} documents)
          </h2>
          {documents.length === 0 ? (
            <div
              className="rounded-xl border p-10 text-center"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
            >
              <FileText
                size={32}
                className="mx-auto mb-3"
                style={{ color: "var(--text-secondary)" }}
              />
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                No documents yet. Upload some files to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => {
                const cat = getCat(doc.category);
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl border transition-all"
                    style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: cat.bg }}
                    >
                      <FileText size={16} style={{ color: cat.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {doc.name}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ background: cat.bg, color: cat.color }}
                        >
                          {cat.label}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {formatSize(doc.size)}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {doc.chunkCount} chunks
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {formatDate(doc.uploadedAt)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteDoc(doc.id)}
                      disabled={deleting === doc.id}
                      className="p-2 rounded-lg transition-all"
                      style={{ color: "var(--text-secondary)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#ef444415";
                        e.currentTarget.style.color = "#ef4444";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--text-secondary)";
                      }}
                    >
                      {deleting === doc.id ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
