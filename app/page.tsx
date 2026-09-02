import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Crown,
  Sparkles,
  Trophy,
} from "lucide-react";
import { getLeagueSnapshot } from "@/lib/espn";
import { getWeeklyPosts } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatScore(score: number) {
  return score ? score.toFixed(1) : "—";
}

export default async function Home() {
  const [league, posts] = await Promise.all([
    getLeagueSnapshot(),
    getWeeklyPosts(1).catch(() => []),
  ]);
  const standings = [...league.teams].sort(
    (a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor,
  );
  const currentMatchups = league.matchups.filter(
    (matchup) => matchup.week === league.currentWeek,
  );
  const latestPost = posts[0];
  const synced = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(league.syncedAt));

  return (
    <main>
      <section className="border-b border-[#302653] bg-[#201a38] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end lg:py-10">
          <div className="enter-up">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-bold text-white/65">
              <span className="rounded-full border border-white/15 bg-white/8 px-3 py-1">
                {league.season} season
              </span>
              <span className="rounded-full border border-[#dfff5b]/25 bg-[#dfff5b]/10 px-3 py-1 text-[#dfff5b]">
                Week {league.currentWeek}
              </span>
            </div>
            <h1 className="max-w-3xl text-4xl font-black tracking-[-0.045em] sm:text-5xl lg:text-6xl">
              The league table, with a little less dignity.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/66 sm:text-lg">
              Eight teams. One trophy. Every matchup, roster, and weekly story
              in one place.
            </p>
          </div>

          <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-white/12 bg-white/7 shadow-2xl shadow-black/15">
            {[
              ["$35", "Buy-in"],
              ["$200", "Champion"],
              ["$80", "Runner-up"],
            ].map(([value, label], index) => (
              <div
                key={label}
                className={`min-w-24 px-4 py-4 text-center ${index ? "border-l border-white/12" : ""}`}
              >
                <div className="text-xl font-black text-[#dfff5b]">{value}</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-wider text-white/50">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {league.warning && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#e6b727]/35 bg-[#fff8d7] px-4 py-3 text-sm leading-6 text-[#59460e]">
            <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>
              <strong>Setup preview:</strong> {league.warning}
            </p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(20rem,0.9fr)]">
          <div className="space-y-6">
            <section aria-labelledby="matchups-heading">
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                    On the board
                  </p>
                  <h2
                    id="matchups-heading"
                    className="mt-1 text-2xl font-black tracking-tight"
                  >
                    Week {league.currentWeek} matchups
                  </h2>
                </div>
                <div className="hidden items-center gap-1.5 text-xs font-semibold text-muted-foreground sm:flex">
                  <Clock3 className="size-3.5" aria-hidden="true" />
                  Synced {synced}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {currentMatchups.map((matchup, index) => (
                  <article
                    key={matchup.id}
                    className="enter-up overflow-hidden rounded-2xl border bg-card shadow-[0_8px_26px_rgba(48,38,83,0.06)]"
                    style={{ animationDelay: `${index * 55}ms` }}
                  >
                    <div className="flex items-center justify-between border-b bg-muted/55 px-4 py-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
                      <span>Matchup {index + 1}</span>
                      <span>{matchup.complete ? "Final" : "Live / upcoming"}</span>
                    </div>
                    <div className="divide-y">
                      {[matchup.away, matchup.home].map((side, sideIndex) => (
                        <div
                          key={`${matchup.id}-${side.teamId}-${sideIndex}`}
                          className="flex items-center gap-3 px-4 py-3.5"
                        >
                          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#eee8ff] text-xs font-black text-primary">
                            {side.teamName.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="min-w-0 flex-1 truncate font-bold">
                            {side.teamName}
                          </span>
                          <span className="text-lg font-black tabular-nums">
                            {formatScore(side.score)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section
              aria-labelledby="standings-heading"
              className="overflow-hidden rounded-2xl border bg-card shadow-[0_8px_26px_rgba(48,38,83,0.06)]"
            >
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                    The pecking order
                  </p>
                  <h2
                    id="standings-heading"
                    className="mt-1 text-2xl font-black tracking-tight"
                  >
                    Standings
                  </h2>
                </div>
                <Trophy className="size-6 text-[#b38b00]" aria-hidden="true" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[38rem] border-collapse text-left">
                  <thead>
                    <tr className="border-b bg-muted/35 text-xs font-black uppercase tracking-wider text-muted-foreground">
                      <th className="w-14 px-5 py-3">Rank</th>
                      <th className="px-3 py-3">Team</th>
                      <th className="px-3 py-3 text-center">Record</th>
                      <th className="px-3 py-3 text-right">PF</th>
                      <th className="px-3 py-3 text-right">PA</th>
                      <th className="px-5 py-3 text-right">Streak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {standings.map((team, index) => (
                      <tr key={team.id} className="transition-colors hover:bg-accent/40">
                        <td className="px-5 py-3.5">
                          <span
                            className={`grid size-7 place-items-center rounded-lg text-sm font-black ${
                              index === 0
                                ? "bg-[#dfff5b] text-[#17122b]"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-3 py-3.5">
                          <Link
                            href={`/teams/${team.id}`}
                            className="font-extrabold hover:text-primary hover:underline"
                          >
                            {team.name}
                          </Link>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {team.manager}
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-center font-bold tabular-nums">
                          {team.wins}-{team.losses}
                          {team.ties ? `-${team.ties}` : ""}
                        </td>
                        <td className="px-3 py-3.5 text-right font-semibold tabular-nums">
                          {team.pointsFor.toFixed(1)}
                        </td>
                        <td className="px-3 py-3.5 text-right text-muted-foreground tabular-nums">
                          {team.pointsAgainst.toFixed(1)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="rounded-lg bg-muted px-2 py-1 text-xs font-black">
                            {team.streak}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="relative overflow-hidden rounded-2xl bg-primary p-5 text-white shadow-[0_14px_35px_rgba(101,65,216,0.25)]">
              <div className="absolute -right-12 -top-12 size-36 rounded-full border-[24px] border-white/8" />
              <div className="relative">
                <span className="grid size-10 place-items-center rounded-xl bg-[#dfff5b] text-[#17122b]">
                  <Bot className="size-5" aria-hidden="true" />
                </span>
                <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-white/60">
                  GLM-5.3 Flash · Max reasoning
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">
                  Ask the league assistant
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/72">
                  Compare rosters, prep a trade, check the latest NFL news, or
                  settle a lineup argument.
                </p>
                <Link
                  href="/assistant"
                  className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-primary transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dfff5b]"
                >
                  Open assistant <ArrowRight className="size-4" />
                </Link>
              </div>
            </section>

            <section className="rounded-2xl border bg-card p-5 shadow-[0_8px_26px_rgba(48,38,83,0.06)]">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-[#fff5cc] text-[#8a6800]">
                  <Crown className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                    Weekly story
                  </p>
                  <h2 className="font-black">The Goofy Gazette</h2>
                </div>
              </div>
              {latestPost ? (
                <>
                  <h3 className="mt-4 text-lg font-black leading-snug">
                    {latestPost.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {latestPost.excerpt}
                  </p>
                </>
              ) : (
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  The first AI recap will publish automatically on Tuesday after
                  Week 1 wraps.
                </p>
              )}
              <Link
                href="/news"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-black text-primary hover:underline"
              >
                Read weekly stories <ArrowRight className="size-3.5" />
              </Link>
            </section>

            <section className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border bg-card p-4">
                <CircleDollarSign className="size-5 text-primary" aria-hidden="true" />
                <p className="mt-3 text-2xl font-black">$280</p>
                <p className="text-xs font-bold text-muted-foreground">Total purse</p>
              </div>
              <div className="rounded-2xl border bg-card p-4">
                <CalendarDays className="size-5 text-primary" aria-hidden="true" />
                <p className="mt-3 text-2xl font-black">8</p>
                <p className="text-xs font-bold text-muted-foreground">League teams</p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
