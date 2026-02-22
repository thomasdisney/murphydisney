import { ensureSchema, getPool } from '../app/db.js';

try {
  await ensureSchema();
  console.log('Database initialized: messages table is ready.');
} finally {
  await getPool().end();
}
