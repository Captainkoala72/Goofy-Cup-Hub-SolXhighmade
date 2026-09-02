import type { Metadata } from "next";
import Link from "next/link";
import { CalendarRange, CheckCircle2, Clock3 } from "lucide-react";
import { getLeagueSnapshot } from "@/lib/espn";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Schedule",
  description: "Weekly Goofy Cup matchups and results from ESPN Fantasy.",
};

export const dynamic = "force-dynamic";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const [league, query] = await Promise.all([getLeagueSnapshot(), searchParams]);
  const weeks = [...new Set(league.matchups.map((matchup) => matchup.week))].sort(
    (a, b) => a - b,
  );
  const requestedWeek = Number(query.week);
  const selectedWeek = weeks.includes(requestedWeek)
    ? requestedWeek
    : weeks.includes(league.currentWeek)
      ? league.currentWeek
      : weeks[0] ?? 1;
  const matchups = league.matchups.filter(
    (matchup) => matchup.week === selectedWeek,
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-primary">
            <CalendarRange className="size-4" /> {league.season} season
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
            Weekly schedule
          </h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Pick a week to see every Goofy Cup matchup and result.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-bold text-muted-foreground">
          <Clock3 className="size-3.5" /> Week {league.currentWeek} is current
        </div>
      </header>

      <nav
        aria-label="Schedule week"
        className="scrollbar-none mt-7 flex gap-2 overflow-x-auto pb-2"
      >
        {weeks.map((week) => (
          <Link
            key={week}
            href={`/schedule?week=${week}`}
            aria-current={week === selectedWeek ? "page" : undefined}
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-xl border text-sm font-black shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              week === selectedWeek
                ? "border-primary bg-primary text-white"
                : "bg-white text-muted-foreground hover:border-primary/35 hover:text-primary",
            )}
          >
            {week}
          </Link>
        ))}
      </nav>

      <section aria-labelledby="week-title" className="mt-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="week-title" className="text-2xl font-black tracking-tight">
            Week {selectedWeek}
          </h2>
          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            {matchups.length} matchups
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {matchups.map((matchup, index) => {
            const highScore = Math.max(matchup.away.score, matchup.home.score);
            return (
              <article
                key={matchup.id}
                className="enter-up overflow-hidden rounded-2xl border bg-white shadow-[0_9px_28px_rgba(48,38,83,0.07)]"
                style={{ animationDelay: `${index * 55}ms` }}
              >
                <div className="flex items-center justify-between border-b bg-muted/35 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-muted-foreground">
                  <span>Matchup {index + 1}</span>
                  <span className="flex items-center gap-1.5">
                    {matchup.complete && <CheckCircle2 className="size-3.5 text-[#709600]" />}
                    {matchup.complete ? "Final" : "Scheduled"}
                  </span>
                </div>
                <div className="divide-y">
                  {[matchup.away, matchup.home].map((side, sideIndex) => {
                    const winner =
                      matchup.complete && side.score > 0 && side.score === highScore;
                    return (
                      <div
                        key={`${matchup.id}-${side.teamId}-${sideIndex}`}
                        className={cn(
                          "flex items-center gap-3 px-4 py-4",
                          winner && "bg-[#f8ffd9]",
                        )}
                      >
                        <span className="grid size-9 place-items-center rounded-xl bg-accent text-xs font-black text-primary">
                          {side.teamName.slice(0, 2).toUpperCase()}
                        </span>
                        <Link
                          href={`/teams/${side.teamId}`}
                          className="min-w-0 flex-1 truncate font-extrabold hover:text-primary hover:underline"
                        >
                          {side.teamName}
                        </Link>
                        <span className="text-xl font-black tabular-nums">
                          {side.score ? side.score.toFixed(1) : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
