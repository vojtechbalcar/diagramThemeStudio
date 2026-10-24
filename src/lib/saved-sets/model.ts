import { z } from "zod";
import { HEX_COLOUR, TokenSetSchema, type TokenSet } from "@/lib/model";

export const SAVED_SET_PAGE_SIZE = 24;
export const MAX_SAVED_SET_BYTES = 1_000_000;
export const SavedSetIdSchema = z.uuid();
export const RevisionSchema = z.number().int().positive().max(2_147_483_646);
export const SavedThemeSchema = TokenSetSchema
  .refine((set) => set.tokens.length > 0, "Add at least one token before saving a theme.")
  .refine((set) => [set.name, ...set.tokens.flatMap((token) => [token.id, token.path, token.value])].every((value) => !value.includes("\u0000") && !/[\uD800-\uDFFF]/u.test(value)), "Remove invalid Unicode characters before saving this theme.");
export const SavedSetSummarySchema = z.object({
  id: SavedSetIdSchema, name: z.string().min(1).max(80), revision: RevisionSchema,
  tokenCount: z.number().int().min(1).max(1000), colors: z.array(z.string().regex(HEX_COLOUR)).max(4), updatedAt: z.iso.datetime(),
});
export const SavedSetSchema = SavedSetSummarySchema.extend({ set: SavedThemeSchema, createdAt: z.iso.datetime() });
export const SavedSetsPageSchema = z.object({ items: z.array(SavedSetSummarySchema).max(SAVED_SET_PAGE_SIZE), nextCursor: z.string().max(512).nullable() });
export const CursorSchema = z.strictObject({ id: SavedSetIdSchema, updatedAt: z.iso.datetime() });
export const AccountSchema = z.object({ available: z.boolean(), userId: z.string().min(1).max(256).nullable() });
export type Account = z.infer<typeof AccountSchema>;
export type SavedSet = z.infer<typeof SavedSetSchema>;
export type SavedSetSummary = z.infer<typeof SavedSetSummarySchema>;
export type SavedSetsPage = z.infer<typeof SavedSetsPageSchema>;
export type SavedSetCursor = z.infer<typeof CursorSchema>;

export function metadataFor(set: TokenSet) {
  return { name: set.name, tokenCount: set.tokens.length, colors: set.tokens.filter((token) => token.type === "color").slice(0, 4).map((token) => token.value) };
}
export function encodeCursor(cursor: SavedSetCursor): string {
  return btoa(JSON.stringify(CursorSchema.parse(cursor))).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
export function decodeCursor(value?: string): SavedSetCursor | undefined {
  if (value === undefined) return undefined;
  if (!value || value.length > 512 || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("The saved-set page could not be read. Reload your saved sets.");
  try { return CursorSchema.parse(JSON.parse(atob(value.replaceAll("-", "+").replaceAll("_", "/")))); }
  catch { throw new Error("The saved-set page could not be read. Reload your saved sets."); }
}

/** Every operation carries an authenticated owner; IDs never establish ownership. */
export interface SavedSetRepository {
  list(ownerId: string, cursor?: SavedSetCursor): Promise<SavedSetsPage>;
  get(ownerId: string, id: string): Promise<SavedSet | null>;
  create(ownerId: string, set: TokenSet): Promise<SavedSet>;
  update(ownerId: string, id: string, revision: number, set: TokenSet): Promise<SavedSet | null>;
  remove(ownerId: string, id: string, revision: number): Promise<boolean>;
}
