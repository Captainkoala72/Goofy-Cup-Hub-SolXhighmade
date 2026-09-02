import { getDemoSnapshot } from "@/lib/demo";
import type {
  LeagueMatchup,
  LeagueSnapshot,
  LeagueTeam,
  RosterPlayer,
} from "@/lib/types";

const DEFAULT_LEAGUE_ID = "83691608";
const DEFAULT_SEASON = 2026;

const positionNames: Record<number, string> = {
  0: "QB",
  1: "TQB",
  2: "RB",
  3: "RB/WR",
  4: "WR",
  5: "WR/TE",
  6: "TE",
  7: "OP",
  8: "DT",
  9: "DE",
  10: "LB",
  11: "DL",
  12: "CB",
  13: "S",
  14: "DB",
  15: "DP",
  16: "D/ST",
  17: "K",
  18: "P",
  19: "HC",
  20: "BE",
  21: "IR",
  23: "FLEX",
  24: "EDR",
};

const proTeamNames: Record<number, string> = {
  0: "FA",
  1: "ATL",
  2: "BUF",
  3: "CHI",
  4: "CIN",
  5: "CLE",
  6: "DAL",
  7: "DEN",
  8: "DET",
  9: "GB",
  10: "TEN",
  11: "IND",
  12: "KC",
  13: "LV",
  14: "LAR",
  15: "MIA",
  16: "MIN",
  17: "NE",
  18: "NO",
  19: "NYG",
  20: "NYJ",
  21: "PHI",
  22: "ARI",
  23: "PIT",
  24: "LAC",
  25: "SF",
  26: "SEA",
  27: "TB",
  28: "WAS",
  29: "CAR",
  30: "JAX",
  33: "BAL",
  34: "HOU",
};

const lineupSlots: Record<number, string> = {
  0: "QB",
  2: "RB",
  4: "WR",
  6: "TE",
  16: "D/ST",
  17: "K",
  20: "Bench",
  21: "IR",
  23: "FLEX",
};

type EspnMember = {
  id: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
};

type EspnStat = {
  scoringPeriodId?: number;
  statSourceId?: number;
  appliedTotal?: number;
};

type EspnRosterEntry = {
  lineupSlotId?: number;
  playerPoolEntry?: {
    player?: {
      id?: number;
      fullName?: string;
      defaultPositionId?: number;
      proTeamId?: number;
      stats?: EspnStat[];
    };
  };
};

type EspnTeam = {
  id: number;
  name?: string;
  location?: string;
  nickname?: string;
  abbrev?: string;
  owners?: string[];
  record?: {
    overall?: {
      wins?: number;
      losses?: number;
      ties?: number;
      pointsFor?: number;
      pointsAgainst?: number;
      streakLength?: number;
      streakType?: "WIN" | "LOSS" | "TIE";
    };
  };
  roster?: { entries?: EspnRosterEntry[] };
};

type EspnMatchup = {
  id: number;
  matchupPeriodId?: number;
  winner?: string;
  home?: { teamId?: number; totalPoints?: number };
  away?: { teamId?: number; totalPoints?: number };
};

type EspnLeague = {
  id?: number;
  members?: EspnMember[];
  teams?: EspnTeam[];
  schedule?: EspnMatchup[];
  status?: {
    currentMatchupPeriod?: number;
    currentScoringPeriod?: number;
    latestScoringPeriod?: number;
  };
  settings?: {
    name?: string;
    scheduleSettings?: { matchupPeriodCount?: number };
  };
};

