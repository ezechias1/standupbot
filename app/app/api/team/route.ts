import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getTeam, addMember, removeMember } from "@/lib/store";
import type { TeamMember } from "@/lib/types";

const AVATARS = ["🧑‍💻", "👩‍💼", "👨‍🔧", "👩‍🎨", "🧑‍🔬", "👨‍💼", "👩‍🚀", "🧑‍🏫", "👨‍🍳", "👩‍⚕️"];

// GET /api/team
export async function GET() {
  const team = getTeam();
  return NextResponse.json(team);
}

// POST /api/team — add a team member
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, role } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const team = getTeam();
    const member: TeamMember = {
      id: uuid(),
      name,
      role: role || "Team Member",
      avatar: AVATARS[team.length % AVATARS.length],
      joinedAt: new Date().toISOString(),
    };

    addMember(member);
    return NextResponse.json(member, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// DELETE /api/team?id=xxx
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  removeMember(id);
  return NextResponse.json({ success: true });
}
