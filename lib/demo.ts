import type { LeagueSnapshot } from "@/lib/types";

const teamNames = [
  "The Goof Troop",
  "Fourth & Goofy",
  "Sunday Scaries",
  "Turf Monsters",
  "Bench Warmers",
  "End Zone Enthusiasts",
  "Waiver Wizards",
  "Bye Week Bandits",
];

export function getDemoSnapshot(warning?: string): LeagueSnapshot {
  const teams = teamNames.map((name, index) => ({
    id: index + 1,
    name,
    abbreviation: name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 4)
      .toUpperCase(),
    manager: `Manager ${index + 1}`,
    wins: Math.max(0, 5 - index),
    losses: Math.min(7, index + 1),
    ties: 0,
    pointsFor: 812.4 - index * 41.7,
    pointsAgainst: 694.2 + index * 22.9,
    streak: index < 3 ? `W${3 - index}` : `L${index - 2}`,
    roster: [],
  }));

  const week = 1;
  const matchups = [0, 1, 2, 3].map((index) => ({
    id: index + 1,
    week,
    home: {
      teamId: teams[index].id,
      teamName: teams[index].name,
      score: 0,
    },
    away: {
      teamId: teams[7 - index].id,
      teamName: teams[7 - index].name,
      score: 0,
    },
    complete: false,
  }));

  return {
    leagueId: "83691608",
    leagueName: "Goofy Cup",
    season: 2026,
    currentWeek: week,
    latestCompletedWeek: 0,
    teams,
    matchups,
    syncedAt: new Date().toISOString(),
    isDemo: true,
    warning:
      warning ??
      "Preview data is shown until the private ESPN credentials are added.",
  };
}
