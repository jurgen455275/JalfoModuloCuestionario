import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/jalfo_portal',
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

/**
 * Wraps database operations in a transaction with app.current_user_id set
 * so that PL/pgSQL triggers capture the authenticated user in bitacora_sistema.
 */
export async function withTransaction(userId, callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (userId) {
      // Set local app session variable for triggers
      await client.query('SET LOCAL app.current_user_id = $1', [userId]);
    }
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
