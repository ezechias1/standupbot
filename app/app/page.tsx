"use client";

import { useEffect, useState } from "react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

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

export default function Dashboard() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [standups, setStandups] = useState<Standup[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    Promise.all([
      fetch("/api/team").then((r) => r.json()),
      fetch(`/api/standups?date=${today}`).then((r) => r.json()),
    ]).then(([t, s]) => {
      setTeam(t);
      setStandups(s);
      setLoading(false);
    });
  }, [today]);

  const submitted = new Set(standups.map((s) => s.memberId));
  const blockers = standups.filter((s) => s.blockers && s.blockers.trim() !== "");
  const submissionRate = team.length > 0 ? Math.round((submitted.size / team.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg" style={{ color: "var(--text-secondary)" }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p style={{ color: "var(--text-secondary)" }} className="mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Team Size" value={team.length.toString()} icon="👥" />
        <StatCard label="Submitted Today" value={`${submitted.size}/${team.length}`} icon="✅" />
        <StatCard
          label="Submission Rate"
          value={`${submissionRate}%`}
          icon="📈"
          accent={submissionRate === 100}
        />
        <StatCard
          label="Active Blockers"
          value={blockers.length.toString()}
          icon="🚧"
          danger={blockers.length > 0}
        />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Who submitted */}
        <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-lg font-semibold mb-4">Team Status</h2>
          <div className="space-y-3">
            {team.map((member) => {
              const done = submitted.has(member.id);
              return (
                <div key={member.id} className="flex items-center justify-between fade-in">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{member.avatar}</span>
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{member.role}</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      done ? "text-green-300" : "text-yellow-300"
                    }`}
                    style={{ background: done ? "rgba(0,184,148,0.15)" : "rgba(253,203,110,0.15)" }}
                  >
                    {done ? "Submitted" : "Pending"}
                  </span>
                </div>
              );
            })}
            {team.length === 0 && (
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                No team members yet. Go to Admin to add people.
              </p>
            )}
          </div>
        </div>

        {/* Blockers */}
        <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            Blockers
            {blockers.length > 0 && (
              <span className="blocker-pulse text-xs font-medium px-2 py-0.5 rounded-full text-red-300"
                style={{ background: "rgba(231,76,60,0.15)" }}>
                {blockers.length} active
              </span>
            )}
          </h2>
          <div className="space-y-3">
            {blockers.map((s) => (
              <div key={s.id} className="p-3 rounded-lg fade-in" style={{ background: "rgba(231,76,60,0.08)", border: "1px solid rgba(231,76,60,0.2)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span>{s.memberAvatar}</span>
                  <span className="font-medium text-sm">{s.memberName}</span>
                </div>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{s.blockers}</p>
              </div>
            ))}
            {blockers.length === 0 && (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">🎉</p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No blockers today!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's updates preview */}
      {standups.length > 0 && (
        <div className="mt-6 rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-lg font-semibold mb-4">Today&apos;s Updates</h2>
          <div className="space-y-4">
            {standups.map((s) => (
              <div key={s.id} className="p-4 rounded-lg fade-in" style={{ background: "var(--bg-secondary)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{s.memberAvatar}</span>
                  <span className="font-semibold text-sm">{s.memberName}</span>
                  <span className="text-xs ml-auto" style={{ color: "var(--text-secondary)" }}>
                    {new Date(s.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: "var(--accent-light)" }}>Yesterday</p>
                    <p style={{ color: "var(--text-secondary)" }}>{s.yesterday}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: "var(--success)" }}>Today</p>
                    <p style={{ color: "var(--text-secondary)" }}>{s.today}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: s.blockers ? "var(--danger)" : "var(--text-secondary)" }}>
                      Blockers
                    </p>
                    <p style={{ color: "var(--text-secondary)" }}>{s.blockers || "None"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, accent, danger }: {
  label: string; value: string; icon: string; accent?: boolean; danger?: boolean;
}) {
  return (
    <div className="rounded-xl p-4" style={{
      background: "var(--bg-card)",
      border: `1px solid ${danger ? "rgba(231,76,60,0.3)" : accent ? "rgba(108,92,231,0.3)" : "var(--border)"}`,
    }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {danger && <span className="blocker-pulse w-2 h-2 rounded-full bg-red-400" />}
        {accent && <span className="w-2 h-2 rounded-full bg-green-400" />}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{label}</p>
    </div>
  );
}
