# MurphyDisney Forever Messages

A one-page, mobile-first message wall where friends and family can post messages that are stored in Neon Postgres and shown to every visitor in chronological order.

## Stack

- Next.js 14 (App Router)
- PostgreSQL (`pg` client, compatible with Vercel Postgres + Neon)

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Add environment variables in `.env.local`.

Preferred:

```bash
POSTGRES_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"
IP_SALT="choose-a-random-secret-string"
```

Or discrete vars:

```bash
POSTGRES_HOST="..."
POSTGRES_USER="..."
POSTGRES_PASSWORD="..."
POSTGRES_PORT="5432"
POSTGRES_DATABASE="neon-charcoal-kite"
IP_SALT="choose-a-random-secret-string"
```

3. (Optional) Initialize database schema ahead of time:

```bash
npm run db:init
```

4. Verify the database end-to-end (schema + write + read):

```bash
npm run db:verify
```

5. Start the app:

```bash
npm run dev
```

## Vercel + NeonDB setup (production persistence)

1. In Vercel, open your project and go to **Storage**.
2. Create or connect a **Neon Postgres** database.
3. In **Project Settings → Environment Variables**, confirm these are present for Production/Preview:
   - `POSTGRES_URL` (recommended) **or** `DATABASE_URL`
   - `IP_SALT` (random secret string)
4. Redeploy after variables are saved.
5. Run schema initialization once against that database:

```bash
npm run db:init
```

   You can run this locally with the same `POSTGRES_URL`, or execute the SQL from `scripts/init-db.mjs` in the Vercel/Neon SQL console.

6. Verify data persistence:
   - Post a message in production.
   - Refresh and open in another browser/session.
   - Confirm the same message appears and retains order by `created_at` then `id`.

## Behavior

- Messages are always stored in Postgres; the app fails fast when database configuration is missing.
- The app auto-creates the `messages` table/index on first read/write, uses IPv4-first DNS resolution, and retries transient database/network errors.
- Messages are returned in chronological order (`created_at ASC, id ASC`) for consistent ordering.
- Each message stores request metadata in Postgres (`city`, `region`, `user_agent`, `device_label`, `created_at`) and shows an iMessage-style label (`iPhone in City, Region`) on its own line above the timestamp.
- Timestamps display in 12-hour format as `Mon D, YYYY at h:mm` (with lowercase am/pm) to match iOS-style compact message metadata.
- No login is required.
- Message color alignment is inferred from hashed IP token (best effort).

## Deployment notes

- This project uses `@vercel/functions` geolocation API on the server (`geolocation(request)`) and falls back to Vercel geo headers when needed.
- Schema migration is self-contained in `app/db.js` (`ensureSchema`), so merging to `main` and deploying runs with no manual SQL steps.
