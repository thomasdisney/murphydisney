import { pool } from './db';

const globalForStore = globalThis;

if (!globalForStore.__murphyMessages) {
  globalForStore.__murphyMessages = [];
  globalForStore.__murphyMessageId = 1;
}

function listMemoryMessages() {
  return [...globalForStore.__murphyMessages];
}

function createMemoryMessage(content, authorToken) {
  const message = {
    id: globalForStore.__murphyMessageId++,
    content,
    authorToken,
    createdAt: new Date().toISOString()
  };

  globalForStore.__murphyMessages.push(message);
  return message;
}

export async function listMessages() {
  if (!pool) {
    return listMemoryMessages();
  }

  const result = await pool.query(
    `SELECT id, content, author_token AS "authorToken", created_at AS "createdAt"
     FROM messages
     ORDER BY created_at ASC`
  );

  return result.rows;
}

export async function createMessage(content, authorToken) {
  if (!pool) {
    return createMemoryMessage(content, authorToken);
  }

  const result = await pool.query(
    `INSERT INTO messages (content, author_token)
     VALUES ($1, $2)
     RETURNING id, content, author_token AS "authorToken", created_at AS "createdAt"`,
    [content, authorToken]
  );

  return result.rows[0];
}
