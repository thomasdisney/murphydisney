import { ensureSchema, queryWithRetry } from './db';

export async function listMessages() {
  await ensureSchema();

  const result = await queryWithRetry(
    `SELECT id, content, author_token AS "authorToken", created_at AS "createdAt"
     FROM messages
     ORDER BY created_at ASC, id ASC`,
    [],
    { retries: 2 }
  );

  return result.rows;
}

export async function createMessage(content, authorToken) {
  await ensureSchema();

  const result = await queryWithRetry(
    `INSERT INTO messages (content, author_token)
     VALUES ($1, $2)
     RETURNING id, content, author_token AS "authorToken", created_at AS "createdAt"`,
    [content, authorToken],
    { retries: 2 }
  );

  return result.rows[0];
}
