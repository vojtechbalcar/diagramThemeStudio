import "server-only";
import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./db-schema";

export type Database = PostgresJsDatabase<typeof schema>;
const development = globalThis as typeof globalThis & { lineworkDatabase?: Database };
let database: Database | undefined;

/** No connection is created during imports or production builds. */
export function getDatabase(): Database {
  if (database) return database;
  if (process.env.NODE_ENV !== "production" && development.lineworkDatabase) return development.lineworkDatabase;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Database is not configured");
  const client = postgres(url, { max: 5, prepare: false, connect_timeout: 5, idle_timeout: 20, connection: { statement_timeout: 10_000 } });
  database = drizzle(client, { schema });
  if (process.env.NODE_ENV !== "production") development.lineworkDatabase = database;
  return database;
}
