export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string; // emoji
  joinedAt: string;
}

export interface Standup {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  yesterday: string;
  today: string;
  blockers: string;
  date: string; // YYYY-MM-DD
  submittedAt: string; // ISO timestamp
}

export interface DailySummary {
  date: string;
  summary: string;
  generatedAt: string;
}

export interface Store {
  team: TeamMember[];
  standups: Standup[];
  summaries: DailySummary[];
}
