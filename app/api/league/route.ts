import { NextResponse } from "next/server";
import { getLeagueSnapshot } from "@/lib/espn";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getLeagueSnapshot();
  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "private, max-age=0, must-revalidate" },
  });
}
