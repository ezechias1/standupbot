import Groq from "groq-sdk";
import type { Standup } from "./types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generateDailySummary(
  standups: Standup[],
  date: string
): Promise<string> {
  if (standups.length === 0) return "No standups submitted for this date.";

  const standupText = standups
    .map(
      (s) =>
        `**${s.memberName}**:\n- Yesterday: ${s.yesterday}\n- Today: ${s.today}\n- Blockers: ${s.blockers || "None"}`
    )
    .join("\n\n");

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are a helpful team lead assistant. Analyze daily standup updates and provide a concise, actionable summary. Use markdown formatting. Structure your response as:

## Team Summary for ${date}
A 2-3 sentence overview of what the team is working on.

## Key Highlights
- Bullet points of notable progress

## Blockers & Risks
- Any blockers mentioned (highlight urgency)
- Patterns you notice (e.g. someone blocked multiple days)

## Suggested Actions
- Actionable recommendations for the team lead

Keep it concise and useful. If there are no blockers, say so positively.`,
      },
      {
        role: "user",
        content: `Here are today's standup updates:\n\n${standupText}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 1000,
  });

  return response.choices[0]?.message?.content || "Failed to generate summary.";
}

export async function generateWeeklySummary(
  standups: Standup[],
  startDate: string,
  endDate: string
): Promise<string> {
  if (standups.length === 0) return "No standups submitted this week.";

  // Group by date
  const byDate: Record<string, Standup[]> = {};
  for (const s of standups) {
    if (!byDate[s.date]) byDate[s.date] = [];
    byDate[s.date].push(s);
  }

  const standupText = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([date, entries]) =>
        `### ${date}\n${entries.map((s) => `- **${s.memberName}**: Did: ${s.yesterday} | Doing: ${s.today} | Blockers: ${s.blockers || "None"}`).join("\n")}`
    )
    .join("\n\n");

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are a helpful team lead assistant. Analyze a week of standup updates and provide a comprehensive weekly digest. Use markdown formatting. Structure your response as:

## Weekly Digest (${startDate} to ${endDate})
A 3-4 sentence overview of the team's week.

## Accomplishments
- Key things completed this week

## Ongoing Work
- What's still in progress

## Blockers This Week
- Recurring or unresolved blockers

## Team Patterns
- Observations about productivity, recurring themes, etc.

## Recommendations for Next Week
- Actionable suggestions

Keep it insightful and concise.`,
      },
      {
        role: "user",
        content: `Here are this week's standup updates:\n\n${standupText}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 1500,
  });

  return response.choices[0]?.message?.content || "Failed to generate weekly summary.";
}
