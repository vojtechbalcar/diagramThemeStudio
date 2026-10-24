import "server-only";
import { and, desc, eq, lt, or, sql } from "drizzle-orm";
import { SavedSetSchema, SavedSetSummarySchema, SAVED_SET_PAGE_SIZE, encodeCursor, metadataFor, type SavedSetRepository } from "@/lib/saved-sets/model";
import { savedSets } from "./db-schema";
import type { Database } from "./db";

const summaryColumns = { id: savedSets.id, name: savedSets.name, revision: savedSets.revision, tokenCount: savedSets.tokenCount, colors: savedSets.colors, updatedAt: savedSets.updatedAt };
type Row = typeof savedSets.$inferSelect;
function summary(row: Pick<Row, keyof typeof summaryColumns>) { return SavedSetSummarySchema.parse({ ...row, updatedAt: row.updatedAt.toISOString() }); }
function document(row: Row) { return SavedSetSchema.parse({ ...summary(row), set: row.data, createdAt: row.createdAt.toISOString() }); }

export function postgresSavedSets(database: Database): SavedSetRepository {
  return {
    async list(owner, cursor) {
      const page = await database.select(summaryColumns).from(savedSets).where(and(eq(savedSets.ownerId, owner), cursor ? or(lt(savedSets.updatedAt, new Date(cursor.updatedAt)), and(eq(savedSets.updatedAt, new Date(cursor.updatedAt)), lt(savedSets.id, cursor.id))) : undefined))
        .orderBy(desc(savedSets.updatedAt), desc(savedSets.id)).limit(SAVED_SET_PAGE_SIZE + 1);
      const items = page.slice(0, SAVED_SET_PAGE_SIZE).map(summary);
      const last = items.at(-1);
      return { items, nextCursor: page.length > SAVED_SET_PAGE_SIZE && last ? encodeCursor({ id: last.id, updatedAt: last.updatedAt }) : null };
    },
    async get(owner, id) {
      const [row] = await database.select().from(savedSets).where(and(eq(savedSets.ownerId, owner), eq(savedSets.id, id))).limit(1);
      return row ? document(row) : null;
    },
    async create(owner, set) {
      const [row] = await database.insert(savedSets).values({ ownerId: owner, ...metadataFor(set), data: set }).returning();
      if (!row) throw new Error("Insert returned no document");
      return document(row);
    },
    async update(owner, id, revision, set) {
      const [row] = await database.update(savedSets).set({ ...metadataFor(set), data: set, revision: sql`${savedSets.revision} + 1`, updatedAt: sql`statement_timestamp()` })
        .where(and(eq(savedSets.ownerId, owner), eq(savedSets.id, id), eq(savedSets.revision, revision))).returning();
      return row ? document(row) : null;
    },
    async remove(owner, id, revision) {
      const rows = await database.delete(savedSets).where(and(eq(savedSets.ownerId, owner), eq(savedSets.id, id), eq(savedSets.revision, revision))).returning({ id: savedSets.id });
      return rows.length > 0;
    },
  };
}