function numberOrZero(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getStat(
  stats: EspnStat[] | undefined,
  scoringPeriod: number,
  statSourceId: number,
) {
  return stats?.find(
    (stat) =>
      stat.scoringPeriodId === scoringPeriod &&
      stat.statSourceId === statSourceId,
  )?.appliedTotal;
}

function mapRoster(
  entries: EspnRosterEntry[] | undefined,
  scoringPeriod: number,
): RosterPlayer[] {
  return (entries ?? []).flatMap((entry): RosterPlayer[] => {
    const player = entry.playerPoolEntry?.player;
    if (!player?.id || !player.fullName) return [];

    return [
      {
        id: player.id,
        name: player.fullName,
        position: positionNames[player.defaultPositionId ?? -1] ?? "—",
        proTeam: proTeamNames[player.proTeamId ?? 0] ?? "NFL",
        lineupSlot: lineupSlots[entry.lineupSlotId ?? -1] ?? "Starter",
        projectedPoints: getStat(player.stats, scoringPeriod, 1),
        actualPoints: getStat(player.stats, scoringPeriod, 0),
      },
    ];
  });
}

function teamName(team: EspnTeam) {
  return (
    team.name ||
    [team.location, team.nickname].filter(Boolean).join(" ") ||
    `Team ${team.id}`
  );
}

export async function getLeagueSnapshot(): Promise<LeagueSnapshot> {
  const leagueId = process.env.ESPN_LEAGUE_ID ?? DEFAULT_LEAGUE_ID;
  const season = Number(process.env.ESPN_SEASON_ID ?? DEFAULT_SEASON);
  const swid = process.env.ESPN_SWID;
  const espnS2 = process.env.ESPN_S2;

  if (!swid || !espnS2) {
    return getDemoSnapshot();
  }

  const params = new URLSearchParams();
  ["mTeam", "mRoster", "mMatchup", "mSettings", "mStandings"].forEach(
    (view) => params.append("view", view),
  );

  const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Cookie: `SWID=${swid}; espn_s2=${espnS2}`,
        "User-Agent": "GoofyCup/1.0",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) {
      throw new Error(`ESPN returned ${response.status}`);
    }

    const data = (await response.json()) as EspnLeague;
    const currentWeek = Math.max(
      1,
      numberOrZero(data.status?.currentMatchupPeriod),
    );
    const scoringPeriod = Math.max(
      1,
      numberOrZero(data.status?.currentScoringPeriod),
    );
    const finalWeek = numberOrZero(
      data.settings?.scheduleSettings?.matchupPeriodCount,
    );
    const latestCompletedWeek = finalWeek
      ? Math.min(finalWeek, Math.max(0, currentWeek - 1))
      : Math.max(0, currentWeek - 1);
    const members = new Map(
      (data.members ?? []).map((member) => [member.id, member]),
    );

    const teams: LeagueTeam[] = (data.teams ?? []).map((team) => {
      const overall = team.record?.overall;
      const manager = (team.owners ?? [])
        .map((ownerId) => {
          const member = members.get(ownerId);
          return (
            member?.displayName ??
            [member?.firstName, member?.lastName].filter(Boolean).join(" ")
          );
        })
        .filter(Boolean)
        .join(" & ");
      const streakLength = numberOrZero(overall?.streakLength);
      const streakPrefix = overall?.streakType?.slice(0, 1);

      return {
        id: team.id,
        name: teamName(team),
        abbreviation: team.abbrev ?? `T${team.id}`,
        manager: manager || "Manager",
        wins: numberOrZero(overall?.wins),
        losses: numberOrZero(overall?.losses),
        ties: numberOrZero(overall?.ties),
        pointsFor: numberOrZero(overall?.pointsFor),
        pointsAgainst: numberOrZero(overall?.pointsAgainst),
        streak:
          streakPrefix && streakLength ? `${streakPrefix}${streakLength}` : "—",
        roster: mapRoster(team.roster?.entries, scoringPeriod),
      };
    });

    const teamNames = new Map(teams.map((team) => [team.id, team.name]));
    const matchups: LeagueMatchup[] = (data.schedule ?? []).map((matchup) => ({
        id: matchup.id,
        week: matchup.matchupPeriodId ?? currentWeek,
        home: {
          teamId: matchup.home?.teamId ?? 0,
          teamName:
            teamNames.get(matchup.home?.teamId ?? 0) ?? "To be determined",
          score: numberOrZero(matchup.home?.totalPoints),
        },
        away: {
          teamId: matchup.away?.teamId ?? 0,
          teamName:
            teamNames.get(matchup.away?.teamId ?? 0) ?? "To be determined",
          score: numberOrZero(matchup.away?.totalPoints),
        },
        complete:
          currentWeek <= latestCompletedWeek ||
          (!!matchup.winner && matchup.winner !== "UNDECIDED"),
    }));

    return {
      leagueId,
      leagueName: data.settings?.name || "Goofy Cup",
      season,
      currentWeek,
      latestCompletedWeek,
      teams,
      matchups,
      syncedAt: new Date().toISOString(),
      isDemo: false,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown ESPN connection error";
    return getDemoSnapshot(`ESPN sync failed (${message}). Preview data is shown.`);
  }
}
