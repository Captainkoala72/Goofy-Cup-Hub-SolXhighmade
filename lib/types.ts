export type LeagueTeam = {
  id: number;
  name: string;
  abbreviation: string;
  manager: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  streak?: string;
  roster: RosterPlayer[];
};

export type RosterPlayer = {
  id: number;
  name: string;
  position: string;
  proTeam: string;
  lineupSlot: string;
  projectedPoints?: number;
  actualPoints?: number;
};

export type MatchupSide = {
  teamId: number;
  teamName: string;
  score: number;
};

export type LeagueMatchup = {
  id: number;
  week: number;
  home: MatchupSide;
  away: MatchupSide;
  complete: boolean;
};

export type LeagueSnapshot = {
  leagueId: string;
  leagueName: string;
  season: number;
  currentWeek: number;
  latestCompletedWeek: number;
  teams: LeagueTeam[];
  matchups: LeagueMatchup[];
  syncedAt: string;
  isDemo: boolean;
  warning?: string;
};

export type WeeklyPost = {
  id: string;
  season: number;
  week: number;
  title: string;
  excerpt: string;
  body: string;
  createdAt: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatSource = {
  title: string;
  url: string;
};
