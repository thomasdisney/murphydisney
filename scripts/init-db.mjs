import pg from 'pg';

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

const pool = new pg.Pool({
  connectionString: getConnectionString()
});

await pool.query(`
  CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    content VARCHAR(500) NOT NULL,
    author_token VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`);

await pool.query('CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)');

await pool.end();
console.log('Database initialized: messages table is ready.');
