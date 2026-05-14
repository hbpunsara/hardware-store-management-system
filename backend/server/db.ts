import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";

// Primary Database (Local-First)
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Please provide a Postgres connection string.");
}

console.log("Initializing Primary DB pool with URL:", process.env.DATABASE_URL?.split('@')[1] || "NOT SET");

const getSslConfig = (url: string) => {
  return url.includes('localhost') || 
         url.includes('127.0.0.1') || 
         url.includes('db') ||
         url.includes('postgres')
    ? false 
    : { rejectUnauthorized: false };
};

const primaryPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: getSslConfig(process.env.DATABASE_URL)
});

export const db = drizzle(primaryPool, { schema });

// Remote Database (Cloud Sync)
let remoteDb: any = null;
if (process.env.REMOTE_DATABASE_URL) {
  console.log("Initializing Remote DB pool for Sync...");
  const remotePool = new pg.Pool({
    connectionString: process.env.REMOTE_DATABASE_URL,
    ssl: getSslConfig(process.env.REMOTE_DATABASE_URL)
  });
  remoteDb = drizzle(remotePool, { schema });
}

// Helper to get the remote DB instance for the sync manager
export const getRemoteDb = () => remoteDb;

