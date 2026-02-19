"use client";

import { useEffect, useState } from "react";

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

export default function SubmitPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [yesterday, setYesterday] = useState("");
  const [today, setToday] = useState("");
  const [blockers, setBlockers] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then(setTeam);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMember || !yesterday.trim() || !today.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/standups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMember,
          yesterday: yesterday.trim(),
          today: today.trim(),
          blockers: blockers.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }

      setSuccess(true);
      setYesterday("");
      setToday("");
      setBlockers("");
      setSelectedMember("");
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedInfo = team.find((m) => m.id === selectedMember);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8 fade-up">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Submit Standup</h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
          Quick daily check-in — takes 30 seconds
        </p>
      </div>

      {/* Success toast */}
      {success && (
        <div
          className="mb-6 p-4 rounded-xl fade-up flex items-center gap-3"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{ background: "rgba(255,255,255,0.06)" }}>
            🎉
          </div>
          <div>
            <p className="font-semibold text-sm">Standup submitted!</p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Your team can see your update now.</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl fade-up" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-sm font-medium" style={{ color: "#ccc" }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Member select */}
        <div className="glass-static p-4 sm:p-6 fade-up" style={{ animationDelay: "0.05s" }}>
          <label className="block text-sm font-semibold mb-4">Who are you?</label>
          {team.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              No team members yet. Ask your admin to add people.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
              {team.map((member) => {
                const active = selectedMember === member.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setSelectedMember(member.id)}
                    className="p-3.5 rounded-xl text-left transition-all duration-200"
                    style={{
                      background: active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                      border: active ? "1px solid rgba(255,255,255,0.18)" : "1px solid var(--border)",
                      transform: active ? "scale(1.02)" : "scale(1)",
                    }}
                  >
                    <span className="text-2xl block mb-1.5">{member.avatar}</span>
                    <span className="font-semibold text-sm block">{member.name}</span>
                    <span className="text-[11px] block mt-0.5" style={{ color: "var(--text-secondary)" }}>{member.role}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected member indicator */}
        {selectedInfo && (
          <div className="flex items-center gap-2 px-1 fade-up">
            <span className="text-sm">{selectedInfo.avatar}</span>
            <span className="text-xs font-medium" style={{ color: "#aaa" }}>
              Submitting as {selectedInfo.name}
            </span>
          </div>
        )}

        {/* Yesterday */}
        <div className="glass-static p-4 sm:p-6 fade-up" style={{ animationDelay: "0.1s" }}>
          <label className="flex items-center gap-2 text-sm font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
            What did you do yesterday?
            <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>*</span>
          </label>
          <textarea
            value={yesterday}
            onChange={(e) => setYesterday(e.target.value)}
            placeholder="e.g. Finished the login page redesign, reviewed 3 PRs..."
            rows={3}
            className="input w-full p-3.5 text-sm resize-none"
          />
        </div>

        {/* Today */}
        <div className="glass-static p-4 sm:p-6 fade-up" style={{ animationDelay: "0.15s" }}>
          <label className="flex items-center gap-2 text-sm font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
            What are you working on today?
            <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>*</span>
          </label>
          <textarea
            value={today}
            onChange={(e) => setToday(e.target.value)}
            placeholder="e.g. Starting the dashboard charts, meeting with design team..."
            rows={3}
            className="input w-full p-3.5 text-sm resize-none"
          />
        </div>

        {/* Blockers */}
        <div className="glass-static p-4 sm:p-6 fade-up" style={{ animationDelay: "0.2s" }}>
          <label className="flex items-center gap-2 text-sm font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
            Any blockers?
            <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>optional</span>
          </label>
          <textarea
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            placeholder="e.g. Waiting on API access from backend team..."
            rows={2}
            className="input w-full p-3.5 text-sm resize-none"
          />
        </div>

        {/* Submit */}
        <div className="fade-up" style={{ animationDelay: "0.25s" }}>
          <button
            type="submit"
            disabled={submitting || !selectedMember || !yesterday.trim() || !today.trim()}
            className="btn-primary w-full py-4 text-sm"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full spin-slow" />
                Submitting...
              </span>
            ) : (
              "Submit Standup"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
