import { pool } from './db';

export async function listMessages() {
  const result = await pool.query(
    `SELECT id, content, author_token AS "authorToken", created_at AS "createdAt"
     FROM messages
     ORDER BY created_at ASC`
  );

  return result.rows;
}

export async function createMessage(content, authorToken) {
  const result = await pool.query(
    `INSERT INTO messages (content, author_token)
     VALUES ($1, $2)
     RETURNING id, content, author_token AS "authorToken", created_at AS "createdAt"`,
    [content, authorToken]
  );

  return result.rows[0];
}
