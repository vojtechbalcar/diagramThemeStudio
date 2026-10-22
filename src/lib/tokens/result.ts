/**
 * What every token parser returns, and the id scheme they share.
 */

import type { Token } from "@/lib/model";

/** A token before it has an id. */
export type TokenDraft = Omit<Token, "id">;

/** A token that was read but not imported, or imported with a caveat. */
export type ParseWarning = { path: string; message: string };

/** The input couldn't be read at all. `line` is 1-based. */
export type ParseError = { message: string; line?: number };

export type ParseResult =
  | {
      ok: true;
      tokens: Token[];
      warnings: ParseWarning[];
      /** Tokens of types Linework doesn't use (spacing, shadows, …), left out silently. */
      skipped: number;
    }
  | { ok: false; error: ParseError };

/**
 * A stable id from the token's path (32-bit FNV-1a, base 36), so importing
 * the same file twice gives the same ids and a mapping survives a re-import.
 */
export function tokenId(path: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < path.length; i++) {
    hash ^= path.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `t${(hash >>> 0).toString(36)}`;
}

/** Give drafts ids. Paths are unique per parse; a hash collision gets a suffix. */
export function withIds(drafts: readonly TokenDraft[]): Token[] {
  const taken = new Set<string>();
  return drafts.map((draft) => {
    const base = tokenId(draft.path);
    let id = base;
    for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
    taken.add(id);
    return { id, ...draft };
  });
}

export function parsed(drafts: readonly TokenDraft[], warnings: ParseWarning[], skipped: number): ParseResult {
  return { ok: true, tokens: withIds(drafts), warnings, skipped };
}

/**
 * One warning for every colour moved into sRGB. A Tailwind v4 theme has
 * dozens of wide-gamut OKLCH colours; one line says it better than forty.
 */
export function gamutWarning(mapped: ReadonlyArray<{ path: string; hex: string }>): ParseWarning[] {
  if (mapped.length === 0) return [];
  const [first] = mapped;
  if (mapped.length === 1) {
    return [{ path: first.path, message: `Outside sRGB, so Linework uses the nearest colour it can show, ${first.hex}.` }];
  }
  const others = mapped.length - 1;
  return [
    {
      path: first.path,
      message: `This and ${others} other ${others === 1 ? "colour are" : "colours are"} outside sRGB, so Linework uses the nearest colours it can show.`,
    },
  ];
}

export function failed(message: string, line?: number): ParseResult {
  return { ok: false, error: line === undefined ? { message } : { message, line } };
}
