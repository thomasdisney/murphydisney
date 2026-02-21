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

function canFallbackToMemory(error) {
  const code = error?.code;
  return (
    !code ||
    code === '42P01' || // undefined_table
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'ETIMEDOUT' ||
    code === '57P01' || // admin_shutdown
    code === '53300' // too_many_connections
  );
}

function logDbFallback(context, error) {
  console.error(`[store] Falling back to in-memory storage during ${context}.`, {
    code: error?.code,
    message: error?.message
  });
}

export async function listMessages() {
  if (!pool) {
    return listMemoryMessages();
  }

  try {
    const result = await pool.query(
      `SELECT id, content, author_token AS "authorToken", created_at AS "createdAt"
       FROM messages
       ORDER BY created_at ASC`
    );

    return result.rows;
  } catch (error) {
    if (canFallbackToMemory(error)) {
      logDbFallback('listMessages', error);
      return listMemoryMessages();
    }

    throw error;
  }
}

export async function createMessage(content, authorToken) {
  if (!pool) {
    return createMemoryMessage(content, authorToken);
  }

  try {
    const result = await pool.query(
      `INSERT INTO messages (content, author_token)
       VALUES ($1, $2)
       RETURNING id, content, author_token AS "authorToken", created_at AS "createdAt"`,
      [content, authorToken]
    );

    return result.rows[0];
  } catch (error) {
    if (canFallbackToMemory(error)) {
      logDbFallback('createMessage', error);
      return createMemoryMessage(content, authorToken);
    }

    throw error;
  }
}
