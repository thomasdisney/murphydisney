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
    return null;
  }

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?sslmode=require`;
}

const globalForDb = globalThis;

function createPool() {
  const connectionString = getConnectionString();

  if (!connectionString) {
    return null;
  }

  return new Pool({ connectionString });
}

export const pool = globalForDb.__murphyPool ?? createPool();

if (!globalForDb.__murphyPool) {
  globalForDb.__murphyPool = pool;
}
