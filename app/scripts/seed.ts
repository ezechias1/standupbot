import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import type { Store } from "../lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

const today = new Date().toISOString().split("T")[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

const team = [
  { id: uuid(), name: "Alex Chen", role: "Frontend Developer", avatar: "🧑‍💻", joinedAt: new Date().toISOString() },
  { id: uuid(), name: "Sarah Kim", role: "Backend Developer", avatar: "👩‍💼", joinedAt: new Date().toISOString() },
  { id: uuid(), name: "Marcus Johnson", role: "Designer", avatar: "👨‍🎨", joinedAt: new Date().toISOString() },
  { id: uuid(), name: "Priya Patel", role: "Product Manager", avatar: "👩‍🚀", joinedAt: new Date().toISOString() },
  { id: uuid(), name: "James Wilson", role: "DevOps Engineer", avatar: "🧑‍🔬", joinedAt: new Date().toISOString() },
];

const standups = [
  // Yesterday's standups
  {
    id: uuid(), memberId: team[0].id, memberName: team[0].name, memberAvatar: team[0].avatar,
    yesterday: "Set up the project repo and configured CI/CD pipeline",
    today: "Working on the landing page hero section and responsive nav",
    blockers: "",
    date: yesterday, submittedAt: new Date(yesterday + "T09:15:00").toISOString(),
  },
  {
    id: uuid(), memberId: team[1].id, memberName: team[1].name, memberAvatar: team[1].avatar,
    yesterday: "Designed the database schema for user management",
    today: "Building the authentication API endpoints",
    blockers: "Waiting on AWS credentials from IT",
    date: yesterday, submittedAt: new Date(yesterday + "T09:30:00").toISOString(),
  },
  {
    id: uuid(), memberId: team[2].id, memberName: team[2].name, memberAvatar: team[2].avatar,
    yesterday: "Completed wireframes for dashboard and settings pages",
    today: "Starting high-fidelity mockups in Figma",
    blockers: "",
    date: yesterday, submittedAt: new Date(yesterday + "T10:00:00").toISOString(),
  },
  {
    id: uuid(), memberId: team[3].id, memberName: team[3].name, memberAvatar: team[3].avatar,
    yesterday: "Met with stakeholders to finalize Q1 roadmap",
    today: "Writing user stories for the notification feature",
    blockers: "Need design review before sprint planning",
    date: yesterday, submittedAt: new Date(yesterday + "T09:05:00").toISOString(),
  },

  // Today's standups
  {
    id: uuid(), memberId: team[0].id, memberName: team[0].name, memberAvatar: team[0].avatar,
    yesterday: "Finished the landing page hero section and responsive nav",
    today: "Integrating the auth flow with the frontend forms",
    blockers: "",
    date: today, submittedAt: new Date(today + "T09:10:00").toISOString(),
  },
  {
    id: uuid(), memberId: team[1].id, memberName: team[1].name, memberAvatar: team[1].avatar,
    yesterday: "Built authentication API endpoints (login, register, reset)",
    today: "Adding rate limiting and input validation to auth endpoints",
    blockers: "Still waiting on AWS credentials — 2nd day blocked",
    date: today, submittedAt: new Date(today + "T09:25:00").toISOString(),
  },
  {
    id: uuid(), memberId: team[3].id, memberName: team[3].name, memberAvatar: team[3].avatar,
    yesterday: "Wrote user stories for notification feature",
    today: "Sprint planning meeting at 2pm, preparing backlog",
    blockers: "",
    date: today, submittedAt: new Date(today + "T08:55:00").toISOString(),
  },
];

const store: Store = { team, standups, summaries: [] };

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));

console.log("✅ Seeded successfully!");
console.log(`   ${team.length} team members`);
console.log(`   ${standups.length} standups (${standups.filter(s => s.date === yesterday).length} yesterday, ${standups.filter(s => s.date === today).length} today)`);
console.log(`   Note: Marcus (Designer) and James (DevOps) haven't submitted today — dashboard will show them as pending`);
