import { z } from "zod";
import type { TokenSet } from "@/lib/model";
import { RevisionSchema, SavedSetIdSchema, SavedSetSchema, SavedSetsPageSchema } from "./model";

export class SavedSetRequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
async function request(path: string, init?: RequestInit): Promise<unknown> {
  let response: Response;
  try { response = await fetch(path, { credentials: "same-origin", cache: "no-store", ...init }); }
  catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new SavedSetRequestError(0, "Could not reach your saved sets. Check your connection and try again.");
  }
  if (response.status === 204) return undefined;
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsed = z.object({ error: z.string().min(1).max(500) }).safeParse(body);
    throw new SavedSetRequestError(response.status, parsed.success ? parsed.data.error : "Your saved sets could not be loaded. Try again.");
  }
  return body;
}
function read<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new SavedSetRequestError(0, "The saved-set response could not be read. Try again.");
  return parsed.data;
}
const json = (method: string, body: unknown): RequestInit => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
export async function listSavedSets(cursor?: string, signal?: AbortSignal) {
  return read(SavedSetsPageSchema, await request(`/api/sets${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`, { signal }));
}
export async function getSavedSet(id: string, signal?: AbortSignal) { return read(SavedSetSchema, await request(`/api/sets/${SavedSetIdSchema.parse(id)}`, { signal })); }
export async function createSavedSet(set: TokenSet) { return read(SavedSetSchema, await request("/api/sets", json("POST", { set }))); }
export async function updateSavedSet(id: string, revision: number, set: TokenSet) { return read(SavedSetSchema, await request(`/api/sets/${SavedSetIdSchema.parse(id)}`, json("PATCH", { set, revision }))); }
export async function deleteSavedSet(id: string, revision: number) { await request(`/api/sets/${SavedSetIdSchema.parse(id)}`, json("DELETE", { revision })); }
export function savedIdentity(search: string): { id: string; revision: number } | null {
  const query = new URLSearchParams(search);
  const id = SavedSetIdSchema.safeParse(query.get("set"));
  const rawRevision = query.get("rev");
  const revision = RevisionSchema.safeParse(rawRevision && /^\d+$/.test(rawRevision) ? Number(rawRevision) : null);
  return id.success && revision.success ? { id: id.data, revision: revision.data } : null;
}
export function rememberSavedSet(id: string, revision: number) {
  const url = new URL(window.location.href);
  url.searchParams.set("set", id); url.searchParams.set("rev", String(revision));
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}
