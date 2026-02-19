import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getStandups, addStandup, getTeam } from "@/lib/store";
import type { Standup } from "@/lib/types";

// GET /api/standups?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") || undefined;
  const standups = await getStandups(date);
  return NextResponse.json(standups);
}

// POST /api/standups — submit a standup
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { memberId, yesterday, today, blockers } = body;

    if (!memberId || !yesterday || !today) {
      return NextResponse.json(
        { error: "memberId, yesterday, and today are required" },
        { status: 400 }
      );
    }

    const team = await getTeam();
    const member = team.find((m) => m.id === memberId);
    if (!member) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    const now = new Date();
    const standup: Standup = {
      id: uuid(),
      memberId,
      memberName: member.name,
      memberAvatar: member.avatar,
      yesterday,
      today,
      blockers: blockers || "",
      date: now.toISOString().split("T")[0],
      submittedAt: now.toISOString(),
    };

    await addStandup(standup);
    return NextResponse.json(standup, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
