import Database from "better-sqlite3";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";

import pg from "pg";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";

// 1. Local Database (SQLite)
const sqlite = new Database("hardware_store_local.db");
export const localDb = drizzleSqlite(sqlite, { schema });

// 2. Remote Database (Postgres) - Optional init depending on connectivity
let remoteDbInstance: ReturnType<typeof drizzlePg> | null = null;

export const getRemoteDb = () => {
  if (remoteDbInstance) return remoteDbInstance;

  if (process.env.DATABASE_URL) {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    remoteDbInstance = drizzlePg(pool, { schema });
    return remoteDbInstance;
  }
  return null;
};

// Backwards compatibility for existing controllers trying to just use `db`
// In a fully offline-first app, all reads/writes should go to `localDb`
export const db = localDb;
