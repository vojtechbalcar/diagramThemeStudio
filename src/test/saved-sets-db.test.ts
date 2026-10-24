import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq, inArray } from "drizzle-orm";
import { savedSets } from "@/lib/server/db-schema";
import * as schema from "@/lib/server/db-schema";
import { postgresSavedSets } from "@/lib/server/saved-sets";
import { createSavedSetService } from "@/lib/saved-sets/service";
import { PRESETS } from "@/lib/tokens/presets";

// Point this only at a dedicated test database; CI provides its own service.
const url = process.env.TEST_DATABASE_URL;
describe.skipIf(!url)("real Postgres saved-set integration", () => {
  const client = postgres(url ?? "postgres://localhost/unused", { max: 5, prepare: false });
  const db = drizzle(client, { schema });
  const repository = postgresSavedSets(db);
  const owners = [`test_${crypto.randomUUID()}`, `test_${crypto.randomUUID()}`];
  const a = createSavedSetService(repository, owners[0]), b = createSavedSetService(repository, owners[1]);
  beforeAll(async () => { await migrate(db, { migrationsFolder: "drizzle" }); });
  afterAll(async () => { await db.delete(savedSets).where(inArray(savedSets.ownerId, owners)); await client.end(); });
  it("persists complete themes and enforces ownership in actual SQL", async () => {
    const saved = await a.create(PRESETS[1].set);
    expect((await a.get(saved.id)).set).toEqual(PRESETS[1].set);
    expect((await b.list()).items).toEqual([]);
    await expect(b.get(saved.id)).rejects.toMatchObject({ status: 404 });
    await expect(b.update(saved.id, 1, PRESETS[2].set)).rejects.toMatchObject({ status: 404 });
    await expect(b.remove(saved.id, 1)).rejects.toMatchObject({ status: 404 });
    expect((await a.get(saved.id)).set).toEqual(PRESETS[1].set);
  });
  it("allows only one winner when revisions are updated concurrently", async () => {
    const saved = await a.create(PRESETS[1].set);
    const results = await Promise.allSettled([a.update(saved.id, 1, PRESETS[2].set), a.update(saved.id, 1, PRESETS[3].set)]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const failure = results.find((result) => result.status === "rejected");
    expect(failure?.status === "rejected" && failure.reason.status).toBe(409);
    expect((await a.get(saved.id)).revision).toBe(2);
  });
  it("paginates with stable timestamp/id cursors without exposing full documents", async () => {
    for (let index = 0; index < 25; index++) await b.create({ ...PRESETS[1].set, name: `Set ${index}` });
    const first = await b.list();
    expect(first.items).toHaveLength(24);
    expect(first.nextCursor).not.toBeNull();
    expect(first.items.every((item) => !("set" in item) && !("ownerId" in item))).toBe(true);
    const second = await b.list(first.nextCursor!);
    expect(second.items).toHaveLength(1);
    expect(second.nextCursor).toBeNull();
    expect(new Set([...first.items, ...second.items].map((item) => item.id)).size).toBe(25);
    const all = await db.select({ id: savedSets.id }).from(savedSets).where(eq(savedSets.ownerId, owners[1]));
    expect(all).toHaveLength(25);
  });
});
