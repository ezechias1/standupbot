"use client";

import { useEffect, useState } from "react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

interface SummaryResponse {
  type: string;
  summary: string;
  cached?: boolean;
}

export default function AdminPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [adding, setAdding] = useState(false);

  const [summaryDate, setSummaryDate] = useState(new Date().toISOString().split("T")[0]);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryType, setSummaryType] = useState<"daily" | "weekly">("daily");

  useEffect(() => {
    fetch("/api/team").then((r) => r.json()).then(setTeam);
  }, []);

  async function addMember() {
    if (!newName.trim()) return;
    setAdding(true);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), role: newRole.trim() || "Team Member" }),
    });
    const member = await res.json();
    setTeam((prev) => [...prev, member]);
    setNewName("");
    setNewRole("");
    setAdding(false);
  }

  async function deleteMember(id: string) {
    await fetch(`/api/team?id=${id}`, { method: "DELETE" });
    setTeam((prev) => prev.filter((m) => m.id !== id));
  }

  async function generateSummary() {
    setSummaryLoading(true);
    setSummary(null);
    const param = summaryType === "weekly" ? `week=${summaryDate}` : `date=${summaryDate}`;
    const res = await fetch(`/api/summary?${param}`);
    const data: SummaryResponse = await res.json();
    setSummary(data.summary);
    setSummaryLoading(false);
  }

  // Get Monday of the week for the selected date
  function getMonday(dateStr: string): string {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split("T")[0];
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p style={{ color: "var(--text-secondary)" }} className="mt-1">
          Manage your team and generate AI summaries
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team management */}
        <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-lg font-semibold mb-4">Team Members</h2>

          {/* Add member form */}
          <div className="flex gap-2 mb-4">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name"
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              onKeyDown={(e) => e.key === "Enter" && addMember()}
            />
            <input
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="Role"
              className="w-32 px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              onKeyDown={(e) => e.key === "Enter" && addMember()}
            />
            <button
              onClick={addMember}
              disabled={adding || !newName.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40"
              style={{ background: "var(--accent)" }}
            >
              {adding ? "..." : "Add"}
            </button>
          </div>

          {/* Member list */}
          <div className="space-y-2">
            {team.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-lg fade-in"
                style={{ background: "var(--bg-secondary)" }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{member.avatar}</span>
                  <div>
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{member.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteMember(member.id)}
                  className="text-xs px-2 py-1 rounded-md hover:bg-red-500/20 text-red-400 transition-all"
                >
                  Remove
                </button>
              </div>
            ))}
            {team.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: "var(--text-secondary)" }}>
                Add your first team member above
              </p>
            )}
          </div>
        </div>

        {/* AI Summary */}
        <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            🤖 AI Summary
          </h2>

          {/* Controls */}
          <div className="space-y-3 mb-4">
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
              <button
                onClick={() => setSummaryType("daily")}
                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${summaryType === "daily" ? "nav-active" : ""}`}
              >
                Daily Summary
              </button>
              <button
                onClick={() => setSummaryType("weekly")}
                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${summaryType === "weekly" ? "nav-active" : ""}`}
              >
                Weekly Digest
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="date"
                value={summaryDate}
                onChange={(e) => setSummaryDate(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-sm"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)", colorScheme: "dark" }}
              />
              <button
                onClick={generateSummary}
                disabled={summaryLoading}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40"
                style={{ background: "var(--accent)" }}
              >
                {summaryLoading ? "Generating..." : "Generate"}
              </button>
            </div>

            {summaryType === "weekly" && (
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Week of {getMonday(summaryDate)} (Mon–Fri)
              </p>
            )}
          </div>

          {/* Summary output */}
          {summaryLoading && (
            <div className="text-center py-8">
              <div className="inline-block text-3xl mb-2">🤖</div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>AI is analyzing standups...</p>
            </div>
          )}

          {summary && !summaryLoading && (
            <div className="prose p-4 rounded-lg fade-in text-sm leading-relaxed"
              style={{ background: "var(--bg-secondary)" }}
              dangerouslySetInnerHTML={{ __html: markdownToHtml(summary) }}
            />
          )}

          {!summary && !summaryLoading && (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">📊</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Select a date and click Generate to get an AI-powered summary
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple markdown to HTML (covers the basics from the AI output)
function markdownToHtml(md: string): string {
  return md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^\- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
}
