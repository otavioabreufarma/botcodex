import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não definida no ambiente');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PG_SSL === 'false' ? false : { rejectUnauthorized: false }
});

export async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vip_users (
      id SERIAL PRIMARY KEY,
      discord_id TEXT,
      steam_id TEXT NOT NULL UNIQUE,
      vip_active BOOLEAN NOT NULL DEFAULT true,
      source TEXT NOT NULL DEFAULT 'manual',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}
