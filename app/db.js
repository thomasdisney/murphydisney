import dns from 'node:dns';
import { Pool } from 'pg';

dns.setDefaultResultOrder('ipv4first');

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
const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    content VARCHAR(500) NOT NULL,
    author_token VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
`;

function createPool() {
  const connectionString = getConnectionString();

  if (!connectionString) {
    throw new Error(
      'Database connection is not configured. Set POSTGRES_URL (or DATABASE_URL), or POSTGRES_HOST/POSTGRES_USER/POSTGRES_PASSWORD.'
    );
  }

  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    maxUses: 7_500
  });

  pool.on('error', (error) => {
    console.error('[db] Unexpected PostgreSQL pool error.', {
      code: error?.code,
      message: error?.message
    });
  });

  return pool;
}

export function getPool() {
  if (!globalForDb.__murphyPool) {
    globalForDb.__murphyPool = createPool();
  }

  return globalForDb.__murphyPool;
}

const transientPgCodes = new Set(['40001', '40P01', '53300', '57P01', '57P02', '57P03']);
const transientNetworkCodes = new Set(['ECONNRESET', 'ETIMEDOUT', 'EPIPE', 'ENETUNREACH', 'ECONNREFUSED', 'ENOTFOUND']);

function isTransientError(error) {
  return transientPgCodes.has(error?.code) || transientNetworkCodes.has(error?.code);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function queryWithRetry(text, values = [], options = {}) {
  const retries = options.retries ?? 2;
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await getPool().query(text, values);
    } catch (error) {
      lastError = error;

      if (attempt === retries || !isTransientError(error)) {
        break;
      }

      const backoffMs = 120 * 2 ** attempt;
      await delay(backoffMs);
    }
  }

  throw lastError;
}

let schemaPromise = globalForDb.__murphySchemaPromise;

export async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = queryWithRetry(SCHEMA_SQL, [], { retries: 3 }).catch((error) => {
      schemaPromise = null;
      throw error;
    });
    globalForDb.__murphySchemaPromise = schemaPromise;
  }

  await schemaPromise;
}
