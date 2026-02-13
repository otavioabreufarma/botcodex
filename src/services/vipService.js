import { readVipUsers, withDatabaseWrite } from '../utils/db.js';

function cloneVip(user) {
  return user ? { ...user } : null;
}

export async function upsertVip({ steamId, discordId = null, source = 'manual' }) {
  const now = new Date().toISOString();
  let savedUser = null;

  await withDatabaseWrite((database) => {
    const index = database.vip_users.findIndex((user) => user.steam_id === steamId);

    if (index >= 0) {
      const currentUser = database.vip_users[index];
      const updatedUser = {
        ...currentUser,
        discord_id: discordId ?? currentUser.discord_id,
        vip_active: true,
        source,
        updated_at: now
      };

      database.vip_users[index] = updatedUser;
      savedUser = updatedUser;
      return database;
    }

    const createdUser = {
      id: database.last_id + 1,
      discord_id: discordId,
      steam_id: steamId,
      vip_active: true,
      source,
      created_at: now,
      updated_at: now
    };

    database.last_id = createdUser.id;
    database.vip_users.push(createdUser);
    savedUser = createdUser;

    return database;
  });

  return cloneVip(savedUser);
}

export async function deactivateVip({ steamId, source = 'manual' }) {
  let updatedUser = null;

  await withDatabaseWrite((database) => {
    const index = database.vip_users.findIndex((user) => user.steam_id === steamId);

    if (index < 0) {
      return database;
    }

    const currentUser = database.vip_users[index];
    updatedUser = {
      ...currentUser,
      vip_active: false,
      source,
      updated_at: new Date().toISOString()
    };

    database.vip_users[index] = updatedUser;
    return database;
  });

  return cloneVip(updatedUser);
}

export async function getVipStatus(steamId) {
  const users = await readVipUsers();
  const vipUser = users.find((user) => user.steam_id === steamId);

  return cloneVip(vipUser ?? null);
}
