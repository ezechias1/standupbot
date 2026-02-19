import { Redis } from "@upstash/redis";
import type { TeamMember, Standup, DailySummary } from "./types";

// Lazy initialization — avoids build-time errors when env vars aren't available
let redis: Redis | null = null;
function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

// --- Team members ---

export async function getTeam(): Promise<TeamMember[]> {
  const data = await getRedis().get<TeamMember[]>("team");
  return data || [];
}

export async function addMember(member: TeamMember) {
  const team = await getTeam();
  team.push(member);
  await getRedis().set("team", team);
}

export async function removeMember(id: string) {
  const team = await getTeam();
  await getRedis().set("team", team.filter((m) => m.id !== id));
}

// --- Standups ---

export async function getStandups(date?: string): Promise<Standup[]> {
  const data = await getRedis().get<Standup[]>("standups");
  const all = data || [];
  if (date) return all.filter((s) => s.date === date);
  return all;
}

export async function getStandupsByMember(memberId: string): Promise<Standup[]> {
  const all = await getStandups();
  return all.filter((s) => s.memberId === memberId);
}

export async function getStandupsInRange(startDate: string, endDate: string): Promise<Standup[]> {
  const all = await getStandups();
  return all.filter((s) => s.date >= startDate && s.date <= endDate);
}

export async function addStandup(standup: Standup) {
  const all = await getStandups();
  // Replace if same member already submitted for this date
  const filtered = all.filter(
    (s) => !(s.memberId === standup.memberId && s.date === standup.date)
  );
  filtered.push(standup);
  await getRedis().set("standups", filtered);
}

// --- Summaries ---

export async function getSummary(date: string): Promise<DailySummary | undefined> {
  const data = await getRedis().get<DailySummary[]>("summaries");
  return (data || []).find((s) => s.date === date);
}

export async function saveSummary(summary: DailySummary) {
  const data = await getRedis().get<DailySummary[]>("summaries");
  const all = (data || []).filter((s) => s.date !== summary.date);
  all.push(summary);
  await getRedis().set("summaries", all);
}
