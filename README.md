# MurphyDisney Forever Messages

A one-page, mobile-first message wall where friends and family can post messages that are permanently stored in a database.

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

Or discrete vars (with your provided DB name default):

```bash
POSTGRES_HOST="..."
POSTGRES_USER="..."
POSTGRES_PASSWORD="..."
POSTGRES_PORT="5432"
POSTGRES_DATABASE="neon-charcoal-kite"
IP_SALT="choose-a-random-secret-string"
```

3. Initialize database schema:

```bash
npm run db:init
```

4. Start the app:

```bash
npm run dev
```

## Deploy on Vercel

1. Import this repo into Vercel.
2. Attach your Postgres/Neon database.
3. Set either `POSTGRES_URL` **or** the discrete `POSTGRES_*` vars above.
4. Set `IP_SALT` to a random secret.
5. Run `npm run db:init` once (or run equivalent SQL in Vercel SQL console).

## Notes

- No login is required.
- Message color alignment is inferred from hashed IP token (best effort).
- Messages are persisted in Postgres and shown to all users in chronological order.
- iOS/Safari can restrict fully automatic keyboard open without interaction; the app still autofocuses input and keeps composer pinned above the keyboard area.
