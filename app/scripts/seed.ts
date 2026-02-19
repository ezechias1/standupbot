import { Redis } from "@upstash/redis";
import { v4 as uuid } from "uuid";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

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

async function seed() {
  await redis.set("team", team);
  await redis.set("standups", standups);
  await redis.set("summaries", []);

  console.log("✅ Seeded to Upstash Redis!");
  console.log(`   ${team.length} team members`);
  console.log(`   ${standups.length} standups (${standups.filter(s => s.date === yesterday).length} yesterday, ${standups.filter(s => s.date === today).length} today)`);
  console.log(`   Marcus (Designer) and James (DevOps) haven't submitted today`);
}

seed().catch(console.error);
