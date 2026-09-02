import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bot, CalendarClock, Newspaper, Sparkles } from "lucide-react";
import { getWeeklyPosts } from "@/lib/db";

export const metadata: Metadata = {
  title: "Weekly Stories",
  description: "The automatically generated weekly Goofy Cup recap archive.",
};

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const posts = await getWeeklyPosts().catch(() => []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="relative overflow-hidden rounded-3xl bg-[#201a38] px-6 py-8 text-white shadow-[0_18px_45px_rgba(32,26,56,0.2)] sm:px-9 sm:py-10">
        <div className="absolute -right-14 -top-20 size-52 rotate-12 border-[34px] border-[#dfff5b]/10" />
        <div className="relative max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-[#dfff5b]">
            <Newspaper className="size-4" aria-hidden="true" />
            The Goofy Gazette
          </div>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
            Every week, properly overanalyzed.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/65">
            Recaps publish automatically after Monday Night Football, with the
            biggest win, toughest loss, and all the standings chaos from ESPN.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1.5">
              <Bot className="mr-1.5 inline size-3" /> GLM-5.3 Flash
            </span>
            <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1.5">
              <CalendarClock className="mr-1.5 inline size-3" /> Tuesdays · 13:00 UTC
            </span>
          </div>
        </div>
      </header>

      {posts.length ? (
        <div className="mt-8 space-y-6">
          {posts.map((post, index) => (
            <article
              key={post.id}
              className="enter-up overflow-hidden rounded-3xl border bg-white shadow-[0_10px_35px_rgba(48,38,83,0.07)]"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="border-b bg-muted/35 px-6 py-4 sm:px-8">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                  {post.season} · Week {post.week}
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                  {post.title}
                </h2>
                <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-muted-foreground">
                  {post.excerpt}
                </p>
              </div>
              <div className="whitespace-pre-wrap px-6 py-6 text-base leading-8 text-[#39324d] sm:px-8 sm:py-8">
                {post.body}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="mt-8 rounded-3xl border border-dashed bg-white/65 px-6 py-14 text-center sm:px-10">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent text-primary">
            <Sparkles className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-2xl font-black tracking-tight">
            The presses start after Week 1
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-base leading-7 text-muted-foreground">
            Once ESPN marks the first week complete, the scheduled job will
            write and publish the recap here automatically.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-2 text-sm font-black text-primary hover:underline"
          >
            Back to the league <ArrowRight className="size-4" />
          </Link>
        </section>
      )}
    </main>
  );
}
