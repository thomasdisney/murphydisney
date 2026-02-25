import { ensureSchema, getPool, queryWithRetry } from '../app/db.js';

const pool = getPool();

try {
  await ensureSchema();

  await queryWithRetry('BEGIN');

  const marker = `verification-${Date.now()}`;
  const insertResult = await queryWithRetry(
    `INSERT INTO messages (content, author_token, city, region, user_agent, device_label)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id,
               content,
               author_token AS "authorToken",
               city,
               region,
               user_agent AS "userAgent",
               device_label AS "deviceLabel",
               created_at AS "createdAt"`,
    [marker, 'db-verifier', 'San Francisco', 'California', 'Mozilla/5.0 (iPhone)', 'iPhone']
  );

  const inserted = insertResult.rows[0];

  const readResult = await queryWithRetry(
    `SELECT id,
            content,
            author_token AS "authorToken",
            city,
            region,
            user_agent AS "userAgent",
            device_label AS "deviceLabel",
            created_at AS "createdAt"
     FROM messages
     WHERE id = $1`,
    [inserted.id]
  );

  if (!readResult.rows[0] || readResult.rows[0].content !== marker) {
    throw new Error('Inserted verification row was not readable.');
  }

  await queryWithRetry('ROLLBACK');

  const tableCheck = await queryWithRetry(
    `SELECT to_regclass('public.messages') AS table_name,
            to_regclass('public.idx_messages_created_at') AS index_name`
  );

  console.log('Database verification passed.', {
    table: tableCheck.rows[0]?.table_name,
    index: tableCheck.rows[0]?.index_name,
    sampleMessageId: inserted.id,
    sampleRegion: inserted.region,
    sampleDevice: inserted.deviceLabel
  });
} catch (error) {
  try {
    await queryWithRetry('ROLLBACK');
  } catch {}

  console.error('Database verification failed.', {
    code: error?.code,
    message: error?.message
  });
  process.exitCode = 1;
} finally {
  await pool.end();
}
