"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import ReactMarkdown from "react-markdown";
import {
  Send,
  Bot,
  User,
  FileText,
  Sparkles,
  Settings,
  ChevronRight,
  X,
} from "lucide-react";
import type { Message, SourceRef } from "@/lib/types";
import Link from "next/link";

const SUGGESTIONS = [
  "What is our vacation policy?",
  "How do I submit an expense report?",
  "What are the onboarding steps for new employees?",
  "Who do I contact for IT support?",
  "What is the code of conduct?",
  "How does performance review work?",
];

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [docCount, setDocCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then((d) => setDocCount(d.documents?.length ?? 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      const userMsg: Message = {
        id: uuidv4(),
        role: "user",
        content: text.trim(),
        createdAt: Date.now(),
      };

      const assistantId = uuidv4();
      const assistantMsg: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        sources: [],
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setIsStreaming(true);

      const conversationHistory = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: conversationHistory }),
        });

        if (!res.ok) throw new Error("Request failed");

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") continue;

            try {
              const data = JSON.parse(payload);
              if (data.sources) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, sources: data.sources as SourceRef[] }
                      : m
                  )
                );
              }
              if (data.text) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + data.text }
                      : m
                  )
                );
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      } catch (err) {
        console.error(err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    "Sorry, something went wrong. Please try again.",
                }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      {/* Sidebar */}
      <aside
        className="w-64 flex-shrink-0 flex flex-col border-r"
        style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
      >
        {/* Logo */}
        <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}
            >
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                Company AI
              </div>
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Internal Assistant
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="p-4">
          <div
            className="rounded-xl p-3 border"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <FileText size={14} style={{ color: "#3b82f6" }} />
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Knowledge Base
              </span>
            </div>
            <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {docCount}
            </div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {docCount === 1 ? "document" : "documents"} indexed
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div className="flex-1 px-4 overflow-y-auto">
          <div
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--text-secondary)" }}
          >
            Try asking
          </div>
          <div className="space-y-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                disabled={isStreaming}
                className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-start gap-2 group"
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
                <ChevronRight size={12} className="mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span>{s}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Admin link */}
        <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
          <Link
            href="/admin"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
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
            <Settings size={15} />
            <span>Manage Documents</span>
          </Link>
        </div>
      </aside>

      {/* Main chat */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
        >
          <div>
            <h1 className="font-semibold" style={{ color: "var(--text-primary)" }}>
              Company Knowledge Assistant
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Ask anything about HR policies, procedures, and company info
            </p>
          </div>
          {isStreaming && (
            <div className="flex items-center gap-2 text-xs" style={{ color: "#3b82f6" }}>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse-slow" />
              Thinking...
            </div>
          )}
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.length === 0 && (
            <WelcomeScreen onSuggestionClick={sendMessage} disabled={isStreaming} />
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isStreaming &&
            messages.length > 0 &&
            messages[messages.length - 1].role === "assistant" &&
            messages[messages.length - 1].content === "" && (
              <TypingIndicator />
            )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          className="px-6 py-4 border-t flex-shrink-0"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
        >
          <div
            className="flex items-end gap-3 rounded-xl border p-3 transition-all"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask about policies, procedures, or anything company-related..."
              disabled={isStreaming}
              className="flex-1 resize-none bg-transparent outline-none text-sm placeholder-slate-500"
              style={{ color: "var(--text-primary)", minHeight: "24px", maxHeight: "160px" }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isStreaming}
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
              style={{
                background: input.trim() && !isStreaming
                  ? "linear-gradient(135deg, #3b82f6, #8b5cf6)"
                  : "#1e293b",
              }}
            >
              <Send size={16} className="text-white" />
            </button>
          </div>
          <p className="text-xs text-center mt-2" style={{ color: "var(--text-secondary)" }}>
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </main>
    </div>
  );
}

function WelcomeScreen({
  onSuggestionClick,
  disabled,
}: {
  onSuggestionClick: (s: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 animate-fade-in">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}
      >
        <Sparkles size={28} className="text-white" />
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
        How can I help you today?
      </h2>
      <p className="text-sm mb-10 max-w-md text-center" style={{ color: "var(--text-secondary)" }}>
        I have access to your company&apos;s knowledge base. Ask me anything about HR policies,
        procedures, or company information.
      </p>
      <div className="grid grid-cols-2 gap-3 max-w-xl w-full">
        {SUGGESTIONS.slice(0, 4).map((s) => (
          <button
            key={s}
            onClick={() => onSuggestionClick(s)}
            disabled={disabled}
            className="text-left p-4 rounded-xl border text-sm transition-all"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#3b82f6";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-4 animate-slide-up ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: isUser
            ? "linear-gradient(135deg, #0f172a, #1e293b)"
            : "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          border: "1px solid var(--border)",
        }}
      >
        {isUser ? (
          <User size={16} className="text-slate-400" />
        ) : (
          <Bot size={16} className="text-white" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 max-w-2xl ${isUser ? "items-end" : ""} flex flex-col gap-2`}>
        {isUser ? (
          <div
            className="px-4 py-3 rounded-2xl rounded-tr-sm text-sm self-end"
            style={{ background: "#1e3a5f", color: "var(--text-primary)" }}
          >
            {message.content}
          </div>
        ) : (
          <div>
            {message.content ? (
              <div
                className="prose-chat text-sm rounded-2xl rounded-tl-sm px-4 py-3"
                style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}
              >
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            ) : null}

            {/* Sources */}
            {message.sources && message.sources.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {message.sources.map((src) => (
                  <SourceBadge key={src.docId} source={src} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SourceBadge({ source }: { source: SourceRef }) {
  const [open, setOpen] = useState(false);

  const catColors: Record<string, string> = {
    hr: "#10b981",
    sop: "#f59e0b",
    company: "#8b5cf6",
    other: "#64748b",
  };
  const color = catColors[source.category] ?? catColors.other;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-all"
        style={{
          background: `${color}15`,
          borderColor: `${color}40`,
          color: color,
        }}
      >
        <FileText size={11} />
        {source.docName.length > 25
          ? source.docName.slice(0, 25) + "..."
          : source.docName}
      </button>

      {open && (
        <div
          className="absolute bottom-full mb-2 left-0 z-50 w-72 rounded-xl border p-3 text-xs shadow-2xl animate-fade-in"
          style={{ background: "#0f172a", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {source.docName}
            </span>
            <button onClick={() => setOpen(false)}>
              <X size={12} style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
            &ldquo;{source.excerpt}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-4 animate-fade-in">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}
      >
        <Bot size={16} className="text-white" />
      </div>
      <div
        className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5"
        style={{ background: "var(--bg-card)" }}
      >
        <div className="typing-dot w-2 h-2 rounded-full bg-slate-400" />
        <div className="typing-dot w-2 h-2 rounded-full bg-slate-400" />
        <div className="typing-dot w-2 h-2 rounded-full bg-slate-400" />
      </div>
    </div>
  );
}
