import { NextResponse } from "next/server";
import { getWeeklyPosts } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const posts = await getWeeklyPosts();
    return NextResponse.json({ posts });
  } catch {
    return NextResponse.json(
      { posts: [], error: "The weekly archive is temporarily unavailable." },
      { status: 503 },
    );
  }
}
