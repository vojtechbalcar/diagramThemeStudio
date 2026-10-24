/**
 * WCAG 2.x relative luminance, contrast ratio and verdicts.
 *
 * Inputs are hex colours (#RGB or #RRGGBB). Everything that reaches this
 * module has already been normalised by the token parsers; alpha is
 * composited before a colour gets here.
 */

export type Rgb = readonly [r: number, g: number, b: number];

export type Verdict = "aaa" | "aa" | "large" | "fail";

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isHex(value: string): boolean {
  return HEX.test(value);
}

export function parseHex(hex: string): Rgb {
  if (!isHex(hex)) {
    throw new Error(`Expected #RGB or #RRGGBB, got "${hex}".`);
  }
  const digits =
    hex.length === 4
      ? hex
          .slice(1)
          .split("")
          .map((d) => d + d)
          .join("")
      : hex.slice(1);
  return [
    parseInt(digits.slice(0, 2), 16),
    parseInt(digits.slice(2, 4), 16),
    parseInt(digits.slice(4, 6), 16),
  ];
}

function linearise(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** ≥ 7 AAA, ≥ 4.5 AA, ≥ 3 large text and non-text only, < 3 fail. */
export function verdict(ratio: number): Verdict {
  if (ratio >= 7) return "aaa";
  if (ratio >= 4.5) return "aa";
  if (ratio >= 3) return "large";
  return "fail";
}

/**
 * One decimal in colon notation, e.g. "4.8:1". Truncated rather than
 * rounded, so a displayed 4.5:1 always passes AA (4.48 shows as 4.4:1).
 */
export function formatRatio(ratio: number): string {
  const truncated = Math.floor(ratio * 10 + 1e-9) / 10;
  return `${truncated.toFixed(1)}:1`;
}

/** Whichever candidate has the higher contrast against `fill` (first wins a tie). */
export function higherContrast<T extends string>(fill: string, first: T, second: T): T {
  return contrastRatio(fill, first) >= contrastRatio(fill, second) ? first : second;
}
