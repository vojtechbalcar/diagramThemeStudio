import { describe, expect, it } from "vitest";
import { PRESETS } from "@/lib/tokens/presets";
import { createSavedSetService, SavedSetError } from "@/lib/saved-sets/service";
import { decodeCursor, encodeCursor, metadataFor, SavedSetSchema, SavedSetSummarySchema, type SavedSet, type SavedSetRepository } from "@/lib/saved-sets/model";

function repository() {
  const rows = new Map<string, SavedSet & { owner: string }>();
  const api: SavedSetRepository = {
    async list(owner) { return { items: [...rows.values()].filter((row) => row.owner === owner).map((row) => SavedSetSummarySchema.parse(row)), nextCursor: null }; },
    async get(owner, id) { const row = rows.get(id); if (!row || row.owner !== owner) return null; return SavedSetSchema.parse(row); },
    async create(owner, set) { const date = new Date().toISOString(); const document = { id: crypto.randomUUID(), ...metadataFor(set), set: structuredClone(set), revision: 1, createdAt: date, updatedAt: date }; rows.set(document.id, { ...document, owner }); return document; },
    async update(owner, id, revision, set) { const row = rows.get(id); if (!row || row.owner !== owner || row.revision !== revision) return null; const document = { ...row, ...metadataFor(set), set: structuredClone(set), revision: row.revision + 1, updatedAt: new Date().toISOString() }; rows.set(id, document); return SavedSetSchema.parse(document); },
    async remove(owner, id, revision) { const row = rows.get(id); return !!row && row.owner === owner && row.revision === revision && rows.delete(id); },
  };
  return api;
}

describe("private saved themes", () => {
  it("validates full themes and normalizes their names before persisting", async () => {
    const service = createSavedSetService(repository(), "user_a");
    const saved = await service.create({ ...PRESETS[1].set, name: "  Signal  " });
    expect(saved.name).toBe("Signal");
    expect(saved.set.name).toBe("Signal");
    expect(saved.tokenCount).toBe(PRESETS[1].set.tokens.length);
    expect(saved.colors).toEqual(PRESETS[1].set.tokens.filter((token) => token.type === "color").slice(0, 4).map((token) => token.value));
    await expect(service.create({ ...PRESETS[1].set, tokens: [] })).rejects.toMatchObject({ status: 400 });
    await expect(service.create({ ...PRESETS[1].set, mapping: { primaryColor: { tokenId: "missing", auto: false } } })).rejects.toMatchObject({ status: 400 });
  });
  it("never lists, reads, changes or deletes another owner's document", async () => {
    const store = repository();
    const a = createSavedSetService(store, "user_a"), b = createSavedSetService(store, "user_b");
    const saved = await a.create(PRESETS[1].set);
    expect((await b.list()).items).toEqual([]);
    await expect(b.get(saved.id)).rejects.toMatchObject({ status: 404 });
    await expect(b.update(saved.id, saved.revision, PRESETS[2].set)).rejects.toMatchObject({ status: 404 });
    await expect(b.remove(saved.id, saved.revision)).rejects.toMatchObject({ status: 404 });
    expect((await a.get(saved.id)).set.name).toBe("Signal");
  });
  it("detects stale updates and deletes without changing the newer record", async () => {
    const service = createSavedSetService(repository(), "user_a");
    const saved = await service.create(PRESETS[1].set);
    const newer = await service.update(saved.id, 1, PRESETS[2].set);
    expect(newer.revision).toBe(2);
    await expect(service.update(saved.id, 1, PRESETS[3].set)).rejects.toMatchObject({ status: 409 });
    await expect(service.remove(saved.id, 1)).rejects.toMatchObject({ status: 409 });
    expect((await service.get(saved.id)).set.name).toBe("Forest");
    await service.remove(saved.id, 2);
    await expect(service.get(saved.id)).rejects.toMatchObject({ status: 404 });
  });
  it("requires an owner and validates document identifiers and revisions", async () => {
    expect(() => createSavedSetService(repository(), "")).toThrow(SavedSetError);
    const service = createSavedSetService(repository(), "user_a");
    await expect(service.get("bad-id")).rejects.toMatchObject({ status: 400 });
    await expect(service.update(crypto.randomUUID(), 0, PRESETS[1].set)).rejects.toMatchObject({ status: 400 });
  });
  it("rejects strings Postgres cannot persist before calling the repository", async () => {
    const store = repository();
    const service = createSavedSetService(store, "user_a");
    for (const name of ["Signal\u0000", "Signal\ud800", "Signal\udc00"]) {
      await expect(service.create({ ...PRESETS[1].set, name })).rejects.toMatchObject({ status: 400 });
    }
    expect((await service.list()).items).toEqual([]);
    expect((await service.create({ ...PRESETS[1].set, name: "Signal 🎨" })).name).toBe("Signal 🎨");
  });
  it("round-trips bounded keyset cursors and rejects malformed values", () => {
    const cursor = { id: crypto.randomUUID(), updatedAt: "2026-10-22T12:00:00.000Z" };
    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
    expect(decodeCursor(undefined)).toBeUndefined();
    for (const input of ["invalid", "x".repeat(513), btoa(JSON.stringify({ id: "missing", updatedAt: "yesterday" }))]) expect(() => decodeCursor(input)).toThrow();
  });
});
