/**
 * Colour normalisation. Every colour that enters Linework leaves here as
 * uppercase #RRGGBB, with alpha kept separately, because Mermaid's theming
 * engine accepts hex only.
 *
 * Colours outside sRGB are gamut-mapped in OKLCH (the CSS Color 4 method)
 * rather than clipped, so hue survives.
 */

import {
  converter,
  formatHex,
  modeA98,
  modeHsl,
  modeHwb,
  modeLab,
  modeLch,
  modeLrgb,
  modeOklab,
  modeOklch,
  modeP3,
  modeProphoto,
  modeRec2020,
  modeRgb,
  modeXyz50,
  modeXyz65,
  parse,
  toGamut,
  // Not a React hook; renamed so the hooks lint rule doesn't read it as one.
  useMode as registerMode,
  type Color,
} from "culori/fn";
import { parseHex } from "@/lib/contrast/wcag";

for (const mode of [
  modeRgb,
  modeLrgb,
  modeHsl,
  modeHwb,
  modeLab,
  modeLch,
  modeOklab,
  modeOklch,
  modeP3,
  modeA98,
  modeProphoto,
  modeRec2020,
  modeXyz50,
  modeXyz65,
]) {
  registerMode(mode);
}

export type NormalisedColour = {
  /** Uppercase #RRGGBB. */
  hex: string;
  /** 0–1; absent when the colour is opaque. */
  alpha?: number;
  /** True when the colour was outside sRGB and had to be moved inside it. */
  mapped: boolean;
};

/** Colour spaces a DTCG 2025.10 colour value may name. */
export const DTCG_COLOUR_SPACES = [
  "srgb",
  "srgb-linear",
  "hsl",
  "hwb",
  "lab",
  "lch",
  "oklab",
  "oklch",
  "display-p3",
  "a98-rgb",
  "prophoto-rgb",
  "rec2020",
  "xyz-d65",
  "xyz-d50",
] as const;

export type DtcgColourSpace = (typeof DTCG_COLOUR_SPACES)[number];

/** A component may be the keyword "none" (a missing channel, as in CSS). */
export type Component = number | "none";

const toRgb = converter("rgb");
const mapToSrgb = toGamut("rgb", "oklch");

/** Float error from conversions (p3 white is r = 1.0000001) is not out of gamut. */
const GAMUT_TOLERANCE = 1e-4;

function normaliseAlpha(alpha: number | undefined): number | undefined {
  if (alpha === undefined || !Number.isFinite(alpha) || alpha >= 1) return undefined;
  return Math.max(0, Math.round(alpha * 1000) / 1000);
}

function finish(color: Color): NormalisedColour | null {
  const rgb = toRgb(color);
  if (!rgb) return null;
  const channels = [rgb.r ?? 0, rgb.g ?? 0, rgb.b ?? 0];
  if (!channels.every(Number.isFinite)) return null;
  const inside = channels.every((c) => c >= -GAMUT_TOLERANCE && c <= 1 + GAMUT_TOLERANCE);
  const hex = formatHex(inside ? rgb : mapToSrgb(color));
  if (!hex) return null;
  const alpha = normaliseAlpha(color.alpha);
  return alpha === undefined
    ? { hex: hex.toUpperCase(), mapped: !inside }
    : { hex: hex.toUpperCase(), alpha, mapped: !inside };
}

/**
 * Any CSS colour: hex (3, 4, 6 or 8 digits), a named colour, `transparent`,
 * or a colour function (rgb, hsl, hwb, lab, lch, oklab, oklch, color()).
 * Returns null for anything else, including `currentColor` and `var()`.
 */
export function normaliseCssColour(input: string): NormalisedColour | null {
  const text = input.trim();
  // culori reads hex without the "#", so "700" or "fade" would become colours. CSS doesn't.
  if (/^[0-9a-f]+$/i.test(text)) return null;
  const parsed = parse(text);
  return parsed ? finish(parsed) : null;
}

/** Distinguishes an explicitly opaque colour from a hex-only edit preserving opacity. */
export function hasExplicitAlpha(input: string): boolean {
  return parse(input.trim())?.alpha !== undefined;
}

function channel(value: Component | undefined): number | undefined {
  return value === "none" ? undefined : value;
}

/** A DTCG 2025.10 structured colour: a colour space and three components. */
export function normaliseDtcgColour(
  space: DtcgColourSpace,
  components: readonly [Component, Component, Component],
  alpha?: number,
): NormalisedColour | null {
  const [a, b, c] = components.map(channel);
  // DTCG writes HSL and HWB percentages as 0–100; culori expects 0–1.
  const percent = (v: number | undefined) => (v === undefined ? undefined : v / 100);
  const color: Color = (() => {
    switch (space) {
      case "srgb":
        return { mode: "rgb", r: a, g: b, b: c };
      case "srgb-linear":
        return { mode: "lrgb", r: a, g: b, b: c };
      case "hsl":
        return { mode: "hsl", h: a, s: percent(b), l: percent(c) };
      case "hwb":
        return { mode: "hwb", h: a, w: percent(b), b: percent(c) };
      case "lab":
        return { mode: "lab", l: a, a: b, b: c };
      case "lch":
        return { mode: "lch", l: a, c: b, h: c };
      case "oklab":
        return { mode: "oklab", l: a, a: b, b: c };
      case "oklch":
        return { mode: "oklch", l: a, c: b, h: c };
      case "display-p3":
        return { mode: "p3", r: a, g: b, b: c };
      case "a98-rgb":
        return { mode: "a98", r: a, g: b, b: c };
      case "prophoto-rgb":
        return { mode: "prophoto", r: a, g: b, b: c };
      case "rec2020":
        return { mode: "rec2020", r: a, g: b, b: c };
      case "xyz-d65":
        return { mode: "xyz65", x: a, y: b, z: c };
      case "xyz-d50":
        return { mode: "xyz50", x: a, y: b, z: c };
    }
  })();
  return finish(alpha === undefined ? color : { ...color, alpha });
}

function toHex(channels: readonly number[]): string {
  return `#${channels
    .map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

/**
 * Composite a translucent colour over an opaque backdrop, in sRGB as
 * browsers do. Contrast is only defined for opaque colours.
 */
export function composite(hex: string, alpha: number, backdrop: string): string {
  const fg = parseHex(hex);
  const bg = parseHex(backdrop);
  const a = Math.min(1, Math.max(0, alpha));
  return toHex(fg.map((c, i) => c * a + bg[i] * (1 - a)));
}

/** Alpha for display, e.g. 0.5 → "50%" (design.md §2.2). */
export function formatAlpha(alpha: number): string {
  return `${Math.round(alpha * 100)}%`;
}
