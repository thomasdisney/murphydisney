import { ensureSchema, queryWithRetry } from './db';

export async function listMessages() {
  await ensureSchema();

  const result = await queryWithRetry(
    `SELECT id,
            content,
            author_token AS "authorToken",
            city,
            state,
            created_at AS "createdAt"
     FROM messages
     ORDER BY created_at ASC, id ASC`,
    [],
    { retries: 2 }
  );

  return result.rows;
}

export async function createMessage(content, authorToken, location = {}) {
  await ensureSchema();

  const city = location.city || null;
  const state = location.state || null;

  const result = await queryWithRetry(
    `INSERT INTO messages (content, author_token, city, state)
     VALUES ($1, $2, $3, $4)
     RETURNING id,
               content,
               author_token AS "authorToken",
               city,
               state,
               created_at AS "createdAt"`,
    [content, authorToken, city, state],
    { retries: 2 }
  );

  return result.rows[0];
}
