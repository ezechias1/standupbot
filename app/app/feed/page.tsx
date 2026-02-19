"use client";

import { useEffect, useState } from "react";

interface Standup {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  yesterday: string;
  today: string;
  blockers: string;
  date: string;
  submittedAt: string;
}

export default function FeedPage() {
  const [standups, setStandups] = useState<Standup[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "blockers">("all");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/standups?date=${selectedDate}`)
      .then((r) => r.json())
      .then((data) => {
        setStandups(data);
        setLoading(false);
      });
  }, [selectedDate]);

  const filtered = filter === "blockers"
    ? standups.filter((s) => s.blockers && s.blockers.trim() !== "")
    : standups;

  // Sort by submission time, newest first
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  function changeDate(delta: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split("T")[0]);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Team Feed</h1>
        <p style={{ color: "var(--text-secondary)" }} className="mt-1">
          Browse standup updates by date
        </p>
      </div>

      {/* Date picker + filter */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => changeDate(-1)} className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            ←
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)", colorScheme: "dark" }}
          />
          <button onClick={() => changeDate(1)} className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            →
          </button>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "var(--accent)", color: "white" }}
          >
            Today
          </button>
        </div>

        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--bg-card)" }}>
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${filter === "all" ? "nav-active" : ""}`}
          >
            All ({standups.length})
          </button>
          <button
            onClick={() => setFilter("blockers")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${filter === "blockers" ? "nav-active" : ""}`}
          >
            Blockers ({standups.filter((s) => s.blockers?.trim()).length})
          </button>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="text-center py-12" style={{ color: "var(--text-secondary)" }}>Loading...</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium">No standups for this date</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {filter === "blockers" ? "No blockers reported — great!" : "Nobody has submitted yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((s, i) => (
            <div
              key={s.id}
              className="rounded-xl p-5 fade-in"
              style={{
                background: "var(--bg-card)",
                border: `1px solid ${s.blockers?.trim() ? "rgba(231,76,60,0.2)" : "var(--border)"}`,
                animationDelay: `${i * 50}ms`,
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{s.memberAvatar}</span>
                <div>
                  <p className="font-semibold text-sm">{s.memberName}</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {new Date(s.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {s.blockers?.trim() && (
                  <span className="ml-auto text-xs font-medium px-2 py-1 rounded-full text-red-300 blocker-pulse"
                    style={{ background: "rgba(231,76,60,0.15)" }}>
                    Blocked
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
                  <p className="text-xs font-medium mb-1" style={{ color: "var(--accent-light)" }}>Yesterday</p>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{s.yesterday}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
                  <p className="text-xs font-medium mb-1" style={{ color: "var(--success)" }}>Today</p>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{s.today}</p>
                </div>
                {s.blockers?.trim() && (
                  <div className="p-3 rounded-lg" style={{ background: "rgba(231,76,60,0.06)" }}>
                    <p className="text-xs font-medium mb-1" style={{ color: "var(--danger)" }}>Blocker</p>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{s.blockers}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
