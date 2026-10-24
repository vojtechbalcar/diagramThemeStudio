import { afterEach, expect, it, vi } from "vitest";
import { createSavedSet, getSavedSet, savedIdentity } from "@/lib/saved-sets/client";
import { PRESETS } from "@/lib/tokens/presets";

afterEach(() => vi.unstubAllGlobals());
it("accepts only complete saved identities for updates", () => {
  const id = crypto.randomUUID();
  expect(savedIdentity(`?set=${id}&rev=2`)).toEqual({ id, revision: 2 });
  for (const query of [`?set=${id}`, `?set=${id}&rev=0`, "?set=bad&rev=1"]) expect(savedIdentity(query)).toBeNull();
});
it("validates successful server responses before restoring a theme", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ set: {} })));
  await expect(getSavedSet(crypto.randomUUID())).rejects.toThrow("could not be read");
});
it("sends same-origin uncached JSON and retains conflict status", async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ error: "This set changed. Save a copy." }, { status: 409 }));
  vi.stubGlobal("fetch", fetcher);
  await expect(createSavedSet(PRESETS[1].set)).rejects.toMatchObject({ status: 409, message: "This set changed. Save a copy." });
  expect(fetcher.mock.calls[0][1]).toMatchObject({ method: "POST", cache: "no-store", credentials: "same-origin", headers: { "Content-Type": "application/json" } });
});
