import { Pool } from 'pg';

function getConnectionString() {
  if (process.env.POSTGRES_URL || process.env.DATABASE_URL) {
    return process.env.POSTGRES_URL || process.env.DATABASE_URL;
  }

  const host = process.env.POSTGRES_HOST;
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;
  const port = process.env.POSTGRES_PORT || '5432';
  const database = process.env.POSTGRES_DATABASE || 'neon-charcoal-kite';

  if (!host || !user || !password) {
    throw new Error(
      'Set POSTGRES_URL (or DATABASE_URL) OR set POSTGRES_HOST/POSTGRES_USER/POSTGRES_PASSWORD (optional POSTGRES_DATABASE, POSTGRES_PORT).'
    );
  }

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?sslmode=require`;
}

const globalForDb = globalThis;

export const pool =
  globalForDb.__murphyPool ||
  new Pool({
    connectionString: getConnectionString()
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__murphyPool = pool;
}
