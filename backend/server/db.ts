import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Please provide a Postgres connection string.");
}

console.log("Initializing DB pool with URL:", process.env.DATABASE_URL?.split('@')[1] || "NOT SET");
const sslConfig = process.env.DATABASE_URL?.includes('localhost') || 
                  process.env.DATABASE_URL?.includes('127.0.0.1') || 
                  process.env.DATABASE_URL?.includes('db') ||
                  process.env.DATABASE_URL?.includes('postgres')
    ? false 
    : { rejectUnauthorized: false };
console.log("SSL Config:", JSON.stringify(sslConfig));

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig
});

export const db = drizzle(pool, { schema });

// Helper to check connectivity (used by system controller)
export const getRemoteDb = () => db;

