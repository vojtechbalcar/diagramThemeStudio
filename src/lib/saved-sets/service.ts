import type { TokenSet } from "@/lib/model";
import { MAX_SAVED_SET_BYTES, RevisionSchema, SavedSetIdSchema, SavedThemeSchema, decodeCursor, type SavedSetRepository } from "./model";

export class SavedSetError extends Error {
  constructor(public readonly status: number, message: string) { super(message); this.name = "SavedSetError"; }
}
function theme(input: unknown): TokenSet {
  const parsed = SavedThemeSchema.safeParse(input);
  if (!parsed.success) throw new SavedSetError(400, "This theme could not be saved. Check its tokens and mappings, then try again.");
  const set = { ...parsed.data, name: parsed.data.name.trim() || "Untitled set" };
  if (new TextEncoder().encode(JSON.stringify(set)).byteLength > MAX_SAVED_SET_BYTES) throw new SavedSetError(413, "This theme is too large to save. Use fewer tokens.");
  return set;
}
function identifier(id: string) { if (!SavedSetIdSchema.safeParse(id).success) throw new SavedSetError(400, "This saved-theme address is not valid."); }
function revision(value: number) { if (!RevisionSchema.safeParse(value).success) throw new SavedSetError(400, "This saved revision is not valid. Reopen the theme and try again."); }

export function createSavedSetService(repository: SavedSetRepository, ownerId: string) {
  if (!ownerId || ownerId.length > 256) throw new SavedSetError(401, "Sign in to access your saved themes.");
  const get = async (id: string) => {
    identifier(id);
    const saved = await repository.get(ownerId, id);
    if (!saved) throw new SavedSetError(404, "This saved theme is not available. It may have been deleted.");
    return saved;
  };
  return {
    async list(cursor?: string) {
      let decoded;
      try { decoded = decodeCursor(cursor); } catch { throw new SavedSetError(400, "This saved-set page is not valid. Reload your saved sets."); }
      return repository.list(ownerId, decoded);
    },
    get,
    async create(input: unknown) { return repository.create(ownerId, theme(input)); },
    async update(id: string, expected: number, input: unknown) {
      identifier(id); revision(expected);
      const saved = await repository.update(ownerId, id, expected, theme(input));
      if (saved) return saved;
      await get(id);
      throw new SavedSetError(409, "A newer revision was saved elsewhere. Reopen it or save your changes as a copy.");
    },
    async remove(id: string, expected: number) {
      identifier(id); revision(expected);
      if (await repository.remove(ownerId, id, expected)) return;
      await get(id);
      throw new SavedSetError(409, "This theme changed after you opened the list. Reload your saved sets before deleting it.");
    },
  };
}
