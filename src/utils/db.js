import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_DB_PATH = path.resolve(process.cwd(), 'data', 'db.json');
const DB_PATH = process.env.JSON_DB_PATH
  ? path.resolve(process.cwd(), process.env.JSON_DB_PATH)
  : DEFAULT_DB_PATH;

let writeQueue = Promise.resolve();

async function ensureDatabaseFile() {
  const dir = path.dirname(DB_PATH);
  await mkdir(dir, { recursive: true });

  try {
    await readFile(DB_PATH, 'utf8');
  } catch {
    const initialState = {
      vip_users: [],
      last_id: 0
    };

    await writeFile(DB_PATH, JSON.stringify(initialState, null, 2));
  }
}

async function readDatabase() {
  await ensureDatabaseFile();
  const content = await readFile(DB_PATH, 'utf8');

  try {
    const parsed = JSON.parse(content);
    return {
      vip_users: Array.isArray(parsed.vip_users) ? parsed.vip_users : [],
      last_id: Number.isInteger(parsed.last_id) ? parsed.last_id : 0
    };
  } catch {
    return {
      vip_users: [],
      last_id: 0
    };
  }
}

async function writeDatabase(data) {
  await writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

export async function initDatabase() {
  await ensureDatabaseFile();
}

export async function withDatabaseWrite(updater) {
  writeQueue = writeQueue.then(async () => {
    const database = await readDatabase();
    const nextDatabase = await updater(database);

    if (nextDatabase) {
      await writeDatabase(nextDatabase);
      return nextDatabase;
    }

    return database;
  });

  return writeQueue;
}

export async function readVipUsers() {
  const database = await readDatabase();
  return database.vip_users;
}

export { DB_PATH };
