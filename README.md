# Goofy Cup

A Vercel-ready fantasy football league site built with Next.js, React,
TypeScript, and Tailwind CSS.

## What is included

- Live ESPN standings, weekly matchups, schedules, managers, and rosters
- Team detail pages with starters, bench, scoring, and season schedule
- A public fantasy assistant powered by `deepseek-v4-flash`
- Maximum reasoning and DeepSeek's native `web_search` tool on every chat
- One-click team names that insert at the current chat cursor position
- Automatic weekly recap generation after Monday Night Football
- A Neon Postgres archive for the Goofy Gazette
- No visitor accounts

Without private keys, the site intentionally opens in a clearly labeled preview
mode so the interface can be reviewed safely.

## 1. Local setup

Requirements: Node.js 22 or newer and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## 2. Connect the private ESPN league

League `83691608` and season `2026` are already configured in
`.env.example`. The private league also requires two ESPN session cookies:

1. Sign in to ESPN Fantasy in your own browser.
2. Open the browser developer tools and find Cookies for `espn.com`.
3. Copy the values named `SWID` and `espn_s2`.
4. Add them to `.env.local` locally, or to Vercel Environment Variables for a
   deployment:

```dotenv
ESPN_SWID={YOUR-SWID-VALUE}
ESPN_S2=YOUR-ESPN-S2-VALUE
```

Treat both values like passwords. They are read only by server routes and must
never be renamed with a `NEXT_PUBLIC_` prefix, pasted into client code, or
committed to source control.

The ESPN integration is intentionally isolated in `lib/espn.ts`. ESPN's league
API is undocumented, so the site falls back to a setup preview and displays a
warning if ESPN changes the response or the cookies expire.

## 3. Connect DeepSeek

Create an API key in the DeepSeek Platform and set:

```dotenv
DEEPSEEK_API_KEY=YOUR_KEY
```

The server uses the official Responses API at
`https://api.deepseek.com/responses` with:

- model: `deepseek-v4-flash`
- reasoning effort: `max`
- tool: `web_search`

The browser never receives the API key or ESPN cookies. The assistant receives
a compact, freshly fetched ESPN snapshot with each question and uses web search
for current NFL news, injuries, weather, and depth-chart context.

DeepSeek Responses API guide:
https://api-docs.deepseek.com/guides/responses_api/

## 4. Add the managed database

In the Vercel Marketplace, add a Neon Postgres integration to the project. It
injects `DATABASE_URL` automatically. Alternatively, create a Neon database and
set its pooled connection string manually:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
```

The first server request creates the small `weekly_posts` table automatically.
The same schema is available at `database/schema.sql` if you prefer to run it
from the Neon SQL editor.

## 5. Enable automatic Tuesday recaps

Create a random secret of at least 16 characters and add it to Vercel:

```dotenv
CRON_SECRET=YOUR_RANDOM_SECRET
```

`vercel.json` invokes `/api/cron/weekly-recap` every Tuesday at 13:00 UTC,
comfortably after Monday Night Football. Vercel adds the secret as an
Authorization header. The route:

1. refreshes ESPN data;
2. finds the latest completed week;
3. skips the run if that week already has a story;
4. generates a grounded recap with DeepSeek; and
5. saves it to Neon for the Weekly Stories page.

The job runs on production deployments. It is idempotent, so retries do not
create duplicate posts.

## 6. Deploy to Vercel

Upload this folder to a Git repository and import it into Vercel, or deploy with
the Vercel CLI. Add these production environment variables before the first
production deployment:

| Variable | Required | Secret |
| --- | --- | --- |
| `ESPN_LEAGUE_ID` | Yes | No |
| `ESPN_SEASON_ID` | Yes | No |
| `ESPN_SWID` | Yes | Yes |
| `ESPN_S2` | Yes | Yes |
| `DEEPSEEK_API_KEY` | Yes | Yes |
| `DATABASE_URL` | Yes | Yes |
| `CRON_SECRET` | Yes | Yes |

Vercel deployment guide: https://vercel.com/docs/deployments

## Useful commands

```bash
npm run dev       # local development
npm run typecheck # TypeScript validation
npm run lint      # lint the source
npm run build     # production build
npm run start     # run the production build
```

## Server routes

- `GET /api/league` — sanitized ESPN league snapshot
- `POST /api/chat` — DeepSeek fantasy assistant
- `GET /api/posts` — published weekly stories
- `GET /api/cron/weekly-recap` — protected Vercel scheduled job

The project includes no real credentials or private ESPN data.
