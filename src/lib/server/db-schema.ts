import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { TokenSet } from "@/lib/model";

export const savedSets = pgTable("saved_sets", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: text("owner_id").notNull(),
  name: text("name").notNull(),
  data: jsonb("data").$type<TokenSet>().notNull(),
  tokenCount: integer("token_count").notNull(),
  colors: jsonb("colors").$type<string[]>().notNull(),
  revision: integer("revision").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).defaultNow().notNull(),
}, (table) => [
  index("saved_sets_owner_updated_id").on(table.ownerId, table.updatedAt, table.id),
  check("saved_sets_name_length", sql`char_length(${table.name}) between 1 and 80`),
  check("saved_sets_owner_length", sql`char_length(${table.ownerId}) between 1 and 256`),
  check("saved_sets_revision_positive", sql`${table.revision} > 0`),
  check("saved_sets_token_count", sql`${table.tokenCount} between 1 and 1000`),
  check("saved_sets_version", sql`jsonb_typeof(${table.data}) = 'object' and ${table.data}->>'version' = '1'`),
  check("saved_sets_colors", sql`jsonb_typeof(${table.colors}) = 'array' and jsonb_array_length(${table.colors}) <= 4`),
]);
