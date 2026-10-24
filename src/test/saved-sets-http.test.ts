import { describe, expect, it, vi } from "vitest";
import { createSavedSetHandlers } from "@/lib/saved-sets/http";
import type { SavedSetRepository } from "@/lib/saved-sets/model";
import { PRESETS } from "@/lib/tokens/presets";

const base = "https://linework.example";
function request(method = "POST", body: unknown = { set: PRESETS[1].set }, origin = base) {
  return new Request(`${base}/api/sets`, { method, headers: { "Content-Type": "application/json", Origin: origin }, ...(method === "GET" ? {} : { body: JSON.stringify(body) }) });
}
function setup(userId: string | null = "user_a") {
  const repository: SavedSetRepository = { list: vi.fn(async () => ({ items: [], nextCursor: null })), get: vi.fn(async () => null), create: vi.fn(async () => { throw new Error("postgres://private-password@db.example"); }), update: vi.fn(async () => null), remove: vi.fn(async () => false) };
  const getRepository = vi.fn(() => repository);
  return { ...createSavedSetHandlers({ getUserId: async () => userId, getRepository }), getRepository, repository };
}

describe("saved-set request boundary", () => {
  it("rejects anonymous requests before touching the database", async () => {
    const handlers = setup(null);
    const response = await handlers.collection.POST(request());
    expect(response.status).toBe(401);
    expect(handlers.getRepository).not.toHaveBeenCalled();
  });
  it("rejects cross-origin writes and malformed JSON without querying storage", async () => {
    const handlers = setup();
    expect((await handlers.collection.POST(request("POST", {}, "https://elsewhere.example"))).status).toBe(403);
    expect((await handlers.collection.POST(new Request(`${base}/api/sets`, { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: "{" }))).status).toBe(400);
    expect(handlers.repository.create).not.toHaveBeenCalled();
  });
  it("bounds incoming bodies and rejects forged ownership fields", async () => {
    const handlers = setup();
    expect((await handlers.collection.POST(request("POST", { blob: "x".repeat(1_000_001) }))).status).toBe(413);
    expect((await handlers.collection.POST(request("POST", { set: PRESETS[1].set, ownerId: "user_b" }))).status).toBe(400);
    expect(handlers.repository.create).not.toHaveBeenCalled();
  });
  it("marks personalized reads no-store and validates cursors", async () => {
    const handlers = setup();
    const response = await handlers.collection.GET(request("GET"));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ items: [], nextCursor: null });
    expect((await handlers.collection.GET(new Request(`${base}/api/sets?cursor=bad`))).status).toBe(400);
  });
  it("never returns database failure details to the client", async () => {
    const handlers = setup();
    const response = await handlers.collection.POST(request());
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("private-password");
  });
  it("validates item IDs, revision input and owner-scoped not-found responses", async () => {
    const handlers = setup();
    expect((await handlers.item.GET(request("GET"), "invalid")).status).toBe(400);
    expect((await handlers.item.GET(request("GET"), crypto.randomUUID())).status).toBe(404);
    expect((await handlers.item.PATCH(request("PATCH", { revision: 0, set: PRESETS[1].set }), crypto.randomUUID())).status).toBe(400);
    expect((await handlers.item.DELETE(request("DELETE", { revision: 1 }), crypto.randomUUID())).status).toBe(404);
  });
});
