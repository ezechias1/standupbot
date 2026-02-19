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

  function getMonday(dateStr: string): string {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split("T")[0];
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8 fade-up">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
          Manage your team and generate AI summaries
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team management */}
        <div className="glass-static p-4 sm:p-6 fade-up" style={{ animationDelay: "0.05s" }}>
          <h2 className="text-base font-semibold mb-5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            Team Members
            <span className="badge badge-success ml-auto">{team.length} members</span>
          </h2>

          {/* Add member form */}
          <div className="flex flex-col sm:flex-row gap-2 mb-5">
            <div className="flex gap-2 flex-1">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name"
                className="input flex-1 px-3.5 py-2.5 text-sm"
                onKeyDown={(e) => e.key === "Enter" && addMember()}
              />
              <input
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="Role"
                className="input flex-1 sm:w-32 sm:flex-none px-3.5 py-2.5 text-sm"
                onKeyDown={(e) => e.key === "Enter" && addMember()}
              />
            </div>
            <button
              onClick={addMember}
              disabled={adding || !newName.trim()}
              className="btn-primary px-5 py-2.5 text-sm"
            >
              {adding ? (
                <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full spin-slow inline-block" />
              ) : (
                "Add"
              )}
            </button>
          </div>

          {/* Member list */}
          <div className="space-y-2">
            {team.map((member, i) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3.5 rounded-xl transition-all hover:bg-white/[0.03] fade-up group"
                style={{ background: "rgba(255,255,255,0.02)", animationDelay: `${0.1 + i * 0.04}s` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                    style={{ background: "rgba(255,255,255,0.04)" }}>
                    {member.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{member.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteMember(member.id)}
                  className="text-xs px-3 py-1.5 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#999",
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            {team.length === 0 && (
              <div className="text-center py-8 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                <p className="text-3xl mb-2">👥</p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Add your first team member above</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Summary */}
        <div className="glass-static p-4 sm:p-6 fade-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-base font-semibold mb-5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
            AI Summary
          </h2>

          {/* Controls */}
          <div className="space-y-3 mb-5">
            <div className="toggle-group">
              <button
                onClick={() => setSummaryType("daily")}
                className={`toggle-item ${summaryType === "daily" ? "toggle-active" : ""}`}
              >
                Daily Summary
              </button>
              <button
                onClick={() => setSummaryType("weekly")}
                className={`toggle-item ${summaryType === "weekly" ? "toggle-active" : ""}`}
              >
                Weekly Digest
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="date"
                value={summaryDate}
                onChange={(e) => setSummaryDate(e.target.value)}
                className="input flex-1 px-3.5 py-2.5 text-sm"
                style={{ colorScheme: "dark" }}
              />
              <button
                onClick={generateSummary}
                disabled={summaryLoading}
                className="btn-primary px-5 py-2.5 text-sm"
              >
                {summaryLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full spin-slow" />
                    <span>Analyzing...</span>
                  </span>
                ) : (
                  "Generate"
                )}
              </button>
            </div>

            {summaryType === "weekly" && (
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Week of {getMonday(summaryDate)} (Mon-Fri)
              </p>
            )}
          </div>

          {/* Summary output */}
          {summaryLoading && (
            <div className="text-center py-10 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-2xl spin-slow inline-block">🤖</span>
              </div>
              <p className="font-medium text-sm">AI is analyzing standups...</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>This takes a few seconds</p>
              <div className="mt-4 space-y-2 max-w-xs mx-auto">
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-3 w-4/5" />
                <div className="skeleton h-3 w-3/5" />
              </div>
            </div>
          )}

          {summary && !summaryLoading && (
            <div
              className="prose p-5 rounded-xl fade-up text-sm leading-relaxed"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}
              dangerouslySetInnerHTML={{ __html: markdownToHtml(summary) }}
            />
          )}

          {!summary && !summaryLoading && (
            <div className="text-center py-10 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                style={{ background: "rgba(255,255,255,0.03)" }}>
                <span className="text-2xl">📊</span>
              </div>
              <p className="font-medium text-sm">Generate an AI summary</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                Select a date and click Generate
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
