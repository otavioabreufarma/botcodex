import { pool } from '../utils/db.js';

export async function upsertVip({ steamId, discordId = null, source = 'manual' }) {
  const result = await pool.query(
    `
      INSERT INTO vip_users (discord_id, steam_id, vip_active, source, updated_at)
      VALUES ($1, $2, true, $3, NOW())
      ON CONFLICT (steam_id)
      DO UPDATE SET
        discord_id = COALESCE(EXCLUDED.discord_id, vip_users.discord_id),
        vip_active = true,
        source = EXCLUDED.source,
        updated_at = NOW()
      RETURNING id, discord_id, steam_id, vip_active, source, created_at, updated_at
    `,
    [discordId, steamId, source]
  );

  return result.rows[0];
}

export async function deactivateVip({ steamId, source = 'manual' }) {
  const result = await pool.query(
    `
      UPDATE vip_users
      SET vip_active = false, source = $2, updated_at = NOW()
      WHERE steam_id = $1
      RETURNING id, discord_id, steam_id, vip_active, source, created_at, updated_at
    `,
    [steamId, source]
  );

  return result.rows[0] ?? null;
}

export async function getVipStatus(steamId) {
  const result = await pool.query(
    `SELECT id, discord_id, steam_id, vip_active, source, created_at, updated_at FROM vip_users WHERE steam_id = $1`,
    [steamId]
  );

  return result.rows[0] ?? null;
}
