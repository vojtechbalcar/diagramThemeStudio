/**
 * Sample data for the /system specimen. Original colours, not taken from
 * any company's palette (design.md §8).
 */

import type { TokenGlyph } from "@/lib/theme/roles";

export type SampleToken = {
  glyph: TokenGlyph;
  role: string;
  path: string;
  hex: string;
};

export const SAMPLE_TOKENS: readonly SampleToken[] = [
  { glyph: "P", role: "Primary", path: "color.brand.primary", hex: "#2F5BD3" },
  { glyph: "S", role: "Secondary", path: "color.brand.secondary", hex: "#E8B931" },
  { glyph: "T", role: "Tertiary", path: "color.brand.tertiary", hex: "#3F8F6A" },
  { glyph: "L", role: "Line", path: "color.line", hex: "#121212" },
  { glyph: "B", role: "Background", path: "color.surface.base", hex: "#FBFAF6" },
  { glyph: "N", role: "Note", path: "color.note", hex: "#F3E3B3" },
];

export type SamplePair = {
  name: string;
  text: string;
  fill: string;
};

/** One pair per verdict, so every annotation symbol appears. */
export const SAMPLE_PAIRS: readonly SamplePair[] = [
  { name: "Note text on note fill", text: "#3B3B3B", fill: "#F3E3B3" },
  { name: "Primary text on primary fill", text: "#FFFFFF", fill: "#2F5BD3" },
  { name: "Line on background", text: "#8A8A8A", fill: "#FBFAF6" },
  { name: "Secondary text on secondary fill", text: "#FFFFFF", fill: "#E8B931" },
];
