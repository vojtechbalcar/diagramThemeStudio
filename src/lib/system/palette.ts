/**
 * The interface palette and semantic tokens as data, for the /system
 * specimen. globals.css is the source of truth; src/test/palette.test.ts
 * fails if the two drift apart.
 */

export type PaletteColour = {
  token: string;
  hex: string;
  use: string;
};

export type SemanticToken = {
  token: string;
  light: string;
  dark: string;
  use: string;
};

export const PALETTE: readonly PaletteColour[] = [
  { token: "--lw-black", hex: "#0B0B0B", use: "Light-mode ink, band fill" },
  { token: "--lw-white", hex: "#FFFFFF", use: "Light-mode page, dark-mode ink" },
  { token: "--lw-grey-50", hex: "#F4F4F4", use: "Recessed areas, inputs" },
  { token: "--lw-grey-200", hex: "#D6D6D6", use: "Hairline rules, disabled frames" },
  { token: "--lw-grey-500", hex: "#6B6B6B", use: "Secondary text, metadata" },
  { token: "--lw-grey-800", hex: "#2E2E2E", use: "Ink hover, secondary band" },
  { token: "--lw-signal", hex: "#D7261E", use: "Failure and destruction only" },
];

export const SEMANTIC: readonly SemanticToken[] = [
  { token: "--lw-page", light: "#FFFFFF", dark: "#0B0B0B", use: "Page background" },
  { token: "--lw-text", light: "#0B0B0B", dark: "#FFFFFF", use: "Primary text" },
  { token: "--lw-text-muted", light: "#6B6B6B", dark: "#9A9A9A", use: "Secondary text" },
  { token: "--lw-ink", light: "#0B0B0B", dark: "#FFFFFF", use: "Interface ink" },
  { token: "--lw-on-ink", light: "#FFFFFF", dark: "#0B0B0B", use: "Text on an ink fill" },
  { token: "--lw-ink-hover", light: "#2E2E2E", dark: "#D6D6D6", use: "Hover of ink fills" },
  { token: "--lw-band", light: "#0B0B0B", dark: "#1E1E1E", use: "Band fill" },
  { token: "--lw-band-2", light: "#2E2E2E", dark: "#262626", use: "Secondary band fill" },
  { token: "--lw-band-text", light: "#FFFFFF", dark: "#FFFFFF", use: "Text and pinstripe on bands" },
  { token: "--lw-band-rule", light: "#0B0B0B", dark: "#3A3A3A", use: "Band bottom rule" },
  { token: "--lw-rule-color", light: "#D6D6D6", dark: "#2E2E2E", use: "Hairline rules" },
  { token: "--lw-recess", light: "#F4F4F4", dark: "#161616", use: "Inputs, recessed areas" },
  { token: "--lw-signal", light: "#D7261E", dark: "#FF4B3E", use: "Failure and destruction" },
  { token: "--lw-focus", light: "#0B0B0B", dark: "#FFFFFF", use: "Focus ring on the page" },
];

export function semanticToken(token: string): SemanticToken {
  const found = SEMANTIC.find((entry) => entry.token === token);
  if (!found) throw new Error(`Unknown semantic token "${token}".`);
  return found;
}
