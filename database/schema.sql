CREATE TABLE IF NOT EXISTS weekly_posts (
  id TEXT PRIMARY KEY,
  league_id TEXT NOT NULL,
  season INTEGER NOT NULL,
  week INTEGER NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (league_id, season, week)
);

CREATE INDEX IF NOT EXISTS weekly_posts_league_week_idx
  ON weekly_posts (league_id, season DESC, week DESC);
