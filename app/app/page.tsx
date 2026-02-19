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
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="skeleton h-8 w-48 mb-2" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 fade-up">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Team Size" value={team.length.toString()} icon="👥" delay={0} />
        <StatCard label="Submitted Today" value={`${submitted.size}/${team.length}`} icon="✅" delay={1} />
        <StatCard
          label="Submission Rate"
          value={`${submissionRate}%`}
          icon="📈"
          delay={2}
          highlight={submissionRate === 100}
        />
        <StatCard
          label="Active Blockers"
          value={blockers.length.toString()}
          icon="🚧"
          delay={3}
          highlight={blockers.length > 0}
        />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team status */}
        <div className="glass p-6 fade-up" style={{ animationDelay: "0.15s" }}>
          <h2 className="text-base font-semibold mb-5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            Team Status
          </h2>
          <div className="space-y-2.5">
            {team.map((member, i) => {
              const done = submitted.has(member.id);
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-xl transition-all hover:bg-white/[0.03] fade-up"
                  style={{ animationDelay: `${0.2 + i * 0.05}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: "rgba(255,255,255,0.04)" }}>
                      {member.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{member.role}</p>
                    </div>
                  </div>
                  <span className={`badge ${done ? "badge-success" : "badge-warning"}`}>
                    {done ? "Submitted" : "Pending"}
                  </span>
                </div>
              );
            })}
            {team.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: "var(--text-secondary)" }}>
                No team members yet. Go to Admin to add people.
              </p>
            )}
          </div>
        </div>

        {/* Blockers */}
        <div className="glass p-6 fade-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-base font-semibold mb-5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: blockers.length > 0 ? "#888" : "#555" }} />
            Blockers
            {blockers.length > 0 && (
              <span className="badge badge-danger blocker-pulse ml-1">{blockers.length} active</span>
            )}
          </h2>
          <div className="space-y-3">
            {blockers.map((s, i) => (
              <div
                key={s.id}
                className="p-4 rounded-xl fade-up"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  animationDelay: `${0.25 + i * 0.05}s`,
                }}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-lg">{s.memberAvatar}</span>
                  <span className="font-semibold text-sm">{s.memberName}</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{s.blockers}</p>
              </div>
            ))}
            {blockers.length === 0 && (
              <div className="text-center py-8 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                <p className="text-4xl mb-3">🎉</p>
                <p className="font-medium text-sm">No blockers today!</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>The team is unblocked and rolling</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's updates */}
      {standups.length > 0 && (
        <div className="glass p-6 mt-6 fade-up" style={{ animationDelay: "0.25s" }}>
          <h2 className="text-base font-semibold mb-5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            Today&apos;s Updates
          </h2>
          <div className="space-y-3">
            {standups.map((s, i) => (
              <div
                key={s.id}
                className="p-5 rounded-xl transition-all hover:bg-white/[0.02] fade-up"
                style={{ background: "rgba(255,255,255,0.02)", animationDelay: `${0.3 + i * 0.05}s` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                    style={{ background: "rgba(255,255,255,0.04)" }}>
                    {s.memberAvatar}
                  </div>
                  <div>
                    <span className="font-semibold text-sm">{s.memberName}</span>
                    <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                      {new Date(s.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {s.blockers?.trim() && (
                    <span className="badge badge-danger blocker-pulse ml-auto">Blocked</span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <UpdateCell label="Yesterday" text={s.yesterday} />
                  <UpdateCell label="Today" text={s.today} />
                  <UpdateCell label="Blockers" text={s.blockers || "None"} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UpdateCell({ label, text }: { label: string; text: string }) {
  return (
    <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>{label}</p>
      <p className="text-sm leading-relaxed" style={{ color: "#ccc" }}>{text}</p>
    </div>
  );
}

function StatCard({ label, value, icon, delay, highlight }: {
  label: string; value: string; icon: string; delay: number; highlight?: boolean;
}) {
  return (
    <div
      className="glass p-5 fade-up"
      style={{
        animationDelay: `${delay * 0.05 + 0.05}s`,
        borderColor: highlight ? "rgba(255,255,255,0.12)" : undefined,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: "rgba(255,255,255,0.04)" }}>
          {icon}
        </div>
        {highlight && <span className="w-2 h-2 rounded-full bg-white/40" />}
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs mt-1 font-medium" style={{ color: "var(--text-secondary)" }}>{label}</p>
    </div>
  );
}
