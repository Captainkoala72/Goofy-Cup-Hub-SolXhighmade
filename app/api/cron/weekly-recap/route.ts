import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyRecap } from "@/lib/glm";
import { getLeagueSnapshot } from "@/lib/espn";
import { getWeeklyPost, saveWeeklyPost } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 180;

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshot = await getLeagueSnapshot();
    if (snapshot.isDemo) {
      return NextResponse.json(
        { error: "Private ESPN credentials are not connected." },
        { status: 503 },
      );
    }

    const week = snapshot.latestCompletedWeek;
    if (week < 1) {
      return NextResponse.json({ status: "skipped", reason: "No completed week" });
    }

    const existing = await getWeeklyPost(snapshot.season, week);
    if (existing) {
      return NextResponse.json({ status: "skipped", post: existing });
    }

    const recap = await generateWeeklyRecap(snapshot, week);
    const post = await saveWeeklyPost({
      season: snapshot.season,
      week,
      ...recap,
    });
    return NextResponse.json({ status: "published", post });
  } catch {
    return NextResponse.json(
      { error: "The weekly recap could not be generated." },
      { status: 500 },
    );
  }
}
