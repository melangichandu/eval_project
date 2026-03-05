const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/grantdb';

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
});

const maxRetries = 10;
const retryDelayMs = 2000;

async function connectWithRetry() {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      return pool;
    } catch (err) {
      console.warn(`DB connect attempt ${i + 1}/${maxRetries} failed:`, err.message);
      if (i === maxRetries - 1) throw err;
      await new Promise((r) => setTimeout(r, retryDelayMs));
    }
  }
}

module.exports = { pool, connectWithRetry };
