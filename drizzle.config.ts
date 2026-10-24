import { defineConfig } from "drizzle-kit";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
if (existsSync(".env.local")) loadEnvFile(".env.local");
export default defineConfig({
  dialect: "postgresql", schema: "./src/lib/server/db-schema.ts", out: "./drizzle",
  ...(process.env.DATABASE_URL ? { dbCredentials: { url: process.env.DATABASE_URL } } : {}),
});
