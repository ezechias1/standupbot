import { NextRequest, NextResponse } from "next/server";
import { getStandups, getStandupsInRange, getSummary, saveSummary } from "@/lib/store";
import { generateDailySummary, generateWeeklySummary } from "@/lib/ai";

// GET /api/summary?date=YYYY-MM-DD or ?week=YYYY-MM-DD (Monday of the week)
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const week = req.nextUrl.searchParams.get("week");

  if (week) {
    // Weekly summary
    const start = new Date(week);
    const end = new Date(start);
    end.setDate(end.getDate() + 4); // Monday to Friday
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    const standups = getStandupsInRange(startStr, endStr);
    const summary = await generateWeeklySummary(standups, startStr, endStr);
    return NextResponse.json({ type: "weekly", startDate: startStr, endDate: endStr, summary });
  }

  // Daily summary
  const targetDate = date || new Date().toISOString().split("T")[0];

  // Check cache
  const cached = getSummary(targetDate);
  if (cached) {
    return NextResponse.json({ type: "daily", date: targetDate, summary: cached.summary, cached: true });
  }

  const standups = getStandups(targetDate);
  if (standups.length === 0) {
    return NextResponse.json({ type: "daily", date: targetDate, summary: "No standups submitted for this date.", cached: false });
  }

  const summary = await generateDailySummary(standups, targetDate);

  // Cache it
  saveSummary({ date: targetDate, summary, generatedAt: new Date().toISOString() });

  return NextResponse.json({ type: "daily", date: targetDate, summary, cached: false });
}
