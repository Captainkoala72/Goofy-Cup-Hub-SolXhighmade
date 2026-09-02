import { neon } from "@neondatabase/serverless";
import type { WeeklyPost } from "@/lib/types";

let schemaReady = false;

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  return databaseUrl ? neon(databaseUrl) : null;
}

async function ensureSchema() {
  const sql = getSql();
  if (!sql || schemaReady) return sql;

  await sql`
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
    )
  `;
  schemaReady = true;
  return sql;
}

type WeeklyPostRow = {
  id: string;
  season: number;
  week: number;
  title: string;
  excerpt: string;
  body: string;
  created_at: string | Date;
};

function mapPost(row: WeeklyPostRow): WeeklyPost {
  return {
    id: row.id,
    season: row.season,
    week: row.week,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function getWeeklyPosts(limit = 20): Promise<WeeklyPost[]> {
  const sql = await ensureSchema();
  if (!sql) return [];

  const rows = await sql.query(
    `SELECT id, season, week, title, excerpt, body, created_at
     FROM weekly_posts
     WHERE league_id = $1
     ORDER BY season DESC, week DESC
     LIMIT $2`,
    [process.env.ESPN_LEAGUE_ID ?? "83691608", limit],
  );

  return (rows as WeeklyPostRow[]).map(mapPost);
}

export async function getWeeklyPost(
  season: number,
  week: number,
): Promise<WeeklyPost | null> {
  const sql = await ensureSchema();
  if (!sql) return null;

  const rows = await sql.query(
    `SELECT id, season, week, title, excerpt, body, created_at
     FROM weekly_posts
     WHERE league_id = $1 AND season = $2 AND week = $3
     LIMIT 1`,
    [process.env.ESPN_LEAGUE_ID ?? "83691608", season, week],
  );

  const row = (rows as WeeklyPostRow[])[0];
  return row ? mapPost(row) : null;
}

export async function saveWeeklyPost(post: Omit<WeeklyPost, "id" | "createdAt">) {
  const sql = await ensureSchema();
  if (!sql) {
    throw new Error("DATABASE_URL is not configured");
  }

  const leagueId = process.env.ESPN_LEAGUE_ID ?? "83691608";
  const id = `${leagueId}-${post.season}-${post.week}`;
  const rows = await sql.query(
    `INSERT INTO weekly_posts (id, league_id, season, week, title, excerpt, body)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (league_id, season, week)
     DO UPDATE SET
       title = EXCLUDED.title,
       excerpt = EXCLUDED.excerpt,
       body = EXCLUDED.body,
       created_at = NOW()
     RETURNING id, season, week, title, excerpt, body, created_at`,
    [
      id,
      leagueId,
      post.season,
      post.week,
      post.title,
      post.excerpt,
      post.body,
    ],
  );

  return mapPost((rows as WeeklyPostRow[])[0]);
}
