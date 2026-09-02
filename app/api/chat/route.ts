import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { streamLeagueAssistant } from "@/lib/glm";
import { getLeagueSnapshot } from "@/lib/espn";

export const runtime = "nodejs";
export const maxDuration = 120;

const encoder = new TextEncoder();

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(12_000),
      }),
    )
    .min(1)
    .max(48),
});

const requestBuckets = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  const now = Date.now();
  const bucket = requestBuckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    requestBuckets.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > 8;
}

export async function POST(request: NextRequest) {
  if (isRateLimited(request)) {
    return NextResponse.json(
      { error: "Too many questions at once. Try again in a minute." },
      { status: 429 },
    );
  }

  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "That message could not be read." },
        { status: 400 },
      );
    }

    if (!process.env.ZAI_API_KEY) {
      return NextResponse.json(
        { error: "The assistant is waiting for its Z.ai API key." },
        { status: 503 },
      );
    }

    const snapshot = await getLeagueSnapshot();
    const body = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of streamLeagueAssistant(
            parsed.data.messages,
            snapshot,
          )) {
            controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
          }
          controller.enqueue(encoder.encode('{"type":"done"}\n'));
        } catch {
          controller.enqueue(
            encoder.encode(
              `${JSON.stringify({
                type: "error",
                error:
                  "The assistant hit a timeout or upstream error. Try once more.",
              })}\n`,
            ),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(body, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "The assistant hit a timeout or upstream error. Try once more." },
      { status: 502 },
    );
  }
}
