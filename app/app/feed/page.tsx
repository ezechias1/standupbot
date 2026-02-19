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

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  function changeDate(delta: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split("T")[0]);
  }

  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 fade-up">
        <h1 className="text-3xl font-bold tracking-tight">Team Feed</h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
          Browse standup updates by date
        </p>
      </div>

      {/* Date picker + filter */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3 fade-up" style={{ animationDelay: "0.05s" }}>
        <div className="flex items-center gap-2">
          <button onClick={() => changeDate(-1)} className="btn-ghost px-3 py-2 text-sm font-medium">
            ←
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input px-3 py-2 text-sm"
            style={{ colorScheme: "dark" }}
          />
          <button onClick={() => changeDate(1)} className="btn-ghost px-3 py-2 text-sm font-medium">
            →
          </button>
          {!isToday && (
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
              className="btn-primary px-3 py-2 text-xs"
            >
              Today
            </button>
          )}
        </div>

        <div className="toggle-group">
          <button
            onClick={() => setFilter("all")}
            className={`toggle-item ${filter === "all" ? "toggle-active" : ""}`}
          >
            All ({standups.length})
          </button>
          <button
            onClick={() => setFilter("blockers")}
            className={`toggle-item ${filter === "blockers" ? "toggle-active" : ""}`}
          >
            Blockers ({standups.filter((s) => s.blockers?.trim()).length})
          </button>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-44 rounded-2xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="glass text-center py-16 fade-up">
          <p className="text-5xl mb-4">📭</p>
          <p className="font-semibold text-lg">No standups for this date</p>
          <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
            {filter === "blockers" ? "No blockers reported — great!" : "Nobody has submitted yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((s, i) => (
            <div
              key={s.id}
              className="glass p-6 fade-up"
              style={{
                animationDelay: `${0.1 + i * 0.06}s`,
                borderColor: s.blockers?.trim() ? "rgba(255,255,255,0.1)" : undefined,
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  {s.memberAvatar}
                </div>
                <div>
                  <p className="font-semibold text-sm">{s.memberName}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    {new Date(s.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {s.blockers?.trim() && (
                  <span className="badge badge-danger blocker-pulse ml-auto">Blocked</span>
                )}
              </div>

              {/* Content */}
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Yesterday
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "#ccc" }}>{s.yesterday}</p>
                </div>
                <div className="p-3.5 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Today
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "#ccc" }}>{s.today}</p>
                </div>
                {s.blockers?.trim() && (
                  <div className="p-3.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#999" }}>
                      Blocker
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "#ccc" }}>{s.blockers}</p>
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
