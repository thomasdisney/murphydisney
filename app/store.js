import { ensureSchema, queryWithRetry } from './db';

export async function listMessages() {
  await ensureSchema();

  const result = await queryWithRetry(
    `SELECT id,
            content,
            author_token AS "authorToken",
            city,
            region,
            user_agent AS "userAgent",
            device_label AS "deviceLabel",
            created_at AS "createdAt"
     FROM messages
     ORDER BY created_at ASC, id ASC`,
    [],
    { retries: 2 }
  );

  return result.rows;
}

export async function createMessage(content, authorToken, metadata = {}) {
  await ensureSchema();

  const city = metadata.city || null;
  const region = metadata.region || null;
  const userAgent = metadata.userAgent || null;
  const deviceLabel = metadata.deviceLabel || null;
  const createdAt = metadata.createdAt || new Date().toISOString();

  const result = await queryWithRetry(
    `INSERT INTO messages (content, author_token, city, region, user_agent, device_label, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id,
               content,
               author_token AS "authorToken",
               city,
               region,
               user_agent AS "userAgent",
               device_label AS "deviceLabel",
               created_at AS "createdAt"`,
    [content, authorToken, city, region, userAgent, deviceLabel, createdAt],
    { retries: 2 }
  );

  return result.rows[0];
}
