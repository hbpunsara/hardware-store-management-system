import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config();

export default defineConfig({
    out: "./migrations-pg",
    schema: "./shared/schema.pg.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
        ssl: { rejectUnauthorized: false }
    },
});
