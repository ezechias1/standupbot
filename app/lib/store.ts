import fs from "fs";
import path from "path";
import type { Store, TeamMember, Standup, DailySummary } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

function ensureStore(): Store {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) {
    const empty: Store = { team: [], standups: [], summaries: [] };
    fs.writeFileSync(STORE_PATH, JSON.stringify(empty, null, 2));
    return empty;
  }
  return JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
}

function save(store: Store) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

// --- Team members ---

export function getTeam(): TeamMember[] {
  return ensureStore().team;
}

export function addMember(member: TeamMember) {
  const store = ensureStore();
  store.team.push(member);
  save(store);
}

export function removeMember(id: string) {
  const store = ensureStore();
  store.team = store.team.filter((m) => m.id !== id);
  save(store);
}

// --- Standups ---

export function getStandups(date?: string): Standup[] {
  const store = ensureStore();
  if (date) return store.standups.filter((s) => s.date === date);
  return store.standups;
}

export function getStandupsByMember(memberId: string): Standup[] {
  return ensureStore().standups.filter((s) => s.memberId === memberId);
}

export function getStandupsInRange(startDate: string, endDate: string): Standup[] {
  return ensureStore().standups.filter(
    (s) => s.date >= startDate && s.date <= endDate
  );
}

export function addStandup(standup: Standup) {
  const store = ensureStore();
  // Replace if same member already submitted for this date
  store.standups = store.standups.filter(
    (s) => !(s.memberId === standup.memberId && s.date === standup.date)
  );
  store.standups.push(standup);
  save(store);
}

// --- Summaries ---

export function getSummary(date: string): DailySummary | undefined {
  return ensureStore().summaries.find((s) => s.date === date);
}

export function saveSummary(summary: DailySummary) {
  const store = ensureStore();
  store.summaries = store.summaries.filter((s) => s.date !== summary.date);
  store.summaries.push(summary);
  save(store);
}

// --- Stats ---

export function getMemberStreak(memberId: string): number {
  const standups = getStandupsByMember(memberId);
  if (standups.length === 0) return 0;

  const dates = [...new Set(standups.map((s) => s.date))].sort().reverse();
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    // Skip weekends
    while (expected.getDay() === 0 || expected.getDay() === 6) {
      expected.setDate(expected.getDate() - 1);
    }
    const expectedStr = expected.toISOString().split("T")[0];
    if (dates.includes(expectedStr)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
