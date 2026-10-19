import { contrastRatio, higherContrast } from "./wcag";

/** The two fixed glyph colours for token bullets (design.md §1.6). */
export const GLYPH_DARK = "#0B0B0B";
export const GLYPH_LIGHT = "#FFFFFF";

/** Fills closer than this to the page background get a ring. */
const RING_THRESHOLD = 1.1;

export type TokenBulletLook = {
  glyph: "dark" | "light";
  /** Which page the fill would vanish into, if any. */
  ring: "near-white" | "near-black" | null;
};

/**
 * Glyph colour and ring for a token bullet. The ring is decided against both
 * possible page colours here; CSS picks the one for the current mode.
 */
export function tokenBulletLook(fill: string): TokenBulletLook {
  const glyph = higherContrast(fill, GLYPH_DARK, GLYPH_LIGHT) === GLYPH_DARK ? "dark" : "light";
  const ring =
    contrastRatio(fill, GLYPH_LIGHT) < RING_THRESHOLD
      ? "near-white"
      : contrastRatio(fill, GLYPH_DARK) < RING_THRESHOLD
        ? "near-black"
        : null;
  return { glyph, ring };
}
