import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarRange, Shield, UserRound } from "lucide-react";
import { getLeagueSnapshot } from "@/lib/espn";

export const dynamic = "force-dynamic";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const [{ teamId }, league] = await Promise.all([params, getLeagueSnapshot()]);
  const team = league.teams.find((candidate) => candidate.id === Number(teamId));
  if (!team) notFound();

  const starters = team.roster.filter(
    (player) => player.lineupSlot !== "Bench" && player.lineupSlot !== "IR",
  );
  const bench = team.roster.filter(
    (player) => player.lineupSlot === "Bench" || player.lineupSlot === "IR",
  );
  const matchups = league.matchups.filter(
    (matchup) =>
      matchup.home.teamId === team.id || matchup.away.teamId === team.id,
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-black text-primary hover:underline"
      >
        <ArrowLeft className="size-4" /> Back to standings
      </Link>

      <header className="mt-5 overflow-hidden rounded-3xl bg-[#201a38] p-6 text-white shadow-[0_18px_45px_rgba(32,26,56,0.18)] sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="grid size-20 shrink-0 place-items-center rounded-3xl bg-[#dfff5b] text-2xl font-black text-[#17122b] shadow-[5px_5px_0_#6541d8]">
            {team.abbreviation.slice(0, 3)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#dfff5b]">
              Goofy Cup team
            </p>
            <h1 className="mt-1 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              {team.name}
            </h1>
            <p className="mt-2 flex items-center gap-2 text-white/60">
              <UserRound className="size-4" /> {team.manager}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:text-right">
            <div className="rounded-2xl border border-white/12 bg-white/7 px-4 py-3">
              <p className="text-2xl font-black text-[#dfff5b]">
                {team.wins}-{team.losses}
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-white/45">
                Record
              </p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/7 px-4 py-3">
              <p className="text-2xl font-black text-[#dfff5b]">
                {team.pointsFor.toFixed(1)}
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-white/45">
                Points
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <section className="overflow-hidden rounded-2xl border bg-white shadow-[0_8px_26px_rgba(48,38,83,0.06)]">
          <div className="flex items-center gap-3 border-b px-5 py-4">
            <Shield className="size-5 text-primary" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                Week {league.currentWeek}
              </p>
              <h2 className="text-xl font-black">Roster</h2>
            </div>
          </div>
          {team.roster.length ? (
            <div>
              {[{ label: "Starters", players: starters }, { label: "Bench", players: bench }].map(
                (group) => (
                  <div key={group.label}>
                    <h3 className="border-y bg-muted/35 px-5 py-2 text-xs font-black uppercase tracking-wider text-muted-foreground first:border-t-0">
                      {group.label}
                    </h3>
                    <div className="divide-y">
                      {group.players.map((player) => (
                        <div key={player.id} className="grid grid-cols-[3.25rem_1fr_auto] items-center gap-3 px-5 py-3">
                          <span className="rounded-lg bg-accent px-2 py-1 text-center text-xs font-black text-primary">
                            {player.lineupSlot}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-extrabold">{player.name}</p>
                            <p className="text-xs font-semibold text-muted-foreground">
                              {player.position} · {player.proTeam}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-black tabular-nums">
                              {player.actualPoints?.toFixed(1) ?? "—"}
                            </p>
                            <p className="text-[0.7rem] font-semibold text-muted-foreground">
                              {player.projectedPoints?.toFixed(1) ?? "—"} proj.
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              Rosters will appear when the private ESPN connection is active.
            </p>
          )}
        </section>

        <aside className="overflow-hidden rounded-2xl border bg-white shadow-[0_8px_26px_rgba(48,38,83,0.06)]">
          <div className="flex items-center gap-3 border-b px-5 py-4">
            <CalendarRange className="size-5 text-primary" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                Season slate
              </p>
              <h2 className="text-xl font-black">Schedule</h2>
            </div>
          </div>
          <div className="divide-y">
            {matchups.map((matchup) => {
              const isHome = matchup.home.teamId === team.id;
              const teamSide = isHome ? matchup.home : matchup.away;
              const opponent = isHome ? matchup.away : matchup.home;
              return (
                <Link
                  key={matchup.id}
                  href={`/schedule?week=${matchup.week}`}
                  className="flex items-center gap-3 px-5 py-3 transition hover:bg-accent/40"
                >
                  <span className="grid size-9 place-items-center rounded-xl bg-muted text-xs font-black">
                    W{matchup.week}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold">
                      {isHome ? "vs" : "@"} {opponent.teamName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {matchup.complete ? "Final" : "Scheduled"}
                    </p>
                  </div>
                  <span className="text-sm font-black tabular-nums">
                    {matchup.complete
                      ? `${teamSide.score.toFixed(1)}–${opponent.score.toFixed(1)}`
                      : "—"}
                  </span>
                </Link>
              );
            })}
          </div>
        </aside>
      </div>
    </main>
  );
}
