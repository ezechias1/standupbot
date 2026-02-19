"use client";

import { useEffect, useState } from "react";

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Submit Standup</h1>
        <p style={{ color: "var(--text-secondary)" }} className="mt-1">
          Quick daily check-in — takes 30 seconds
        </p>
      </div>

      {success && (
        <div className="mb-6 p-4 rounded-xl fade-in" style={{ background: "rgba(0,184,148,0.1)", border: "1px solid rgba(0,184,148,0.3)" }}>
          <p className="text-green-300 font-medium flex items-center gap-2">
            🎉 Standup submitted! Your team can see your update now.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)" }}>
          <p className="text-red-300 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Member select */}
        <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <label className="block text-sm font-medium mb-3">Who are you?</label>
          {team.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              No team members yet. Ask your admin to add people.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {team.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedMember(member.id)}
                  className={`p-3 rounded-lg text-left transition-all text-sm ${
                    selectedMember === member.id
                      ? "ring-2 ring-[var(--accent)]"
                      : "hover:bg-[var(--bg-hover)]"
                  }`}
                  style={{
                    background: selectedMember === member.id ? "var(--bg-hover)" : "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span className="text-xl block mb-1">{member.avatar}</span>
                  <span className="font-medium">{member.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Yesterday */}
        <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--accent-light)" }}>
            What did you do yesterday? *
          </label>
          <textarea
            value={yesterday}
            onChange={(e) => setYesterday(e.target.value)}
            placeholder="e.g. Finished the login page redesign, reviewed 3 PRs..."
            rows={3}
            className="w-full rounded-lg p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-[var(--accent)]"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          />
        </div>

        {/* Today */}
        <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--success)" }}>
            What are you working on today? *
          </label>
          <textarea
            value={today}
            onChange={(e) => setToday(e.target.value)}
            placeholder="e.g. Starting the dashboard charts, meeting with design team..."
            rows={3}
            className="w-full rounded-lg p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-[var(--accent)]"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          />
        </div>

        {/* Blockers */}
        <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--danger)" }}>
            Any blockers? (optional)
          </label>
          <textarea
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            placeholder="e.g. Waiting on API access from backend team..."
            rows={2}
            className="w-full rounded-lg p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-[var(--accent)]"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !selectedMember || !yesterday.trim() || !today.trim()}
          className="w-full py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "var(--accent)" }}
        >
          {submitting ? "Submitting..." : "Submit Standup ✍️"}
        </button>
      </form>
    </div>
  );
}
